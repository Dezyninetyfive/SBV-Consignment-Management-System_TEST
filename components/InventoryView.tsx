
import React, { useState, useMemo } from 'react';
import { InventoryItem, Product, StoreProfile, StockMovement, MovementType } from '../types';
import { ProductAnalytics } from './ProductAnalytics';
import { TransactionFormModal } from './TransactionFormModal';
import { ProductDetailModal } from './ProductDetailModal';
import { StoreStockModal } from './StoreStockModal';
import { ArrowRightLeft, Package, MapPin, Grid, List, Search, Filter } from 'lucide-react';

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

  // Filters & View State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [storeSearch, setStoreSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');

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
     const items = inventory.filter(i => i.storeId === storeId && i.quantity > 0);
     if (store) {
        setSelectedStoreStock({ name: store.name, items });
     }
  };

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchSearch = store.name.toLowerCase().includes(storeSearch.toLowerCase());
      const matchGroup = filterGroup === 'All' || store.group === filterGroup;
      const matchRegion = filterRegion === 'All' || store.region === filterRegion;
      return matchSearch && matchGroup && matchRegion;
    });
  }, [stores, storeSearch, filterGroup, filterRegion]);

  const uniqueGroups = ['All', ...Array.from(new Set(stores.map(s => s.group))).sort()];
  const uniqueRegions = ['All', ...Array.from(new Set(stores.map(s => s.region))).sort()];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-indigo-600" /> Inventory & Stock
             </h2>
             <p className="text-slate-500">Track stock levels, analyze movement, and manage transfers.</p>
          </div>
          <button 
             onClick={() => setIsTransactionModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors"
          >
             <ArrowRightLeft size={18} /> New Transfer / Adjustment
          </button>
       </div>

       <ProductAnalytics movements={movements} products={products} />

       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="text-emerald-600" /> Stock by Store
             </h3>
             
             <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-48">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                   <input 
                      type="text"
                      placeholder="Search store..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                   />
                </div>
                <div className="relative">
                   <select 
                      className="pl-2 pr-6 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      value={filterGroup}
                      onChange={(e) => setFilterGroup(e.target.value)}
                   >
                      {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                </div>
                <div className="relative">
                   <select 
                      className="pl-2 pr-6 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      value={filterRegion}
                      onChange={(e) => setFilterRegion(e.target.value)}
                   >
                      {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
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

          {viewMode === 'grid' ? (
             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredStores.map(store => {
                   const itemCount = inventory.filter(i => i.storeId === store.id && i.quantity > 0).length;
                   const totalQty = inventory.filter(i => i.storeId === store.id).reduce((acc, i) => acc + i.quantity, 0);
                   
                   return (
                      <div 
                         key={store.id} 
                         onClick={() => openStoreStock(store.id)}
                         className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all bg-slate-50 hover:bg-white group flex flex-col h-full"
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                               {store.group}
                            </span>
                            <span className="text-[10px] text-slate-400">{store.region}</span>
                         </div>
                         <h4 className="font-bold text-slate-700 group-hover:text-indigo-600 mb-4 leading-tight">{store.name}</h4>
                         <div className="mt-auto flex justify-between items-end pt-4 border-t border-slate-100">
                            <div>
                               <p className="text-xs text-slate-500">Products</p>
                               <p className="font-mono font-bold text-slate-800">{itemCount}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs text-slate-500">Total Units</p>
                               <p className="font-mono font-bold text-emerald-600">{totalQty}</p>
                            </div>
                         </div>
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
                         <th className="px-4 py-3 text-right">Unique Items</th>
                         <th className="px-4 py-3 text-right">Total Units</th>
                         <th className="px-4 py-3"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredStores.map(store => {
                         const itemCount = inventory.filter(i => i.storeId === store.id && i.quantity > 0).length;
                         const totalQty = inventory.filter(i => i.storeId === store.id).reduce((acc, i) => acc + i.quantity, 0);
                         return (
                            <tr key={store.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openStoreStock(store.id)}>
                               <td className="px-4 py-3 font-medium text-slate-800">{store.name}</td>
                               <td className="px-4 py-3 text-slate-500">{store.group}</td>
                               <td className="px-4 py-3 text-slate-500">{store.region}</td>
                               <td className="px-4 py-3 text-right font-mono">{itemCount}</td>
                               <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{totalQty}</td>
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
          
          {filteredStores.length === 0 && (
             <div className="p-8 text-center text-slate-400">No stores found matching filters.</div>
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
