
import React, { useState, useMemo } from 'react';
import { InventoryItem, Product, StoreProfile, StockMovement, SaleRecord, Supplier } from '../types';
import { ProductAnalytics } from './ProductAnalytics';
import { TransactionFormModal } from './TransactionFormModal';
import { ProductDetailModal } from './ProductDetailModal';
import { StoreStockModal } from './StoreStockModal';
import { StockMovementLog } from './StockMovementLog';
import { MarkdownModal } from './MarkdownModal';
import { formatCurrency } from '../utils/dataUtils';
import { Package, LayoutGrid, ArrowRightLeft, ClipboardCheck, Search, Plus, Tag, Edit2, BarChart3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  inventory: InventoryItem[];
  products: Product[];
  stores: StoreProfile[];
  movements: StockMovement[];
  history: SaleRecord[];
  suppliers: Supplier[];
  onRecordTransaction: (data: any) => void;
  onImportClick: (type: 'products' | 'stock_movements') => void;
  onSaveMarkdown: (productId: string, price: number) => void;
}

export const InventoryManagement: React.FC<Props> = ({ 
  inventory, products, stores, movements, history, suppliers, 
  onRecordTransaction, onImportClick, onSaveMarkdown
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'master' | 'ledger' | 'transactions' | 'audit'>('ledger');
  
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStoreStock, setSelectedStoreStock] = useState<{name: string, items: InventoryItem[]} | null>(null);
  const [markdownProduct, setMarkdownProduct] = useState<Product | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [auditStoreId, setAuditStoreId] = useState('');
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});

  const sortedStores = useMemo(() => {
    return stores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [stores, searchTerm]);

  const renderContent = () => {
    switch(activeTab) {
      case 'ledger':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {sortedStores.map(store => {
                const storeItems = inventory.filter(i => i.storeId === store.id && i.quantity > 0);
                const totalUnits = storeItems.reduce((acc, i) => acc + i.quantity, 0);
                return (
                   <div key={store.id} onClick={() => setSelectedStoreStock({ name: store.name, items: storeItems })} className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl cursor-pointer transition-all bg-white group">
                      <div className="flex justify-between items-start mb-3">
                         <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">{store.group}</span>
                         <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      </div>
                      <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 mb-6 line-clamp-1 text-sm">{store.name}</h4>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-slate-400">Inventory Units</span>
                         <span className="font-black text-slate-900">{totalUnits}</span>
                      </div>
                   </div>
                );
             })}
          </div>
        );
      case 'master':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
              <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="aspect-[4/3] bg-slate-100 relative">
                  <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur rounded text-[10px] font-bold uppercase text-indigo-600">{product.brand}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-slate-800 line-clamp-1 mb-1">{product.name}</h4>
                  <p className="text-[10px] font-mono text-slate-400 mb-4">{product.sku}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400">Retail Price</p>
                      <p className="font-bold text-slate-900">{formatCurrency(product.markdownPrice || product.price)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => setMarkdownProduct(product)} className="p-2 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded-lg" title="Markdown"><Tag size={16} /></button>
                       <button onClick={() => setSelectedProduct(product)} className="p-2 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded-lg" title="Details"><Plus size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'transactions':
        return <StockMovementLog movements={movements} onAddTransaction={() => setIsTransModalOpen(true)} />;
      case 'audit':
        return (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><ClipboardCheck size={28} /></div>
                <div><h3 className="text-xl font-bold text-slate-800">Physical Stock Audit</h3><p className="text-sm text-slate-500">Verify system balances against physical counts.</p></div>
             </div>
             <select className="w-full p-4 bg-slate-50 border rounded-2xl mb-8 font-bold" value={auditStoreId} onChange={(e) => setAuditStoreId(e.target.value)}>
                <option value="">Choose a counter...</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
             {auditStoreId && (
               <div className="space-y-3">
                 {inventory.filter(i => i.storeId === auditStoreId).map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200">
                       <div className="flex-1"><p className="font-bold text-slate-800 text-sm">{item.productName}</p><p className="text-[10px] font-mono text-slate-400 uppercase">{item.sku}</p></div>
                       <div className="text-right px-4"><p className="text-[10px] font-bold text-slate-400 uppercase">System</p><p className="font-bold text-slate-700">{item.quantity}</p></div>
                       <div className="w-24"><input type="number" className="w-full p-2 bg-white border rounded-lg text-center font-bold text-indigo-600" value={auditCounts[item.id] ?? item.quantity} onChange={(e) => setAuditCounts({...auditCounts, [item.id]: parseInt(e.target.value) || 0})} /></div>
                    </div>
                 ))}
                 <button onClick={() => { alert("Audit Committed."); setAuditStoreId(''); }} className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-2xl font-bold">Commit Audit Results</button>
               </div>
             )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div><h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2"><Package className="text-indigo-600" /> {t('inventory')}</h2><p className="text-slate-500 text-sm">Real-time stock ledger and master data.</p></div>
        <div className="flex gap-2"><button onClick={() => setIsTransModalOpen(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"><ArrowRightLeft size={18} /> {t('record_movement')}</button></div>
      </div>
      <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm max-w-fit mx-auto">
        {[ { id: 'ledger', label: 'Stock Ledger', icon: Package }, { id: 'master', label: 'Item Master', icon: LayoutGrid }, { id: 'transactions', label: 'Log', icon: ArrowRightLeft }, { id: 'audit', label: 'Audit', icon: ClipboardCheck } ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}><tab.icon size={18} /> {tab.label}</button>
        ))}
      </div>
      {renderContent()}
      <TransactionFormModal isOpen={isTransModalOpen} onClose={() => setIsTransModalOpen(false)} stores={stores} products={products} inventory={inventory} onSubmit={onRecordTransaction} />
      <StoreStockModal isOpen={!!selectedStoreStock} onClose={() => setSelectedStoreStock(null)} storeName={selectedStoreStock?.name || null} items={selectedStoreStock?.items || []} products={products} onViewProduct={(sku) => {}} />
      <ProductDetailModal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} product={selectedProduct} inventory={inventory} onEdit={() => {}} />
      <MarkdownModal isOpen={!!markdownProduct} onClose={() => setMarkdownProduct(null)} product={markdownProduct} onSave={onSaveMarkdown} />
    </div>
  );
};
