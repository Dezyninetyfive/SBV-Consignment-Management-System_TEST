
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Package, 
  TrendingUp, 
  DollarSign, 
  MessageSquare, 
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { 
  generateMockStores, 
  generateMockHistory, 
  generateMockProducts, 
  generateMockInventory, 
  generateMockStockMovements, 
  generateMockInvoices,
  generateMockSuppliers
} from './utils/dataUtils';
import { 
  StoreProfile, 
  SaleRecord, 
  Product, 
  InventoryItem, 
  StockMovement, 
  Invoice, 
  ForecastRecord, 
  PlanningConfig,
  MovementType,
  Supplier
} from './types';

// Components
import { DashboardKPIs } from './components/DashboardKPIs';
import { DashboardARSummary } from './components/DashboardARSummary';
import { SalesIntelligence } from './components/SalesIntelligence';
import { MetricsGrid } from './components/MetricsGrid';
import { ChartsSection } from './components/ChartsSection';
import { PlanningView } from './components/PlanningView';
import { ForecastExplorer } from './components/ForecastExplorer';
import { InventoryManagement } from './components/InventoryManagement';
import { DataManagement } from './components/DataManagement';
import { AccountsReceivable } from './components/AccountsReceivable';
import { AIChatAssistant } from './components/AIChatAssistant';
import { SalesAnalysis } from './components/SalesAnalysis';
import { generateForecast } from './services/geminiService';
import { PaymentModal } from './components/PaymentModal';
import { ImportModal } from './components/ImportModal';
import { SystemHealth } from './components/SystemHealth';

