
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  StoreProfile, SaleRecord, Product, InventoryItem, StockMovement, 
  Invoice, ForecastRecord, PlanningConfig, MovementType, Supplier, 
  VendorBill, Expense 
} from '../types';
import { 
  generateMockStores, generateMockHistory, generateMockProducts, 
  generateMockInventory, generateMockStockMovements, generateMockInvoices,
  generateMockSuppliers, generateMockBills, generateMockExpenses 
} from '../utils/dataUtils';
import { generateForecast } from '../services/geminiService';

interface ERPContextType {
  // Master Data
  stores: StoreProfile[];
  products: Product[];
  suppliers: Supplier[];
  
  // Transactional Data
  history: SaleRecord[];
  inventory: InventoryItem[];
  movements: StockMovement[];
  invoices: Invoice[]; // AR
  bills: VendorBill[]; // AP
  expenses: Expense[];
  
  // Planning
  forecasts: ForecastRecord[];
  planningConfig: PlanningConfig;
  
  // System State
  loading: boolean;
  
  // Actions ( The Nerve System )
  actions: {
    recordStockTransaction: (data: { date: string, type: MovementType, storeId: string, productId: string, variant: string, quantity: number, reference: string }) => void;
    recordPayment: (invoiceIds: string[], amount: number, method: string, ref: string) => void;
    payBill: (billId: string, amount: number) => void;
    addBill: (bill: VendorBill) => void;
    addExpense: (expense: Expense) => void;
    updateTarget: (year: number, month: number, brand: string, counter: string, amount: number) => void;
    updateMargin: (brand: string, margin: number) => void;
    updateStockCover: (brand: string, counter: string, months: number) => void;
    saveMarkdown: (productId: string, price: number) => void;
    editRecord: (record: SaleRecord) => void;
    deleteRecord: (id: string) => void;
    bulkDeleteRecords: (ids: string[]) => void;
    importData: (type: string, data: any[]) => void;
  };
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Data State ---
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [history, setHistory] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // --- Planning State ---
  const [forecasts, setForecasts] = useState<ForecastRecord[]>([]);
  const [planningConfig, setPlanningConfig] = useState<PlanningConfig>({
    targets: {},
    margins: {},
    targetStockCover: {}
  });

  const [loading, setLoading] = useState(true);

  // --- Initialization (The Genesis) ---
  useEffect(() => {
    const loadData = async () => {
      const _suppliers = generateMockSuppliers();
      const _stores = generateMockStores();
      const _history = generateMockHistory(_stores);
      const _products = generateMockProducts(_suppliers);
      const _inventory = generateMockInventory(_stores, _products);
      const _movements = generateMockStockMovements(_inventory, _products);
      const _invoices = generateMockInvoices(_stores);
      const _bills = generateMockBills(_suppliers);
      const _expenses = generateMockExpenses(_stores);

      setSuppliers(_suppliers);
      setStores(_stores);
      setHistory(_history);
      setProducts(_products);
      setInventory(_inventory);
      setMovements(_movements);
      setInvoices(_invoices);
      setBills(_bills);
      setExpenses(_expenses);

      // Async Forecast Generation
      const forecastResponse = await generateForecast(_history, new Date().getFullYear() + 1, { useAI: false });
      setForecasts(forecastResponse.forecasts);

      setLoading(false);
    };

    loadData();
  }, []);

  // --- Actions ---

