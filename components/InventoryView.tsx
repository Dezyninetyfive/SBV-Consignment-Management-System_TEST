
import React, { useState, useMemo } from 'react';
import { InventoryItem, Product, StoreProfile, StockMovement, MovementType } from '../types';
import { ProductAnalytics } from './ProductAnalytics';
import { TransactionFormModal } from './TransactionFormModal';
import { ProductDetailModal } from './ProductDetailModal';
import { StoreStockModal } from './StoreStockModal';
import { ArrowRightLeft, Package, MapPin, Grid, List, Search, Filter, BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { SAMPLE_BRANDS, PRODUCT_CATEGORIES } from '../constants';
import { formatCurrency } from '../utils/dataUtils';

interface Props {
  inventory: InventoryItem[];
  products: Product[];
  stores: StoreProfile[];
  movements: StockMovement[];
  onRecordTransaction: (data: { date: string, type: MovementType, storeId: string, productId: string, variant: string, quantity: number, reference: string }) => void;
}

export const InventoryView: React.FC<Props> = ({ inventory, products, stores, movements, onRecordTransaction }) => {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStoreStock, setSelectedStoreStock] = useState<{name: string, items: InventoryItem[]} | null>(null);

  // --- Global Filter State ---
  const [storeSearch, setStoreSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'stock_high' | 'stock_low' | 'value_high' | 'value_low'>('stock_high');

  // --- Derived Data Logic ---

  // 1. Filter Products first (Brand/Category)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const matchBrand = filterBrand === 'All' || p.brand === filterBrand;
        const matchCat = filterCategory === 'All' || p.category === filterCategory;
        return matchBrand && matchCat;
    });
  }, [products, filterBrand, filterCategory]);

  const filteredProductIds = useMemo(() => new Set(filteredProducts.map(p => p.id)), [filteredProducts]);

  // 2. Filter Inventory based on valid Products
  const filteredInventory = useMemo(() => {
      return inventory.filter(i => filteredProductIds.has(i.productId));
  }, [inventory, filteredProductIds]);

  // 3. Filter Movements based on valid Products (for Analytics)
  const filteredMovements = useMemo(() => {
      return movements.filter(m => filteredProductIds.has(m.productId));
  }, [movements, filteredProductIds]);

  // 4. Calculate Stats per Store (Dynamic Valuations)
  const storeStats = useMemo<Record<string, { qty: number, value: number, count: number }>>(() => {
      const stats: Record<string, { qty: number, value: number, count: number }> = {};
      
      // Initialize all stores
      stores.forEach(s => {
          stats[s.id] = { qty: 0, value: 0, count: 0 };
      });

      // Aggregate filtered inventory
      filteredInventory.forEach(item => {
          if (stats[item.storeId]) {
              stats[item.storeId].qty += item.quantity;
              stats[item.storeId].count += 1;
              const prod = products.find(p => p.id === item.productId);
              if (prod) {
                  stats[item.storeId].value += (item.quantity * prod.cost);
              }
          }
      });
      return stats;
  }, [filteredInventory, stores, products]);

  // 5. Filter and Sort Stores
  const processedStores = useMemo(() => {
      // Step A: Filter Stores by Metadata
      let result = stores.filter(s => {
          const matchSearch = s.name.toLowerCase().includes(storeSearch.toLowerCase());
          const matchGroup = filterGroup === 'All' || s.group === filterGroup;
          const matchRegion = filterRegion === 'All' || s.region === filterRegion;
          return matchSearch && matchGroup && matchRegion;
      });

      // Step B: Sort
      return result.sort((a, b) => {
          const statA = storeStats[a.id] || { qty: 0, value: 0, count: 0 };
          const statB = storeStats[b.id] || { qty: 0, value: 0, count: 0 };

          switch (sortBy) {
              case 'stock_high': return statB.qty - statA.qty;
              case 'stock_low': return statA.qty - statB.qty;
              case 'value_high': return statB.value - statA.value;
              case 'value_low': return statA.value - statB.value;
              default: return a.name.localeCompare(b.name);
          }
      });
  }, [stores, storeSearch, filterGroup, filterRegion, sortBy, storeStats]);

  // Global Summary Metrics (Cast to known type for safety)
  const totalValuation = (Object.values(storeStats) as { value: number }[]).reduce((acc, s) => acc + s.value, 0);
  const totalUnits = (Object.values(storeStats) as { qty: number }[]).reduce((acc, s) => acc + s.qty, 0);

  // Helper Lists
  const uniqueGroups = ['All', ...Array.from(new Set(stores.map(s => s.group))).sort()];
  const uniqueRegions = ['All', ...Array.from(new Set(stores.map(s => s.region))).sort()];
  const uniqueCategories = ['All', ...Array.from(new Set(Object.values(PRODUCT_CATEGORIES).flat())).sort()];

  // Handlers
  const handleTransferSubmit = (data: { date: string, fromStoreId: string, toStoreId: string, productId: string, variant: string, quantity: number, reference: string }) => {
     onRecordTransaction({
        date: data.date,
        type: 'Transfer Out',
        storeId: data.fromStoreId,
        productId: data.productId,
        variant: data.variant,
        quantity: -data.quantity,
        reference: data.reference
     });
     onRecordTransaction({
        date: data.date,
        type: 'Transfer In',
        storeId: data.toStoreId,
        productId: data.productId,
        variant: data.variant,
        quantity: data.quantity,
        reference: data.reference
     });
  };

  const openStoreStock = (storeId: string) => {
     const store = stores.find(s => s.id === storeId);
     const items = filteredInventory.filter(i => i.storeId === storeId && i.quantity > 0);
     if (store) {
        setSelectedStoreStock({ name: store.name, items });
     }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       
       {/* Header & Controls */}
       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-indigo-600" /> Supply Chain Command Center
             </h2>
             <p className="text-slate-500">Manage stock distribution, analyze flow, and optimize inventory.</p>
          </div>
          <button 
             onClick={() => setIsTransactionModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors whitespace-nowrap"
          >
             <ArrowRightLeft size={18} /> New Transfer / Adjustment
          </button>
       </div>

       {/* Global Filter Bar */}
       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
             {/* Search */}
             <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                   type="text"
                   placeholder="Search store name..."
                   className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                   value={storeSearch}
                   onChange={(e) => setStoreSearch(e.target.value)}
                />
             </div>

             {/* Dropdowns */}
             <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 flex-1">
                <select 
                   className="px-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
                   value={filterBrand}
                   onChange={(e) => setFilterBrand(e.target.value)}
                >
                   <option value="All">All Brands</option>
                   {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select 
                   className="px-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
                   value={filterCategory}
                   onChange={(e) => setFilterCategory(e.target.value)}
                >
                   <option value="All">All Categories</option>
                   {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                   className="px-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
                   value={filterGroup}
                   onChange={(e) => setFilterGroup(e.target.value)}
                >
                   {uniqueGroups.map(g => <option key={g} value={g}>{g === 'All' ? 'All Retail Groups' : g}</option>)}
                </select>
                <select 
                   className="px-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-auto"
                   value={filterRegion}
                   onChange={(e) => setFilterRegion(e.target.value)}
                >
                   {uniqueRegions.map(r => <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>)}
                </select>
             </div>
          </div>

          {/* View Ticker */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-slate-100 gap-4">
             <div className="flex gap-6 w-full sm:w-auto justify-around sm:justify-start">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Package size={20} /></div>
                   <div>
                      <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Total Units (View)</p>
                      <p className="text-lg md:text-xl font-bold text-slate-800">{totalUnits.toLocaleString()}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign size={20} /></div>
                   <div>
                      <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase">Valuation (Cost)</p>
                      <p className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(totalValuation)}</p>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-semibold text-slate-500 uppercase mr-2 hidden sm:inline">Sort Stores By:</span>
                <select 
                   className="px-3 py-1.5 border border-slate-200 rounded-lg text-base sm:text-sm bg-white focus:outline-none cursor-pointer flex-1 sm:flex-none"
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value as any)}
                >
                   <option value="stock_high">Highest Stock Qty</option>
                   <option value="stock_low">Lowest Stock Qty</option>
                   <option value="value_high">Highest Value</option>
                   <option value="value_low">Lowest Value</option>
                   <option value="name">Store Name (A-Z)</option>
                </select>
                <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                   <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                      <Grid size={16} />
                   </button>
                   <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                      <List size={16} />
                   </button>
                </div>
             </div>
          </div>
       </div>

       {/* Filtered Analytics */}
       <ProductAnalytics movements={filteredMovements} products={filteredProducts} />

       {/* Store List */}
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <MapPin className="text-emerald-600" /> Stock Distribution ({processedStores.length} Stores)
          </h3>

          {viewMode === 'grid' ? (
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {processedStores.map(store => {
                   const stats = (storeStats[store.id] as { qty: number, value: number, count: number } | undefined) || { qty: 0, value: 0, count: 0 };
                   return (
                      <div 
                         key={store.id} 
                         onClick={() => openStoreStock(store.id)}
                         className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all bg-slate-50 hover:bg-white group flex flex-col h-full relative overflow-hidden"
                      >
                         <div className="flex justify-between items-start mb-2 relative z-10">
                            <span className="text-[10px] font-bold uppercase text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                               {store.group}
                            </span>
                            <span className="text-[10px] text-slate-400">{store.region}</span>
                         </div>
                         <h4 className="font-bold text-slate-700 group-hover:text-indigo-600 mb-4 leading-tight relative z-10">{store.name}</h4>
                         
                         <div className="mt-auto pt-4 border-t border-slate-100 relative z-10">
                            <div className="flex justify-between items-center mb-1">
                               <p className="text-xs text-slate-500">Stock Qty</p>
                               <p className="font-mono font-bold text-slate-800">{stats.qty}</p>
                            </div>
                            <div className="flex justify-between items-center">
                               <p className="text-xs text-slate-500">Value</p>
                               <p className="font-mono font-bold text-emerald-600">{formatCurrency(stats.value)}</p>
                            </div>
                         </div>
                         {/* Visual indicator for high stock */}
                         {stats.qty > 100 && (
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-100/50 to-transparent pointer-events-none rounded-bl-full -mr-8 -mt-8" />
                         )}
                      </div>
                   );
                })}
             </div>
          ) : (
             <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase">
                      <tr>
                         <th className="px-4 py-3">Store Name</th>
                         <th className="px-4 py-3">Group</th>
                         <th className="px-4 py-3">Region</th>
                         <th className="px-4 py-3 text-right">Items (SKUs)</th>
                         <th className="px-4 py-3 text-right">Total Units</th>
                         <th className="px-4 py-3 text-right">Valuation</th>
                         <th className="px-4 py-3"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {processedStores.map(store => {
                         const stats = (storeStats[store.id] as { qty: number, value: number, count: number } | undefined) || { qty: 0, value: 0, count: 0 };
                         return (
                            <tr key={store.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openStoreStock(store.id)}>
                               <td className="px-4 py-3 font-medium text-slate-800">{store.name}</td>
                               <td className="px-4 py-3 text-slate-500">{store.group}</td>
                               <td className="px-4 py-3 text-slate-500">{store.region}</td>
                               <td className="px-4 py-3 text-right font-mono">{stats.count}</td>
                               <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{stats.qty}</td>
                               <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(stats.value)}</td>
                               <td className="px-4 py-3 text-right">
                                  <button className="text-xs text-indigo-600 hover:underline">View Stock</button>
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          )}
          
          {processedStores.length === 0 && (
             <div className="p-8 text-center text-slate-400">No stores found matching your filters.</div>
          )}
       </div>

       {/* Modals */}
       <TransactionFormModal 
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          stores={stores}
          products={products}
          inventory={inventory}
          onSubmit={onRecordTransaction}
          onTransfer={handleTransferSubmit}
       />

       <ProductDetailModal 
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          inventory={inventory}
          onEdit={() => {}} // Placeholder
       />

       <StoreStockModal 
          isOpen={!!selectedStoreStock}
          onClose={() => setSelectedStoreStock(null)}
          storeName={selectedStoreStock?.name || null}
          items={selectedStoreStock?.items || []}
          products={products}
          onViewProduct={(sku) => {
             const p = products.find(prod => prod.sku === sku);
             if (p) setSelectedProduct(p);
          }}
       />
    </div>
  );
};
