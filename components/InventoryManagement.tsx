
import React, { useState, useMemo } from 'react';
import { InventoryItem, Product, StoreProfile, StockMovement, MovementType, SaleRecord, Supplier } from '../types';
import { ProductAnalytics } from './ProductAnalytics';
import { TransactionFormModal } from './TransactionFormModal';
import { ProductDetailModal } from './ProductDetailModal';
import { StoreStockModal } from './StoreStockModal';
import { StoreNetwork } from './StoreNetwork';
import { StockMovementLog } from './StockMovementLog';
import { ProductForm } from './ProductForm';
import { MarkdownModal } from './MarkdownModal';
import { formatCurrency } from '../utils/dataUtils';
import { SAMPLE_BRANDS, PRODUCT_CATEGORIES } from '../constants';
import { 
  Package, LayoutGrid, ArrowRightLeft, Store, Calculator, BarChart3, 
  Search, Filter, Plus, Edit2, AlertTriangle, CheckCircle, DollarSign, Upload, Grid, List, Tag, Eye
} from 'lucide-react';
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
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'master' | 'ledger' | 'transactions' | 'warehouse' | 'planning' | 'reports'>('ledger');
  
  // Modals State
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  
  // Product Form (Edit/Add) State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  
  // Product Detail View State (Separate from Edit)
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const [selectedStoreStock, setSelectedStoreStock] = useState<{name: string, items: InventoryItem[]} | null>(null);
  const [isMarkdownModalOpen, setIsMarkdownModalOpen] = useState(false);
  const [markdownProduct, setMarkdownProduct] = useState<Product | null>(null);

  // Global Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterGroup, setFilterGroup] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  
  // View & Sort
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'stock_high' | 'stock_low' | 'value_high' | 'value_low'>('value_high');

  // --- FILTERING LOGIC ---

  // 1. Products Matching Brand/Category
  const matchedProducts = useMemo(() => {
    return products.filter(p => {
      const matchBrand = filterBrand === 'All' || p.brand === filterBrand;
      const matchCat = filterCategory === 'All' || p.category === filterCategory;
      const matchSearch = activeTab === 'master' 
         ? (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
         : true;
      return matchBrand && matchCat && matchSearch;
    });
  }, [products, filterBrand, filterCategory, searchTerm, activeTab]);

  const matchedProductIds = useMemo(() => new Set(matchedProducts.map(p => p.id)), [matchedProducts]);

  // 2. Stores Matching Group/Region
  const matchedStores = useMemo(() => {
    return stores.filter(s => {
      const matchGroup = filterGroup === 'All' || s.group === filterGroup;
      const matchRegion = filterRegion === 'All' || s.region === filterRegion;
      const matchSearch = (activeTab === 'ledger' || activeTab === 'warehouse') 
         ? s.name.toLowerCase().includes(searchTerm.toLowerCase())
         : true;
      return matchGroup && matchRegion && matchSearch;
    });
  }, [stores, filterGroup, filterRegion, searchTerm, activeTab]);

  const matchedStoreIds = useMemo(() => new Set(matchedStores.map(s => s.id)), [matchedStores]);

  // 3. Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(i => 
      matchedProductIds.has(i.productId) && matchedStoreIds.has(i.storeId)
    );
  }, [inventory, matchedProductIds, matchedStoreIds]);

  // 4. Store Stats Calculation (for Ledger)
  const storeStats = useMemo<Record<string, { qty: number, value: number, count: number }>>(() => {
    const stats: Record<string, { qty: number, value: number, count: number }> = {};
    
    matchedStores.forEach(s => {
      stats[s.id] = { qty: 0, value: 0, count: 0 };
    });

    filteredInventory.forEach(item => {
      if (stats[item.storeId]) {
        stats[item.storeId].qty += item.quantity;
        stats[item.storeId].count += 1;
        const p = products.find(prod => prod.id === item.productId);
        if (p) {
          stats[item.storeId].value += (item.quantity * p.cost);
        }
      }
    });
    return stats;
  }, [matchedStores, filteredInventory, products]);

  // 5. Sorted Stores (Ledger View)
  const sortedStores = useMemo(() => {
    return [...matchedStores].sort((a, b) => {
      const statA = storeStats[a.id] || { qty: 0, value: 0 };
      const statB = storeStats[b.id] || { qty: 0, value: 0 };

      switch (sortBy) {
        case 'stock_high': return statB.qty - statA.qty;
        case 'stock_low': return statA.qty - statB.qty;
        case 'value_high': return statB.value - statA.value;
        case 'value_low': return statA.value - statB.value;
        default: return a.name.localeCompare(b.name);
      }
    });
  }, [matchedStores, storeStats, sortBy]);

  // 6. Filtered Movements (Transactions)
  const filteredMovements = useMemo(() => {
    return movements.filter(m => 
      matchedProductIds.has(m.productId) && matchedStoreIds.has(m.storeId)
    );
  }, [movements, matchedProductIds, matchedStoreIds]);

  // Global Totals for Ticker
  const totalValuation = (Object.values(storeStats) as { value: number }[]).reduce((acc, s) => acc + s.value, 0);
  const totalUnits = (Object.values(storeStats) as { qty: number }[]).reduce((acc, s) => acc + s.qty, 0);

  // Helper Lists
  const uniqueGroups = ['All', ...Array.from(new Set(stores.map(s => s.group))).sort()];
  const uniqueRegions = ['All', ...Array.from(new Set(stores.map(s => s.region))).sort()];
  const uniqueCategories = ['All', ...Array.from(new Set(Object.values(PRODUCT_CATEGORIES).flat())).sort()];

  const tabs = [
    { id: 'ledger', label: t('stock_ledger'), icon: Package },
    { id: 'master', label: t('item_master'), icon: LayoutGrid },
    { id: 'transactions', label: t('transactions'), icon: ArrowRightLeft },
    { id: 'warehouse', label: t('warehouse'), icon: Store },
    { id: 'planning', label: t('planning'), icon: Calculator },
    { id: 'reports', label: t('reports'), icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-indigo-600" /> {t('supply_chain_center')}
          </h2>
          <p className="text-slate-500 text-sm md:text-base">{t('supply_chain_desc')}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button 
              onClick={() => setIsTransModalOpen(true)}
              className="flex-1 md:flex-none justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 flex items-center gap-2"
           >
              <ArrowRightLeft size={18} /> {t('record_movement')}
           </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
         <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 min-w-[200px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                  type="text"
                  placeholder={activeTab === 'master' ? t('search') + " Product..." : t('search') + " Store..."}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 flex-1">
               <select 
                  className="px-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
               >
                  <option value="All">{t('all_brands')}</option>
                  {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
               <select 
                  className="px-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
               >
                  <option value="All">{t('all_categories')}</option>
                  {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <select 
                  className="px-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
               >
                  {uniqueGroups.map(g => <option key={g} value={g}>{g === 'All' ? t('all_groups') : g}</option>)}
               </select>
               <select 
                  className="px-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
               >
                  {uniqueRegions.map(r => <option key={r} value={r}>{r === 'All' ? t('all_regions') : r}</option>)}
               </select>
            </div>
         </div>

         {/* Ticker & Sort */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-slate-100 gap-4">
            <div className="flex gap-6 w-full sm:w-auto justify-around sm:justify-start">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Package size={20} /></div>
                  <div>
                     <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">{t('total_units')}</p>
                     <p className="text-lg md:text-xl font-bold text-slate-800">{totalUnits.toLocaleString()}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={20} /></div>
                  <div>
                     <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">{t('valuation')}</p>
                     <p className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(totalValuation)}</p>
                  </div>
               </div>
            </div>

            {activeTab === 'ledger' && (
               <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs font-semibold text-slate-500 uppercase mr-2 hidden sm:inline">{t('sort_by')}:</span>
                  <select 
                     className="px-3 py-1.5 border border-slate-200 rounded-lg text-base sm:text-sm bg-white focus:outline-none cursor-pointer flex-1 sm:flex-none"
                     value={sortBy}
                     onChange={(e) => setSortBy(e.target.value as any)}
                  >
                     <option value="stock_high">{t('highest_stock')}</option>
                     <option value="stock_low">{t('lowest_stock')}</option>
                     <option value="value_high">{t('highest_value')}</option>
                     <option value="value_low">{t('lowest_value')}</option>
                     <option value="name">{t('name_az')}</option>
                  </select>
                  <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                     <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}><Grid size={16} /></button>
                     <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}><List size={16} /></button>
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- CONTENT AREA --- */}
      
      {/* 1. STOCK LEDGER */}
      {activeTab === 'ledger' && (
         <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
            {viewMode === 'grid' ? (
               <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedStores.map(store => {
                     const stats = storeStats[store.id] || { qty: 0, value: 0 };
                     return (
                        <div 
                           key={store.id} 
                           onClick={() => { 
                              const items = filteredInventory.filter(i => i.storeId === store.id && i.quantity > 0);
                              setSelectedStoreStock({ name: store.name, items });
                           }}
                           className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all bg-slate-50 hover:bg-white group"
                        >
                           <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-bold uppercase text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">{store.group}</span>
                              <span className="text-[10px] text-slate-400">{store.region}</span>
                           </div>
                           <h4 className="font-bold text-slate-700 group-hover:text-indigo-600 mb-4 line-clamp-1">{store.name}</h4>
                           <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                              <div><p className="text-xs text-slate-500">Units</p><p className="font-bold text-slate-800">{stats.qty}</p></div>
                              <div className="text-right"><p className="text-xs text-slate-500">Value</p><p className="font-bold text-emerald-600">{formatCurrency(stats.value)}</p></div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                     <tr>
                        <th className="px-4 py-3 min-w-[150px]">{t('store')}</th>
                        <th className="px-4 py-3">{t('all_groups')}</th>
                        <th className="px-4 py-3">{t('all_regions')}</th>
                        <th className="px-4 py-3 text-right">Items (SKUs)</th>
                        <th className="px-4 py-3 text-right">{t('total_units')}</th>
                        <th className="px-4 py-3 text-right">{t('valuation')}</th>
                        <th className="px-4 py-3"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {sortedStores.map(store => {
                        const stats = storeStats[store.id] || { qty: 0, value: 0, count: 0 };
                        return (
                           <tr key={store.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => {
                              const items = filteredInventory.filter(i => i.storeId === store.id && i.quantity > 0);
                              setSelectedStoreStock({ name: store.name, items });
                           }}>
                              <td className="px-4 py-3 font-medium text-slate-800">{store.name}</td>
                              <td className="px-4 py-3 text-slate-500">{store.group}</td>
                              <td className="px-4 py-3 text-slate-500">{store.region}</td>
                              <td className="px-4 py-3 text-right font-mono">{stats.count}</td>
                              <td className="px-4 py-3 text-right font-bold">{stats.qty}</td>
                              <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(stats.value)}</td>
                              <td className="px-4 py-3 text-right"><button className="text-xs text-indigo-600 hover:underline">{t('view')}</button></td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
               </div>
            )}
         </div>
      )}

      {/* 2. ITEM MASTER */}
      {activeTab === 'master' && (
         <div className="space-y-4">
            <div className="flex justify-end gap-2 flex-wrap">
               <button onClick={() => onImportClick('products')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                  <Upload size={16} /> {t('import')}
               </button>
               <button onClick={() => { setSelectedProduct(null); setIsProductFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                  <Plus size={16} /> {t('add_new')} Product
               </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                     <tr>
                        <th className="px-6 py-4 min-w-[250px]">{t('product_details')}</th>
                        <th className="px-6 py-4">{t('attributes')}</th>
                        <th className="px-6 py-4">{t('variants')}</th>
                        <th className="px-6 py-4">{t('financials')}</th>
                        <th className="px-6 py-4 text-center">{t('global_stock')}</th>
                        <th className="px-6 py-4 text-right">{t('actions')}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {matchedProducts.map(p => {
                        const totalStock = inventory.filter(i => i.productId === p.id).reduce((acc, i) => acc + i.quantity, 0);
                        const effectivePrice = p.markdownPrice && p.markdownPrice > 0 ? p.markdownPrice : p.price;
                        const hasMarkdown = effectivePrice < p.price;
                        const margin = effectivePrice > 0 ? ((effectivePrice - p.cost) / effectivePrice) * 100 : 0;

                        return (
                        <tr key={p.id} className="hover:bg-slate-50 group">
                           <td className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                 <img src={p.imageUrl || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200" alt="" />
                                 <div className="max-w-[200px]">
                                    <p className="font-bold text-slate-900 text-sm line-clamp-1">{p.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono mb-1">{p.sku}</p>
                                    <p className="text-[10px] text-slate-400 line-clamp-1" title={p.description}>{p.description || 'No description'}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1 mb-1">
                                 <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600">{p.category}</span>
                                 <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600">{p.subCategory}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                 {p.attributes?.gender && <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">{p.attributes.gender}</span>}
                                 {p.attributes?.fabric && <span className="text-[10px] px-1.5 py-0.5 bg-white text-slate-500 rounded border border-slate-200">{p.attributes.fabric}</span>}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1 max-w-[120px]">
                                 {p.variants.slice(0, 3).map(v => (
                                    <span key={v} className="text-[10px] px-1.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 rounded">{v}</span>
                                 ))}
                                 {p.variants.length > 3 && <span className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded">+{p.variants.length - 3}</span>}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="text-right">
                                 {hasMarkdown ? (
                                    <>
                                       <span className="block text-red-600 font-bold text-sm">{formatCurrency(effectivePrice)}</span>
                                       <span className="text-[10px] text-slate-400 line-through mr-1">{formatCurrency(p.price)}</span>
                                    </>
                                 ) : (
                                    <span className="block font-medium text-slate-800">{formatCurrency(p.price)}</span>
                                 )}
                                 <div className="text-[10px] text-slate-500 mt-0.5">
                                    Cost: {formatCurrency(p.cost)} <span className="text-emerald-600 ml-1">({margin.toFixed(0)}%)</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <button 
                                 onClick={() => {
                                    const items = inventory.filter(i => i.productId === p.id && i.quantity > 0);
                                    setSelectedStoreStock({ name: `Stock Breakdown: ${p.name}`, items });
                                 }}
                                 className="inline-flex flex-col items-center group/stock hover:bg-slate-100 p-2 rounded-lg transition-colors"
                              >
                                 <span className={`text-lg font-bold ${totalStock <= (p.inventoryPlanning?.reorderPoint || 0) ? 'text-red-500' : 'text-slate-800'}`}>
                                    {totalStock}
                                 </span>
                                 <span className="text-[10px] text-indigo-600 opacity-0 group-hover/stock:opacity-100 font-medium">{t('view')}</span>
                              </button>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                 <button 
                                    onClick={() => { setMarkdownProduct(p); setIsMarkdownModalOpen(true); }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Set Markdown"
                                 >
                                    <Tag size={16} />
                                 </button>
                                 <button 
                                    onClick={() => { setSelectedProduct(p); setIsProductFormOpen(true); }} 
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title={t('edit')}
                                 >
                                    <Edit2 size={16} />
                                 </button>
                                 <button
                                    onClick={() => { setDetailProduct(p); }}
                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                    title={t('view')}
                                 >
                                    <Eye size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     )})}
                  </tbody>
               </table>
               </div>
            </div>
         </div>
      )}

      {/* 3. TRANSACTIONS */}
      {activeTab === 'transactions' && (
         <div className="space-y-4">
            <div className="flex justify-end">
               <button onClick={() => onImportClick('stock_movements')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                  <Upload size={16} /> {t('import')}
               </button>
            </div>
            <StockMovementLog movements={filteredMovements} />
         </div>
      )}

      {/* 4. WAREHOUSE */}
      {activeTab === 'warehouse' && (
         <StoreNetwork 
            stores={matchedStores} 
            onAddAction={() => {}} 
            onEditAction={() => {}} 
            onImportAction={() => {}} 
            onBulkUpdateAction={() => {}} 
         />
      )}

      {/* 5. PLANNING */}
      {activeTab === 'planning' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><Calculator size={18} className="text-indigo-600"/> Replenishment Suggestions</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                     <th className="px-6 py-4 min-w-[200px]">Product / SKU</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-right">Current Stock</th>
                     <th className="px-6 py-4 text-right">Reorder Point</th>
                     <th className="px-6 py-4 text-right text-indigo-700 font-bold bg-indigo-50/50">Suggested Order</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {matchedProducts.map(p => {
                     const currentStock = inventory.filter(i => i.productId === p.id).reduce((acc, i) => acc + i.quantity, 0);
                     const rp = p.inventoryPlanning?.reorderPoint || 10;
                     const ss = p.inventoryPlanning?.safetyStock || 5;
                     const suggested = Math.max(0, (rp + ss) - currentStock);
                     let status = t('ok');
                     if (currentStock <= 0) status = t('critical');
                     else if (currentStock < rp) status = t('reorder');
                     else if (currentStock > rp * 3) status = t('overstock');

                     return (
                        <tr key={p.id} className="hover:bg-slate-50">
                           <td className="px-6 py-4"><div className="font-bold text-slate-800">{p.name}</div><div className="text-xs text-slate-400 font-mono">{p.sku}</div></td>
                           <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${status === t('critical') ? 'bg-red-100 text-red-700' : status === t('reorder') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                 {status === t('critical') && <AlertTriangle size={12} />}
                                 {status === t('ok') && <CheckCircle size={12} />}
                                 {status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right font-medium">{currentStock}</td>
                           <td className="px-6 py-4 text-right text-slate-500">{rp}</td>
                           <td className="px-6 py-4 text-right font-bold text-indigo-700 bg-indigo-50/30">{suggested > 0 ? `+${suggested}` : '-'}</td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
            </div>
         </div>
      )}

      {/* 6. REPORTS */}
      {activeTab === 'reports' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                  <p className="text-sm font-bold text-slate-500 uppercase">{t('valuation')} (Filtered)</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-2">{formatCurrency(totalValuation)}</p>
               </div>
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                  <p className="text-sm font-bold text-slate-500 uppercase">{t('total_units')} (Filtered)</p>
                  <p className="text-3xl font-bold text-indigo-700 mt-2">{totalUnits.toLocaleString()}</p>
               </div>
            </div>
            <ProductAnalytics movements={filteredMovements} products={matchedProducts} />
         </div>
      )}

      {/* Global Modals */}
      <TransactionFormModal isOpen={isTransModalOpen} onClose={() => setIsTransModalOpen(false)} stores={stores} products={products} inventory={inventory} onSubmit={onRecordTransaction} />
      
      <ProductForm 
         isOpen={isProductFormOpen} 
         onClose={() => setIsProductFormOpen(false)} 
         onSave={() => setIsProductFormOpen(false)} 
         productToEdit={selectedProduct} 
         inventory={inventory} 
         stores={stores} 
         suppliers={suppliers} 
      />
      
      <ProductDetailModal 
         isOpen={!!detailProduct} 
         onClose={() => setDetailProduct(null)} 
         product={detailProduct} 
         inventory={inventory} 
         onEdit={(p) => { 
            setDetailProduct(null); // Close details view
            setSelectedProduct(p); // Set for edit
            setIsProductFormOpen(true); // Open edit form
         }} 
      />
      
      <StoreStockModal 
         isOpen={!!selectedStoreStock} 
         onClose={() => setSelectedStoreStock(null)} 
         storeName={selectedStoreStock?.name || null} 
         items={selectedStoreStock?.items || []} 
         products={products} 
         onViewProduct={(sku) => {
            const p = products.find(prod => prod.sku === sku);
            if (p) setDetailProduct(p); // Open details instead of edit
         }} 
      />
      
      <MarkdownModal isOpen={isMarkdownModalOpen} onClose={() => setIsMarkdownModalOpen(false)} product={markdownProduct} onSave={onSaveMarkdown} />
    </div>
  );
};