export default function App() {
  // --- Data State ---
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [history, setHistory] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // --- Forecast & Planning State ---
  const [forecasts, setForecasts] = useState<ForecastRecord[]>([]);
  const [planningConfig, setPlanningConfig] = useState<PlanningConfig>({
    targets: {},
    margins: {},
    targetStockCover: {}
  });

  // --- UI State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [drillDownStore, setDrillDownStore] = useState<string | null>(null);

  // --- Modals State ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStore, setPaymentStore] = useState<StoreProfile | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'sales' | 'stores' | 'products' | 'inventory' | 'invoices' | 'stock_movements' | 'suppliers'>('sales');

  // --- Initialization ---
  useEffect(() => {
    const loadData = async () => {
      const _suppliers = generateMockSuppliers();
      const _stores = generateMockStores();
      const _history = generateMockHistory(_stores);
      const _products = generateMockProducts(_suppliers);
      const _inventory = generateMockInventory(_stores, _products);
      const _movements = generateMockStockMovements(_inventory, _products);
      const _invoices = generateMockInvoices(_stores);

      setSuppliers(_suppliers);
      setStores(_stores);
      setHistory(_history);
      setProducts(_products);
      setInventory(_inventory);
      setMovements(_movements);
      setInvoices(_invoices);

      const forecastResponse = await generateForecast(_history, new Date().getFullYear() + 1, { useAI: false });
      setForecasts(forecastResponse.forecasts);

      setLoading(false);
    };

    loadData();
  }, []);

  // --- Handlers ---
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

  // --- CASCADING DELETE LOGIC ---
  const handleDeleteRecord = (id: string) => {
    // 1. Remove from Sales History
    setHistory(prev => prev.filter(r => r.id !== id));

    // 2. Remove Linked Invoice (Cascade via Movement Link)
    const linkedMovement = movements.find(m => m.linkedSaleId === id);
    if (linkedMovement && linkedMovement.linkedInvoiceId) {
       setInvoices(prev => prev.filter(inv => inv.id !== linkedMovement.linkedInvoiceId));
    }
  };

  const handleBulkDelete = (ids: string[]) => {
    // 1. Remove from History
    setHistory(prev => prev.filter(r => !ids.includes(r.id)));

    // 2. Remove Linked Invoices
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

  // --- CASCADING EDIT LOGIC (New) ---
  const handleEditRecord = (record: SaleRecord) => {
     // Check if existing
     const existing = history.find(r => r.id === record.id);
     
     if (existing) {
        // 1. Update History
        setHistory(prev => prev.map(r => r.id === record.id ? record : r));

        // 2. Update Linked Invoice (If Amount Changed)
        if (existing.amount !== record.amount) {
           const linkedMovement = movements.find(m => m.linkedSaleId === record.id);
           if (linkedMovement && linkedMovement.linkedInvoiceId) {
              setInvoices(prev => prev.map(inv => {
                 if (inv.id === linkedMovement.linkedInvoiceId) {
                    const store = stores.find(s => s.id === inv.storeId);
                    // Recalculate Net
                    const marginPct = store?.margins[record.brand] || 25;
                    const newNet = record.amount * (1 - (marginPct / 100));
                    return { ...inv, amount: newNet };
                 }
                 return inv;
              }));
           }
        }
     } else {
        // Add New (Fallback for manual add in Data tab)
        setHistory(prev => [record, ...prev]);
        // Ideally we generate an invoice here too, but manual adds in Data tab are distinct from Inventory movements.
        // For strictness, we should encourage adding via 'Inventory -> Sale' instead.
     }
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

     // 3. Financial Interconnectivity
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

  const handleSaveMarkdown = (productId: string, price: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, markdownPrice: price > 0 ? price : undefined };
      }
      return p;
    }));
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-50">Loading Celestrion...</div>;

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardKPIs history={history} planningData={planningConfig} inventory={inventory} movements={movements} products={products} onStoreClick={(name) => { setDrillDownStore(name); setActiveTab('data'); }} />
            <MetricsGrid history={history} forecast={forecasts} />
            <ChartsSection history={history} forecast={forecasts} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardARSummary invoices={invoices} onViewAllClick={() => setActiveTab('ar')} />
              <SalesIntelligence history={history} stores={stores} onStoreClick={(name) => { setDrillDownStore(name); setActiveTab('data'); }} />
            </div>
          </div>
        );
      case 'planning':
        return (
          <div className="space-y-8">
            <PlanningView stores={stores} forecasts={forecasts} history={history} planningData={planningConfig} onUpdateTarget={handleUpdateTarget} onUpdateMargin={handleUpdateMargin} onUpdateStockCover={handleUpdateStockCover} />
            <ForecastExplorer history={history} forecast={forecasts} adjustments={{}} onUpdateAdjustment={() => {}} />
          </div>
        );
      case 'inventory':
        // REPLACED InventoryView with InventoryManagement (The Command Center)
        return (
          <InventoryManagement 
             inventory={inventory}
             products={products}
             stores={stores}
             movements={movements}
             history={history}
             suppliers={suppliers}
             onRecordTransaction={handleRecordStockTransaction}
             onImportClick={(t) => { setImportType(t); setIsImportModalOpen(true); }}
             onSaveMarkdown={handleSaveMarkdown}
          />
        );
      case 'data':
         return (
            <DataManagement 
               history={history} 
               movements={movements}
               stores={stores}
               products={products}
               inventory={inventory}
               suppliers={suppliers}
               targetStore={drillDownStore}
               onImportClick={(t) => { setImportType(t); setIsImportModalOpen(true); }}
               onEditRecord={handleEditRecord} 
               onDeleteRecord={handleDeleteRecord}
               onBulkDelete={handleBulkDelete}
               onRecordTransaction={handleRecordStockTransaction}
            />
         );
      case 'ar':
        return <AccountsReceivable invoices={invoices} stores={stores} onOpenPaymentModal={(store) => { setPaymentStore(store); setIsPaymentModalOpen(true); }} onImportClick={() => { setImportType('invoices'); setIsImportModalOpen(true); }} />;
      case 'analysis':
         return <SalesAnalysis history={history} planningData={planningConfig} stores={stores} />;
      case 'health':
         return <SystemHealth stores={stores} products={products} inventory={inventory} history={history} invoices={invoices} />;
      case 'assistant':
        return <AIChatAssistant contextData={{ storeCount: stores.length, totalSales: history.reduce((s, r) => s + r.amount, 0) }} />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
         <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3"><TrendingUp className="text-indigo-500" size={24} /><span className="font-bold text-lg tracking-tight">Celestrion</span></div>
            <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
         </div>
         <nav className="p-4 space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'planning', label: 'Planning & Budget', icon: TrendingUp },
              { id: 'inventory', label: 'Inventory & Stock', icon: Package },
              { id: 'ar', label: 'Accounts Receivable', icon: DollarSign },
              { id: 'analysis', label: 'Sales Analysis', icon: TrendingUp },
              { id: 'data', label: 'Data Management', icon: Database },
              { id: 'health', label: 'System Health', icon: ShieldCheck },
              { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); if(item.id==='data') setDrillDownStore(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <item.icon size={20} /><span className="font-medium">{item.label}</span>
              </button>
            ))}
         </nav>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
         <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600"><Menu size={24} /></button>
            <span className="font-bold text-slate-800">Celestrion</span>
         </div>
         <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">{renderContent()}</div>
         </div>
      </main>
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} store={paymentStore} invoices={invoices} onRecordPayment={handleRecordPayment} />
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} type={importType} />
    </div>
  );
}
