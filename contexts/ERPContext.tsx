
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
  stores: StoreProfile[];
  products: Product[];
  suppliers: Supplier[];
  history: SaleRecord[];
  inventory: InventoryItem[];
  movements: StockMovement[];
  invoices: Invoice[]; 
  bills: VendorBill[]; 
  expenses: Expense[];
  forecasts: ForecastRecord[];
  planningConfig: PlanningConfig;
  loading: boolean;
  isSynced: boolean;
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
    resetData: () => void;
  };
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const STORAGE_KEY = 'salescast_erp_data_v2'; // Changed key to reset to optimized data

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [history, setHistory] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [forecasts, setForecasts] = useState<ForecastRecord[]>([]);
  const [planningConfig, setPlanningConfig] = useState<PlanningConfig>({
    targets: {},
    margins: {},
    targetStockCover: {}
  });
  const [loading, setLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setStores(parsed.stores || []);
        setHistory(parsed.history || []);
        setProducts(parsed.products || []);
        setInventory(parsed.inventory || []);
        setMovements(parsed.movements || []);
        setInvoices(parsed.invoices || []);
        setSuppliers(parsed.suppliers || []);
        setBills(parsed.bills || []);
        setExpenses(parsed.expenses || []);
        setPlanningConfig(parsed.planningConfig || { targets: {}, margins: {}, targetStockCover: {} });
        
        generateForecast(parsed.history || [], new Date().getFullYear() + 1, { useAI: false })
          .then(res => setForecasts(res.forecasts));
          
        setLoading(false);
        setIsSynced(true);
      } catch (e) {
        initializeDefaultData();
      }
    } else {
      initializeDefaultData();
    }
  }, []);

  const initializeDefaultData = async () => {
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

    const forecastResponse = await generateForecast(_history, new Date().getFullYear() + 1, { useAI: false });
    setForecasts(forecastResponse.forecasts);
    setLoading(false);
    setIsSynced(true);
  };

  useEffect(() => {
    if (!loading) {
      const dataToSave = {
        stores, history, products, inventory, movements, invoices, suppliers, bills, expenses, planningConfig
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        setIsSynced(false);
        const timer = setTimeout(() => setIsSynced(true), 500);
        return () => clearTimeout(timer);
      } catch (e) {
        console.warn("LocalStorage quota exceeded. Data may not persist between sessions.");
      }
    }
  }, [stores, history, products, inventory, movements, invoices, suppliers, bills, expenses, planningConfig, loading]);

  const handleRecordStockTransaction = (data: { date: string, type: MovementType, storeId: string, productId: string, variant: string, quantity: number, reference: string }) => {
     const product = products.find(p => p.id === data.productId);
     const store = stores.find(s => s.id === data.storeId);
     if (!product || !store) return;

     let qty = data.quantity;
     if (['Sale', 'Transfer Out'].includes(data.type)) qty = -Math.abs(data.quantity);
     else if (['Restock', 'Transfer In', 'Return'].includes(data.type)) qty = Math.abs(data.quantity);

     const saleId = `sale-${Date.now()}`;
     const invoiceId = `inv-${Date.now()}`;

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
        linkedSaleId: data.type === 'Sale' ? saleId : undefined,
        linkedInvoiceId: data.type === 'Sale' || data.type === 'Return' ? invoiceId : undefined
     };
     setMovements(prev => [newMove, ...prev]);

     setInventory(prev => {
        const existing = prev.find(i => i.storeId === data.storeId && i.productId === data.productId);
        if (existing) {
           const newVariants = { ...existing.variantQuantities };
           newVariants[data.variant] = (newVariants[data.variant] || 0) + qty;
           return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + qty, variantQuantities: newVariants } : i);
        } else {
           return [...prev, {
              id: `inv-${Date.now()}`,
              storeId: store.id,
              storeName: store.name,
              productId: product.id,
              sku: product.sku,
              productName: product.name,
              brand: product.brand,
              quantity: qty,
              variantQuantities: { [data.variant]: qty }
           }];
        }
     });

     if (data.type === 'Sale') {
        const amount = (product.markdownPrice || product.price) * Math.abs(qty);
        setHistory(prev => [{ id: saleId, date: data.date, brand: product.brand, counter: store.name, amount }, ...prev]);
        const marginPct = store.margins[product.brand] || 25;
        const netReceivable = amount * (1 - (marginPct / 100));
        const dueDate = new Date(data.date);
        dueDate.setDate(dueDate.getDate() + store.creditTerm);

        setInvoices(prev => [{
           id: invoiceId,
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
        }, ...prev]);
     }
  };

  const handleReset = () => {
    if (confirm("This will erase all your custom data and reload mocks. Continue?")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  return (
    <ERPContext.Provider value={{
      stores, products, suppliers, history, inventory, movements, invoices, bills, expenses,
      forecasts, planningConfig, loading, isSynced,
      actions: {
        recordStockTransaction: handleRecordStockTransaction,
        recordPayment: (ids, amt, meth, ref) => setInvoices(prev => prev.map(inv => ids.includes(inv.id) ? { ...inv, paidAmount: (inv.paidAmount||0) + amt, status: (inv.paidAmount||0) + amt >= inv.amount ? 'Paid' : 'Partial' } : inv)),
        payBill: (id, amt) => setBills(prev => prev.map(b => b.id === id ? { ...b, paidAmount: b.paidAmount + amt, status: 'Paid' } : b)),
        addBill: (b) => setBills(prev => [b, ...prev]),
        addExpense: (e) => setExpenses(prev => [e, ...prev]),
        updateTarget: (y, m, b, c, a) => setPlanningConfig(p => ({ ...p, targets: { ...p.targets, [`${y}-${String(m).padStart(2, '0')}|${b}|${c}`]: a } })),
        updateMargin: (b, m) => setPlanningConfig(p => ({ ...p, margins: { ...p.margins, [b]: m } })),
        updateStockCover: (b, c, m) => setPlanningConfig(p => ({ ...p, targetStockCover: { ...p.targetStockCover, [`${b}|${c}`]: m } })),
        saveMarkdown: (id, price) => setProducts(prev => prev.map(p => p.id === id ? { ...p, markdownPrice: price > 0 ? price : undefined } : p)),
        editRecord: (r) => setHistory(prev => prev.map(h => h.id === r.id ? r : h)),
        deleteRecord: (id) => setHistory(prev => prev.filter(h => h.id !== id)),
        bulkDeleteRecords: (ids) => setHistory(prev => prev.filter(h => !ids.includes(h.id))),
        importData: (type, data) => type === 'sales' ? setHistory(p => [...data, ...p]) : type === 'stores' ? setStores(p => [...data, ...p]) : setProducts(p => [...data, ...p]),
        resetData: handleReset
      }
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) throw new Error('useERP must be used within an ERPProvider');
  return context;
};