  const handleUpdateTarget = (year: number, month: number, brand: string, counter: string, amount: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}|${brand}|${counter}`;
    setPlanningConfig(prev => ({ ...prev, targets: { ...prev.targets, [key]: amount } }));
  };

  const handleUpdateMargin = (brand: string, margin: number) => {
    setPlanningConfig(prev => ({ ...prev, margins: { ...prev.margins, [brand]: margin } }));
  };

  const handleUpdateStockCover = (brand: string, counter: string, months: number) => {
    const key = `${brand}|${counter}`;
    setPlanningConfig(prev => ({ ...prev, targetStockCover: { ...prev.targetStockCover, [key]: months } }));
  };

  const handleRecordPayment = (invoiceIds: string[], amount: number, method: string, ref: string) => {
    setInvoices(prev => prev.map(inv => {
        if (invoiceIds.includes(inv.id)) {
            const due = inv.amount - (inv.paidAmount || 0);
            const paid = (inv.paidAmount || 0) + Math.min(due, amount); 
            const status = paid >= inv.amount ? 'Paid' as const : 'Partial' as const;
            return { 
              ...inv, 
              paidAmount: paid, 
              status, 
              payments: [...(inv.payments || []), {id: Date.now().toString(), date: new Date().toISOString().split('T')[0], amount, method, reference: ref}] 
            };
        }
        return inv;
    }));
  };

  const handlePayBill = (billId: string, amount: number) => {
     setBills(prev => prev.map(b => {
        if(b.id === billId) {
           return { ...b, paidAmount: b.paidAmount + amount, status: 'Paid' as const };
        }
        return b;
     }));
  };

  const handleAddBill = (bill: VendorBill) => {
    setBills(prev => [bill, ...prev]);
  };

  const handleAddExpense = (expense: Expense) => {
     setExpenses(prev => [...prev, expense]);
  };

  const handleDeleteRecord = (id: string) => {
    setHistory(prev => prev.filter(r => r.id !== id));
    // Cascade delete linked invoices via movement
    const linkedMovement = movements.find(m => m.linkedSaleId === id);
    if (linkedMovement && linkedMovement.linkedInvoiceId) {
       setInvoices(prev => prev.filter(inv => inv.id !== linkedMovement.linkedInvoiceId));
    }
  };

  const handleBulkDelete = (ids: string[]) => {
    setHistory(prev => prev.filter(r => !ids.includes(r.id)));
    const linkedInvoiceIds: string[] = [];
    movements.forEach(m => {
       if (m.linkedSaleId && ids.includes(m.linkedSaleId) && m.linkedInvoiceId) {
          linkedInvoiceIds.push(m.linkedInvoiceId);
       }
    });
    if (linkedInvoiceIds.length > 0) {
       setInvoices(prev => prev.filter(inv => !linkedInvoiceIds.includes(inv.id)));
    }
  };

  const handleEditRecord = (record: SaleRecord) => {
     const existing = history.find(r => r.id === record.id);
     if (existing) {
        setHistory(prev => prev.map(r => r.id === record.id ? record : r));
        // Cascade update invoice amount if amount changed
        if (existing.amount !== record.amount) {
           const linkedMovement = movements.find(m => m.linkedSaleId === record.id);
           if (linkedMovement && linkedMovement.linkedInvoiceId) {
              setInvoices(prev => prev.map(inv => {
                 if (inv.id === linkedMovement.linkedInvoiceId) {
                    const store = stores.find(s => s.id === inv.storeId);
                    const marginPct = store?.margins[record.brand] || 25;
                    const newNet = record.amount * (1 - (marginPct / 100));
                    return { ...inv, amount: newNet };
                 }
                 return inv;
              }));
           }
        }
     } else {
        setHistory(prev => [record, ...prev]);
     }
  };

  const handleSaveMarkdown = (productId: string, price: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, markdownPrice: price > 0 ? price : undefined };
      }
      return p;
    }));
  };

  // --- Unified Transaction Engine ---
  const handleRecordStockTransaction = (data: { date: string, type: MovementType, storeId: string, productId: string, variant: string, quantity: number, reference: string }) => {
     const product = products.find(p => p.id === data.productId);
     const store = stores.find(s => s.id === data.storeId);
     
     if (!product || !store) return;

     let qty = data.quantity;
     if (['Sale', 'Transfer Out'].includes(data.type)) qty = -Math.abs(data.quantity);
     else if (['Restock', 'Transfer In', 'Return'].includes(data.type)) qty = Math.abs(data.quantity);

     const saleId = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
     const invoiceId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

     // 1. Create Stock Movement Record
     const newMove: StockMovement = {
        id: `mov-${Date.now()}`,
        date: data.date,
        type: data.type,
        storeId: data.storeId,
        storeName: store.name,
        productId: data.productId,
        productName: product.name,
        sku: product.sku,
        variant: data.variant,
        quantity: qty,
        reference: data.reference,
        linkedSaleId: data.type === 'Sale' || data.type === 'Return' ? saleId : undefined,
        linkedInvoiceId: data.type === 'Sale' || data.type === 'Return' ? invoiceId : undefined
     };
     setMovements(prev => [newMove, ...prev]);

     // 2. Update Physical Inventory
     setInventory(prev => {
        const existing = prev.find(i => i.storeId === data.storeId && i.productId === data.productId);
        if (existing) {
           const newQty = existing.quantity + qty;
           const newVariants = { ...existing.variantQuantities };
           newVariants[data.variant] = (newVariants[data.variant] || 0) + qty;
           return prev.map(i => i === existing ? { ...i, quantity: newQty, variantQuantities: newVariants } : i);
        } else {
           return [...prev, {
              id: `inv-${Date.now()}`,
              storeId: data.storeId,
              storeName: store.name,
              productId: data.productId,
              productName: product.name,
              sku: product.sku,
              brand: product.brand,
              quantity: qty,
              variantQuantities: { [data.variant]: qty }
           }];
        }
     });

     // 3. Financial Interconnectivity (AR Generation)
     if (data.type === 'Sale') {
        const saleAmount = (product.markdownPrice || product.price) * Math.abs(qty);
        const newSale: SaleRecord = {
           id: saleId,
           date: data.date,
           brand: product.brand,
           counter: store.name,
           amount: saleAmount
        };
        setHistory(prev => [...prev, newSale]);

        const marginPct = store.margins[product.brand] || 25;
        const deduction = saleAmount * (marginPct / 100);
        const netReceivable = saleAmount - deduction;
        
        const dueDate = new Date(data.date);
        dueDate.setDate(dueDate.getDate() + store.creditTerm);

        const newInvoice: Invoice = {
           id: invoiceId,
           type: 'Invoice',
           storeId: store.id,
           storeName: store.name,
           brand: product.brand,
           amount: netReceivable,
           paidAmount: 0,
           issueDate: data.date,
           dueDate: dueDate.toISOString().split('T')[0],
           status: 'Unpaid',
           payments: [],
           linkedReference: data.reference
        };
        setInvoices(prev => [...prev, newInvoice]);
     } 
     else if (data.type === 'Return') {
        const returnAmount = (product.markdownPrice || product.price) * Math.abs(data.quantity);
        const newSale: SaleRecord = {
           id: saleId,
           date: data.date,
           brand: product.brand,
           counter: store.name,
           amount: -returnAmount
        };
        setHistory(prev => [...prev, newSale]);

        const marginPct = store.margins[product.brand] || 25;
        const deduction = returnAmount * (marginPct / 100);
        const netRefundable = returnAmount - deduction;

        const newCreditNote: Invoice = {
           id: invoiceId,
           type: 'Credit Note',
           storeId: store.id,
           storeName: store.name,
           brand: product.brand,
           amount: -netRefundable,
           paidAmount: 0,
           issueDate: data.date,
           dueDate: data.date, 
           status: 'Unpaid',
           payments: [],
           linkedReference: data.reference
        };
        setInvoices(prev => [...prev, newCreditNote]);
     }
  };

  const handleImportData = (type: string, data: any[]) => {
      if(type === 'sales') setHistory(prev => [...prev, ...data]);
      if(type === 'stores') setStores(prev => [...prev, ...data]);
      if(type === 'products') setProducts(prev => [...prev, ...data]);
      // Implement other imports as needed
  };

  return (
    <ERPContext.Provider value={{
      stores, products, suppliers, history, inventory, movements, invoices, bills, expenses,
      forecasts, planningConfig, loading,
      actions: {
        recordStockTransaction: handleRecordStockTransaction,
        recordPayment: handleRecordPayment,
        payBill: handlePayBill,
        addBill: handleAddBill,
        addExpense: handleAddExpense,
        updateTarget: handleUpdateTarget,
        updateMargin: handleUpdateMargin,
        updateStockCover: handleUpdateStockCover,
        saveMarkdown: handleSaveMarkdown,
        editRecord: handleEditRecord,
        deleteRecord: handleDeleteRecord,
        bulkDeleteRecords: handleBulkDelete,
        importData: handleImportData
      }
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
