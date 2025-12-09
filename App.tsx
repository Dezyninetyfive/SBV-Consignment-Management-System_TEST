import React, { useState, useEffect, useMemo } from 'react';
import { SaleRecord, ForecastResponse, StoreProfile, PlanningConfig, Product, InventoryItem, Invoice, PaymentRecord, StockMovement } from './types';
import { generateMockHistory, generateMockStores, generateMockProducts, generateMockInventory, generateMockInvoices, generateMockStockMovements } from './utils/dataUtils';
import { generateForecast } from './services/geminiService';
import { MetricsGrid } from './components/MetricsGrid';
import { ChartsSection } from './components/ChartsSection';
import { SalesIntelligence } from './components/SalesIntelligence';
import { DashboardARSummary } from './components/DashboardARSummary';
import { AddRecordModal } from './components/AddRecordModal';
import { StoreNetwork } from './components/StoreNetwork';
import { StoreModal } from './components/StoreModal';
import { DataManagement } from './components/DataManagement';
import { ImportModal } from './components/ImportModal';
import { ForecastExplorer } from './components/ForecastExplorer';
import { PlanningView } from './components/PlanningView';
import { InventoryView } from './components/InventoryView';
import { AccountsReceivable } from './components/AccountsReceivable';
import { PaymentModal } from './components/PaymentModal';
import { AIChatAssistant } from './components/AIChatAssistant';
import { SalesAnalysis } from './components/SalesAnalysis';
import { Sparkles, FileText, RefreshCw, AlertCircle, PlusCircle, LayoutDashboard, Building, Database, Zap, Calculator, Target, Package, Clock, Bot, PieChart } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'stores' | 'data' | 'planning' | 'inventory' | 'ar' | 'ai' | 'analysis'>('dashboard');
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [history, setHistory] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]); // NEW state
  
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);
  
  // Forecast Adjustments stored in localStorage
  const [adjustments, setAdjustments] = useState<any>({}); 
  
  // Planning Data (Targets & Margins)
  const [planningData, setPlanningData] = useState<PlanningConfig>({ targets: {}, margins: {}, targetStockCover: {} });

  // Modal States
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SaleRecord | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreProfile | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStore, setPaymentStore] = useState<StoreProfile | null>(null);
  
  // Data Management States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'sales' | 'stores' | 'products' | 'inventory' | 'invoices'>('sales');

  // Initialize Data
  useEffect(() => {
    initializeData();
    // Load local storage items
    const savedAdj = localStorage.getItem('forecastAdjustments');
    if (savedAdj) setAdjustments(JSON.parse(savedAdj));

    const savedPlanning = localStorage.getItem('planningData');
    if (savedPlanning) setPlanningData(JSON.parse(savedPlanning));
  }, []);

  const initializeData = () => {
    const mockStores = generateMockStores();
    setStores(mockStores);
    
    const mockSales = generateMockHistory(mockStores);
    mockSales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setHistory(mockSales);
    
    // Initialize ERP Data
    const mockProducts = generateMockProducts();
    setProducts(mockProducts);
    
    const mockInventory = generateMockInventory(mockStores, mockProducts);
    setInventory(mockInventory);

    const mockInvoices = generateMockInvoices(mockStores);
    setInvoices(mockInvoices);

    const mockMovements = generateMockStockMovements(mockInventory, mockProducts);
    setMovements(mockMovements);
    
    setForecastData(null);
    setError(null);
  };

  // --- AI Context Preparation ---
  const aiContext = useMemo(() => {
    // Top Stores for context
    const storeSales: Record<string, number> = {};
    history.forEach(r => storeSales[r.counter] = (storeSales[r.counter] || 0) + r.amount);
    const topStores = Object.entries(storeSales).sort(([,a], [,b]) => b-a).slice(0, 5).map(([k,v]) => ({name: k, sales: v}));
    const bottomStores = Object.entries(storeSales).sort(([,a], [,b]) => a-b).slice(0, 5).map(([k,v]) => ({name: k, sales: v}));

    // Inventory Value
    const productCostMap = new Map<string, number>(products.map(p => [p.id, p.cost] as [string, number]));
    const totalInventoryValue = inventory.reduce((acc, item) => acc + (item.quantity * (productCostMap.get(item.productId) || 0)), 0);

    // Overdue
    const today = new Date();
    const totalOverdue = invoices.filter(i => new Date(i.dueDate) < today && i.status !== 'Paid').reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);
    const highRiskStores = invoices.filter(i => {
       const diff = (today.getTime() - new Date(i.dueDate).getTime()) / (1000 * 3600 * 24);
       return diff > 60 && i.status !== 'Paid';
    }).map(i => i.storeName);

    return {
      storeCount: stores.length,
      totalSales: history.reduce((acc, r) => acc + r.amount, 0),
      totalInventoryValue,
      totalOverdue,
      topStores,
      bottomStores,
      highRiskStores: [...new Set(highRiskStores)]
    };
  }, [history, stores, products, inventory, invoices]);

  // --- Handlers ---

  const handleGenerateForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextYear = new Date().getFullYear() + 1; 
      // Pass the useAI flag and current adjustments to the service
      const response = await generateForecast(history, nextYear, { useAI, adjustments });
      setForecastData(response);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate forecast.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateForecastAdjustment = (month: string, brand: string, counter: string, amount: number) => {
    const key = `${month}|${brand}|${counter}`;
    const newAdjustments = { ...adjustments, [key]: amount };
    setAdjustments(newAdjustments);
    localStorage.setItem('forecastAdjustments', JSON.stringify(newAdjustments));

    // Optimistically update the current forecast display
    if (forecastData) {
      const updatedForecasts = forecastData.forecasts.map(f => {
        if (f.month === month && f.brand === brand && f.counter === counter) {
           return { ...f, forecastAmount: amount };
        }
        return f;
      });
      setForecastData({ ...forecastData, forecasts: updatedForecasts });
    }
  };

  const handleUpdateTarget = (year: number, month: number, brand: string, counter: string, amount: number) => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const key = `${monthStr}|${brand}|${counter}`;
    
    const newData = {
      ...planningData,
      targets: { ...planningData.targets, [key]: amount }
    };
    setPlanningData(newData);
    localStorage.setItem('planningData', JSON.stringify(newData));
  };

  const handleUpdateMargin = (brand: string, margin: number) => {
    const newData = {
      ...planningData,
      margins: { ...planningData.margins, [brand]: margin }
    };
    setPlanningData(newData);
    localStorage.setItem('planningData', JSON.stringify(newData));
  };

  const handleUpdateStockCover = (brand: string, counter: string, months: number) => {
    const key = `${brand}|${counter}`;
    const newData = {
      ...planningData,
      targetStockCover: { ...planningData.targetStockCover, [key]: months }
    };
    setPlanningData(newData);
    localStorage.setItem('planningData', JSON.stringify(newData));
  };

  // --- Record Management ---

  const handleAddOrUpdateRecord = (record: SaleRecord) => {
    setHistory((prev) => {
      // Check if updating existing
      const exists = prev.some(r => r.id === record.id);
      let updated;
      if (exists) {
        updated = prev.map(r => r.id === record.id ? record : r);
      } else {
        updated = [...prev, record];
      }
      return updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    setIsAddRecordModalOpen(false);
    setRecordToEdit(null);
  };

  const handleDeleteRecord = (id: string) => {
    setHistory(prev => prev.filter(r => r.id !== id));
  };

  const handleBulkDeleteRecords = (ids: string[]) => {
    const set = new Set(ids);
    setHistory(prev => prev.filter(r => !set.has(r.id)));
  };

  const handleEditRecordClick = (record: SaleRecord) => {
    setRecordToEdit(record);
    setIsAddRecordModalOpen(true);
  };

  // --- Store Management ---

  const handleOpenStoreModal = (store: StoreProfile | null = null) => {
    setEditingStore(store);
    setIsStoreModalOpen(true);
  };

  const handleSaveStore = (storeData: StoreProfile, originalId?: string) => {
    // 1. Update Stores List
    setStores(prev => {
      if (originalId) {
        // Edit Mode: Find by original ID and replace
        return prev.map(s => s.id === originalId ? storeData : s);
      } else {
        // Add Mode or fallback if originalId not provided but ID exists
        const exists = prev.some(s => s.id === storeData.id);
        if (exists) return prev.map(s => s.id === storeData.id ? storeData : s);
        return [storeData, ...prev];
      }
    });

    // 2. Cascade Updates if ID Changed
    if (originalId && originalId !== storeData.id) {
       console.log(`Cascading ID update from ${originalId} to ${storeData.id}`);
       // Update Inventory
       setInventory(prev => prev.map(item => 
         item.storeId === originalId ? { ...item, storeId: storeData.id, storeName: storeData.name } : item
       ));
       // Update Invoices
       setInvoices(prev => prev.map(inv => 
         inv.storeId === originalId ? { ...inv, storeId: storeData.id, storeName: storeData.name } : inv
       ));
       // Note: Sales History links by 'counter' (name), so we update name if needed next
    }

    // 3. Cascade Updates if Name Changed (Sales History relies on name)
    // We need to find the old name. Since 'editingStore' holds the state when modal opened:
    if (editingStore && editingStore.name !== storeData.name) {
       const oldName = editingStore.name;
       console.log(`Cascading Name update from ${oldName} to ${storeData.name}`);
       setHistory(prev => prev.map(r => 
         r.counter === oldName ? { ...r, counter: storeData.name } : r
       ));
       // Also update inventory/invoices storeName just in case
       setInventory(prev => prev.map(item => 
         item.storeName === oldName ? { ...item, storeName: storeData.name } : item
       ));
       setInvoices(prev => prev.map(inv => 
         inv.storeName === oldName ? { ...inv, storeName: storeData.name } : inv
       ));
    }

    setIsStoreModalOpen(false);
    setEditingStore(null);
  };

  const handleDeleteStore = (storeId: string) => {
    // Confirmation handled in StoreNetwork component via DeleteConfirmationModal
    setStores(prev => prev.filter(s => s.id !== storeId));
    // Cascade delete
    setInventory(prev => prev.filter(i => i.storeId !== storeId));
    setInvoices(prev => prev.filter(i => i.storeId !== storeId));
  };

  const handleBulkUpdateStores = (ids: string[], updates: Partial<StoreProfile>) => {
    setStores(prev => prev.map(store => 
      ids.includes(store.id) ? { ...store, ...updates } : store
    ));
  };

  // --- Product & Inventory Management ---

  const handleAddProduct = (p: Product) => {
    setProducts(prev => [...prev, p]);
  };

  const handleUpdateProduct = (p: Product) => {
    setProducts(prev => prev.map(prod => prod.id === p.id ? p : prod));
  };

  const handleTransferStock = (fromStoreId: string, toStoreId: string, productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    const sourceStore = stores.find(s => s.id === fromStoreId);
    const destStore = stores.find(s => s.id === toStoreId);

    if (!product || !sourceStore || !destStore) return;

    setInventory(prev => {
      // Logic: find item in source, decrease. find/create in dest, increase.
      const newState = [...prev];
      const sourceIdx = newState.findIndex(i => i.storeId === fromStoreId && i.productId === productId);
      
      if (sourceIdx === -1 || newState[sourceIdx].quantity < qty) {
        alert("Insufficient stock in source store!");
        return prev;
      }

      // Decrease Source
      newState[sourceIdx] = { ...newState[sourceIdx], quantity: newState[sourceIdx].quantity - qty };

      // Increase Dest
      const destIdx = newState.findIndex(i => i.storeId === toStoreId && i.productId === productId);
      if (destIdx > -1) {
         newState[destIdx] = { ...newState[destIdx], quantity: newState[destIdx].quantity + qty };
      } else {
         // Create new item entry
         newState.push({
            id: `inv-${toStoreId}-${productId}`,
            storeId: toStoreId,
            storeName: destStore.name,
            productId: productId,
            productName: product.name,
            sku: product.sku,
            brand: product.brand,
            quantity: qty,
            variantQuantities: {} // Simple transfer for now
         });
      }

      // Record Movements
      const today = new Date().toISOString().split('T')[0];
      const newMovements: StockMovement[] = [
        {
          id: `mov-out-${Date.now()}`,
          date: today,
          type: 'Transfer Out',
          storeId: sourceStore.id,
          storeName: sourceStore.name,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          variant: 'Standard',
          quantity: -qty,
          reference: `TR TO ${destStore.name}`
        },
        {
          id: `mov-in-${Date.now()}`,
          date: today,
          type: 'Transfer In',
          storeId: destStore.id,
          storeName: destStore.name,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          variant: 'Standard',
          quantity: qty,
          reference: `TR FROM ${sourceStore.name}`
        }
      ];
      setMovements(prevM => [...newMovements, ...prevM]);

      return newState;
    });
    alert("Stock Transfer Successful");
  };

  // --- AR Management ---

  const handleOpenPaymentModal = (store: StoreProfile) => {
    setPaymentStore(store);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = (invoiceIds: string[], amount: number, method: string, ref: string) => {
    setInvoices(prev => {
      let remainingPayment = amount;
      return prev.map(inv => {
        if (invoiceIds.includes(inv.id) && remainingPayment > 0) {
           const due = inv.amount - (inv.paidAmount || 0);
           const pay = Math.min(due, remainingPayment);
           remainingPayment -= pay;
           
           const newPaid = (inv.paidAmount || 0) + pay;
           const newStatus = newPaid >= inv.amount ? 'Paid' : 'Partial';
           
           const paymentRec: PaymentRecord = {
             id: `pay-${Date.now()}-${Math.random()}`,
             date: new Date().toISOString().split('T')[0],
             amount: pay,
             method,
             reference: ref
           };

           return { ...inv, paidAmount: newPaid, status: newStatus, payments: [...(inv.payments || []), paymentRec] };
        }
        return inv;
      });
    });
  };

  // --- Import ---

  const openImportModal = (type: 'sales' | 'stores' | 'products' | 'inventory' | 'invoices') => {
    setImportType(type);
    setIsImportModalOpen(true);
  };

  const handleImportSales = (newRecords: SaleRecord[]) => {
    setHistory(prev => {
      const combined = [...prev, ...newRecords];
      return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    alert(`Successfully imported ${newRecords.length} sales records.`);
  };

  const handleImportStores = (newStores: StoreProfile[]) => {
    setStores(prev => {
      const existingNames = new Set(prev.map(s => s.name));
      const filteredNew = newStores.filter(s => !existingNames.has(s.name));
      return [...prev, ...filteredNew];
    });
    alert(`Successfully imported ${newStores.length} stores.`);
  };

  const handleImportProducts = (newProducts: Product[]) => {
    setProducts(prev => {
      const existingSkus = new Set(prev.map(p => p.sku));
      const filteredNew = newProducts.filter(p => !existingSkus.has(p.sku));
      return [...prev, ...filteredNew];
    });
    alert(`Successfully imported ${newProducts.length} products.`);
  };

  const handleImportInventory = (data: any[]) => {
    // Data is [{storeName, sku, quantity}, ...]
    setInventory(prev => {
      const newItems = [...prev];
      let count = 0;
      data.forEach(row => {
        const store = stores.find(s => s.name === row.storeName);
        const product = products.find(p => p.sku === row.sku);
        if (store && product) {
          const qty = parseInt(row.quantity) || 0;
          // Check update or add
          const existingIdx = newItems.findIndex(i => i.storeId === store.id && i.productId === product.id);
          if (existingIdx > -1) {
            newItems[existingIdx] = { ...newItems[existingIdx], quantity: qty };
          } else {
            newItems.push({
               id: `inv-${store.id}-${product.id}`,
               storeId: store.id,
               storeName: store.name,
               productId: product.id,
               productName: product.name,
               sku: product.sku,
               brand: product.brand,
               quantity: qty,
               variantQuantities: {}
            });
          }
          count++;
        }
      });
      return newItems;
    });
    alert("Inventory import processed.");
  };

  const handleImportInvoices = (data: any[]) => {
    setInvoices(prev => {
       const newInvoices: Invoice[] = data.map((row, i) => {
         const store = stores.find(s => s.name === row.storeName);
         if (!store) return null;
         
         const issueDate = new Date(); // Default import to today as issue date if not provided
         const dueDate = row.dueDate || new Date().toISOString().split('T')[0];
         let status: any = 'Unpaid';
         if (new Date(dueDate) < new Date()) status = 'Overdue';

         return {
            id: `inv-import-${Date.now()}-${i}`,
            storeId: store.id,
            storeName: store.name,
            brand: row.brand,
            amount: row.amount,
            paidAmount: 0,
            issueDate: issueDate.toISOString().split('T')[0],
            dueDate: dueDate,
            status: status,
            payments: []
         } as Invoice;
       }).filter(i => i !== null) as Invoice[];

       return [...prev, ...newInvoices];
    });
    alert("Invoices imported successfully.");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="text-white h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Consignment Management System
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                JD
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8 overflow-x-auto">
          <div className="bg-white p-1 rounded-xl inline-flex shadow-sm border border-slate-200 whitespace-nowrap">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'dashboard' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>
            <button 
              onClick={() => setView('analysis')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'analysis' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <PieChart size={16} />
              Analysis
            </button>
            <button 
              onClick={() => setView('planning')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'planning' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Target size={16} />
              Planning
            </button>
             <button 
              onClick={() => setView('inventory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'inventory' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Package size={16} />
              Inventory
            </button>
             <button 
              onClick={() => setView('ar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'ar' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Clock size={16} />
              Aging (AR)
            </button>
            <button 
              onClick={() => setView('data')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'data' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Database size={16} />
              Data
            </button>
            <button 
              onClick={() => setView('stores')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'stores' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Building size={16} />
              Stores
            </button>
            <button 
              onClick={() => setView('ai')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'ai' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <Bot size={16} />
              AI Assistant
            </button>
          </div>
        </div>

        {view === 'analysis' && (
           <SalesAnalysis 
             history={history}
             planningData={planningData}
             stores={stores}
           />
        )}

        {view === 'planning' && (
          <PlanningView 
            stores={stores}
            forecasts={forecastData?.forecasts || []}
            history={history}
            planningData={planningData}
            onUpdateTarget={handleUpdateTarget}
            onUpdateMargin={handleUpdateMargin}
            onUpdateStockCover={handleUpdateStockCover}
          />
        )}

        {view === 'stores' && (
          <StoreNetwork 
            stores={stores}
            onEditAction={handleOpenStoreModal}
            onDeleteAction={handleDeleteStore}
            onAddAction={() => handleOpenStoreModal(null)}
            onImportAction={() => openImportModal('stores')}
            onBulkUpdateAction={handleBulkUpdateStores}
          />
        )}

        {view === 'data' && (
          <DataManagement 
            history={history}
            onImportClick={() => openImportModal('sales')}
            onEditRecord={handleEditRecordClick}
            onDeleteRecord={handleDeleteRecord}
            onBulkDelete={handleBulkDeleteRecords}
          />
        )}
        
        {view === 'inventory' && (
          <InventoryView 
            products={products}
            inventory={inventory}
            stores={stores}
            movements={movements} // Pass movements
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onTransferStock={handleTransferStock}
            onImportClick={openImportModal}
          />
        )}

        {view === 'ar' && (
          <AccountsReceivable 
            invoices={invoices}
            stores={stores}
            onOpenPaymentModal={handleOpenPaymentModal}
            onImportClick={() => openImportModal('invoices')}
          />
        )}

        {view === 'ai' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            <div className="md:col-span-2 h-full">
              <AIChatAssistant contextData={aiContext} />
            </div>
            <div className="bg-indigo-900 rounded-xl p-6 text-white h-full flex flex-col justify-center items-center text-center">
              <Sparkles size={48} className="mb-4 text-indigo-300" />
              <h3 className="text-xl font-bold mb-2">The Brain</h3>
              <p className="text-indigo-200 text-sm leading-relaxed max-w-xs">
                Ask complex questions about your consignment business.
              </p>
              <div className="mt-6 text-left space-y-3 w-full max-w-xs">
                <div className="bg-white/10 p-3 rounded-lg text-xs cursor-pointer hover:bg-white/20 transition-colors">
                  "Which stores have high inventory but low sales?"
                </div>
                <div className="bg-white/10 p-3 rounded-lg text-xs cursor-pointer hover:bg-white/20 transition-colors">
                  "Show me overdue accounts greater than 60 days."
                </div>
                 <div className="bg-white/10 p-3 rounded-lg text-xs cursor-pointer hover:bg-white/20 transition-colors">
                  "What is the projected revenue for Domino next month?"
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <>
            {/* Dashboard Actions */}
            <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 animate-in fade-in duration-500">
              <div>
                 <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard</h2>
                 <p className="text-slate-500">
                   Overview of {stores.length} stores, {products.length} products, and current AR status.
                 </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                 
                 {/* Model Toggle */}
                 <div className="bg-slate-100 p-1 rounded-lg flex items-center mr-2">
                    <button
                      onClick={() => setUseAI(false)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        !useAI ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Calculator size={14} />
                      Manual
                    </button>
                    <button
                      onClick={() => setUseAI(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        useAI ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Zap size={14} />
                      Gemini AI
                    </button>
                 </div>

                 <button 
                   onClick={initializeData}
                   className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm w-full sm:w-auto justify-center"
                 >
                   <RefreshCw size={16} />
                   Reset Data
                 </button>
                 
                 <button
                   onClick={() => {
                     setRecordToEdit(null);
                     setIsAddRecordModalOpen(true);
                   }}
                   className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm w-full sm:w-auto justify-center"
                 >
                   <PlusCircle size={16} className="text-indigo-600" />
                   Add Sales
                 </button>

                 <button 
                   onClick={handleGenerateForecast}
                   disabled={loading || history.length === 0}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition-all font-medium text-sm text-white w-full sm:w-auto justify-center
                     ${loading 
                       ? 'bg-indigo-400 cursor-not-allowed' 
                       : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-95'
                     }`}
                 >
                   {loading ? (
                     <>
                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       {useAI ? 'AI Analysis...' : 'Calculating...'}
                     </>
                   ) : (
                     <>
                       {useAI ? <Sparkles size={16} /> : <Calculator size={16} />}
                       Generate Forecast
                     </>
                   )}
                 </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold">Generation Failed</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* Content Grid */}
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 delay-75">
              
              {/* TOP ROW: Metrics + AR Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                   <MetricsGrid 
                     history={history} 
                     forecast={forecastData?.forecasts || []} 
                   />
                </div>
                <div className="lg:col-span-1 h-full pb-8 lg:pb-0">
                   <DashboardARSummary 
                     invoices={invoices}
                     onViewAllClick={() => setView('ar')}
                   />
                </div>
              </div>

              {/* NEW: Sales Intelligence Section */}
              <SalesIntelligence history={history} stores={stores} />

              <ChartsSection 
                history={history} 
                forecast={forecastData?.forecasts || []} 
              />
              
              {forecastData?.summary && (
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Sparkles size={120} />
                   </div>
                   <div className="relative z-10">
                     <h3 className="text-indigo-900 font-bold mb-2 flex items-center gap-2">
                       {useAI ? <Sparkles className="text-indigo-600" size={18} /> : <Calculator className="text-indigo-600" size={18} />}
                       {useAI ? "AI Executive Summary" : "Statistical Summary"}
                     </h3>
                     <p className="text-indigo-800 leading-relaxed">
                       {forecastData.summary}
                     </p>
                   </div>
                </div>
              )}

              {forecastData?.forecasts && forecastData.forecasts.length > 0 && (
                <ForecastExplorer 
                  history={history}
                  forecast={forecastData.forecasts}
                  adjustments={adjustments}
                  onUpdateAdjustment={handleUpdateForecastAdjustment}
                />
              )}
            </div>
          </>
        )}

        {/* Global Modals */}
        <AddRecordModal 
          isOpen={isAddRecordModalOpen} 
          onClose={() => {
            setIsAddRecordModalOpen(false);
            setRecordToEdit(null);
          }}
          onSubmit={handleAddOrUpdateRecord}
          existingHistory={history}
          availableStores={stores}
          onAddNewStore={() => handleOpenStoreModal(null)}
          recordToEdit={recordToEdit}
        />

        {isStoreModalOpen && (
          <StoreModal 
            store={editingStore} 
            onClose={() => setIsStoreModalOpen(false)} 
            onSave={(updatedStore) => handleSaveStore(updatedStore, editingStore?.id)} 
          />
        )}

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          store={paymentStore}
          invoices={invoices}
          onRecordPayment={handleRecordPayment}
        />
        
        <ImportModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          type={importType}
          onImportSales={handleImportSales}
          onImportStores={handleImportStores}
          onImportProducts={handleImportProducts}
          onImportInventory={handleImportInventory}
          onImportInvoices={handleImportInvoices}
        />

      </main>
    </div>
  );
};

export default App;