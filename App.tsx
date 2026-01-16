import React, { useState } from 'react';
import { 
  LayoutDashboard, Database, Package, TrendingUp, DollarSign, MessageSquare, Menu, X, ShieldCheck, Globe, PieChart, Sparkles, CreditCard
} from 'lucide-react';
import { useERP } from './contexts/ERPContext';
import { useLanguage } from './contexts/LanguageContext';

// Components
import { DashboardKPIs } from './components/DashboardKPIs';
import { DashboardARSummary } from './components/DashboardARSummary';
import { SalesIntelligence } from './components/SalesIntelligence';
import { MetricsGrid } from './components/MetricsGrid';
import { ChartsSection } from './components/ChartsSection';
import { PlanningView } from './components/PlanningView';
import { ForecastExplorer } from './components/ForecastExplorer';
import { ForecastDashboard } from './components/ForecastDashboard';
import { InventoryManagement } from './components/InventoryManagement';
import { DataManagement } from './components/DataManagement';
import { AccountsReceivable } from './components/AccountsReceivable';
import { AccountsPayable } from './components/AccountsPayable';
import { CashFlowView } from './components/CashFlowView';
import { AIChatAssistant } from './components/AIChatAssistant';
import { SalesAnalysis } from './components/SalesAnalysis';
import { PaymentModal } from './components/PaymentModal';
import { ImportModal } from './components/ImportModal';
import { SystemHealth } from './components/SystemHealth';
import { BillModal } from './components/BillModal'; 
import { ExpenseModal } from './components/ExpenseModal'; 

export default function App() {
  const { t, language, setLanguage } = useLanguage();
  const { 
    stores, products, history, inventory, movements, invoices, bills, expenses, suppliers,
    forecasts, planningConfig, loading, actions
  } = useERP();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [drillDownStore, setDrillDownStore] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStore, setPaymentStore] = useState<any | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<any>('sales');
  
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Celestrion Engine</h1>
            <p className="text-slate-500 font-medium">Booting core data streams...</p>
          </div>
        </div>
      </div>
    );
  }

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
      case 'forecasting':
        return (
          <div className="space-y-8">
             <ForecastDashboard history={history} forecasts={forecasts} stores={stores} onExploreStore={(name) => { setDrillDownStore(name); setActiveTab('planning'); }} />
             <ForecastExplorer history={history} forecast={forecasts} adjustments={{}} onUpdateAdjustment={(m, b, c, a) => actions.updateTarget(parseInt(m.split('-')[0]), parseInt(m.split('-')[1]), b, c, a)} />
          </div>
        );
      case 'planning':
        return <PlanningView stores={stores} forecasts={forecasts} history={history} planningData={planningConfig} onUpdateTarget={actions.updateTarget} onUpdateMargin={actions.updateMargin} onUpdateStockCover={actions.updateStockCover} />;
      case 'inventory':
        return <InventoryManagement inventory={inventory} products={products} stores={stores} movements={movements} history={history} suppliers={suppliers} onRecordTransaction={actions.recordStockTransaction} onImportClick={(t) => { setImportType(t); setIsImportModalOpen(true); }} onSaveMarkdown={actions.saveMarkdown} />;
      case 'ar':
        return <AccountsReceivable invoices={invoices} stores={stores} onOpenPaymentModal={(store) => { setPaymentStore(store); setIsPaymentModalOpen(true); }} onImportClick={() => { setImportType('invoices'); setIsImportModalOpen(true); }} />;
      case 'ap':
        return <AccountsPayable bills={bills} suppliers={suppliers} onAddBill={() => setIsBillModalOpen(true)} onPayBill={actions.payBill} />;
      case 'cashflow':
        return <CashFlowView expenses={expenses} bills={bills} history={history} invoices={invoices} planningData={planningConfig} onAddExpense={() => setIsExpenseModalOpen(true)} />;
      case 'analysis':
         return <SalesAnalysis history={history} planningData={planningConfig} stores={stores} />;
      case 'data':
         return <DataManagement history={history} movements={movements} stores={stores} products={products} inventory={inventory} targetStore={drillDownStore} onImportClick={(t) => { setImportType(t); setIsImportModalOpen(true); }} onEditRecord={actions.editRecord} onDeleteRecord={actions.deleteRecord} onBulkDelete={actions.bulkDeleteRecords} onRecordTransaction={actions.recordStockTransaction} />;
      case 'health':
         return <SystemHealth stores={stores} products={products} inventory={inventory} history={history} invoices={invoices} movements={movements} />;
      case 'assistant':
        return <AIChatAssistant contextData={{ storeCount: stores.length, totalSales: history.reduce((s, r) => s + r.amount, 0), totalInventoryValue: inventory.reduce((sum, i) => { const p = products.find(prod => prod.id === i.productId); return sum + (i.quantity * (p?.cost || 0)); }, 0), topStores: stores.slice(0, 5).map(s => s.name) }} />;
      default:
        return <div>Select a tab</div>;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'forecasting', label: 'AI Forecasting', icon: Sparkles },
    { id: 'planning', label: t('planning'), icon: TrendingUp },
    { id: 'inventory', label: t('inventory'), icon: Package },
    { id: 'ar', label: t('ar'), icon: DollarSign },
    { id: 'ap', label: t('ap'), icon: CreditCard },
    { id: 'cashflow', label: t('cashflow'), icon: PieChart },
    { id: 'analysis', label: t('analysis'), icon: LayoutDashboard },
    { id: 'data', label: t('data'), icon: Database },
    { id: 'health', label: t('health'), icon: ShieldCheck },
    { id: 'assistant', label: t('assistant'), icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col`}>
         <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-white" size={20} />
               </div>
               <span className="font-bold text-lg tracking-tight">Celestrion</span>
            </div>
            <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
         </div>
         <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); if(item.id==='data') setDrillDownStore(null); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <item.icon size={18} /><span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
         </nav>
         <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-xs font-medium"><Globe size={14} /> {language === 'en' ? '中文 (Mandarin)' : 'English'}</button>
         </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
         <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center gap-4"><button onClick={() => setIsSidebarOpen(true)} className="text-slate-600"><Menu size={24} /></button><span className="font-bold text-slate-800">Celestrion</span></div>
         <div className="flex-1 overflow-auto p-4 md:p-8"><div className="max-w-7xl mx-auto">{renderContent()}</div></div>
      </main>
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} store={paymentStore} invoices={invoices} onRecordPayment={actions.recordPayment} />
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} type={importType} onImportSales={(d) => actions.importData('sales', d)} onImportStores={(d) => actions.importData('stores', d)} onImportProducts={(d) => actions.importData('products', d)} />
      <BillModal isOpen={isBillModalOpen} onClose={() => setIsBillModalOpen(false)} onSave={actions.addBill} suppliers={suppliers} />
      <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} onSave={actions.addExpense} stores={stores} />
    </div>
  );
}