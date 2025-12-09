
import React, { useState, useMemo } from 'react';
import { InventoryItem, Product, StoreProfile, StockMovement, MovementType, SaleRecord, Supplier } from '../types';
import { ProductAnalytics } from './ProductAnalytics';
import { TransactionFormModal } from './TransactionFormModal';
import { ProductDetailModal } from './ProductDetailModal';
import { StoreStockModal } from './StoreStockModal';
import { StoreNetwork } from './StoreNetwork';
import { StockMovementLog } from './StockMovementLog';
import { ProductForm } from './ProductForm';
import { formatCurrency } from '../utils/dataUtils';
import { 
  Package, LayoutGrid, ArrowRightLeft, Store, Calculator, BarChart3, 
  Search, Filter, Plus, Edit2, AlertTriangle, CheckCircle 
} from 'lucide-react';

interface Props {
  inventory: InventoryItem[];
  products: Product[];
  stores: StoreProfile[];
  movements: StockMovement[];
  history: SaleRecord[];
  suppliers: Supplier[];
  onRecordTransaction: (data: any) => void;
}

export const InventoryManagement: React.FC<Props> = ({ 
  inventory, products, stores, movements, history, suppliers, onRecordTransaction 
}) => {
  const [activeTab, setActiveTab] = useState<'master' | 'ledger' | 'transactions' | 'warehouse' | 'planning' | 'reports'>('ledger');
  
  // Modals
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [selectedStoreStock, setSelectedStoreStock] = useState<{name: string, items: InventoryItem[]} | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('All');

  // --- TAB 1: MASTER DATA (Product Catalog) ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBrand = filterBrand === 'All' || p.brand === filterBrand;
      return matchSearch && matchBrand;
    });
  }, [products, searchTerm, filterBrand]);

  // --- TAB 2: LEDGER (Current Stock) ---
  const storeStockSummary = useMemo(() => {
    return stores.map(store => {
      const items = inventory.filter(i => i.storeId === store.id && i.quantity > 0);
      const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
      const totalValue = items.reduce((acc, i) => {
        const p = products.find(prod => prod.id === i.productId);
        return acc + (i.quantity * (p?.cost || 0));
      }, 0);
      return { ...store, itemCount: items.length, totalQty, totalValue };
    }).filter(s => {
       const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
       return matchSearch;
    });
  }, [stores, inventory, products, searchTerm]);

  // --- TAB 5: PLANNING (Replenishment) ---
  const replenishmentData = useMemo(() => {
    return products.map(p => {
      // 1. Current Total Stock
      const currentStock = inventory.filter(i => i.productId === p.id).reduce((acc, i) => acc + i.quantity, 0);
      
      // 2. Avg Sales (Last 3 months approximation based on history)
      // Ideally this comes from a robust forecast, here we simplisticly sum recent sales
      // For demo, we use a random factor or the planning field if we had real forecast linked
      const safetyStock = p.inventoryPlanning?.safetyStock || 10;
      const reorderPoint = p.inventoryPlanning?.reorderPoint || 20;
      
      // Calculate Status
      let status: 'OK' | 'Reorder' | 'Overstock' | 'Critical' = 'OK';
      if (currentStock <= 0) status = 'Critical';
      else if (currentStock < reorderPoint) status = 'Reorder';
      else if (currentStock > reorderPoint * 3) status = 'Overstock';

      // Suggested Order = (Reorder Point + Safety Stock) - Current
      const suggested = Math.max(0, (reorderPoint + safetyStock) - currentStock);

      return {
        product: p,
        currentStock,
        safetyStock,
        reorderPoint,
        suggested,
        status
      };
    }).filter(row => filterBrand === 'All' || row.product.brand === filterBrand);
  }, [products, inventory, filterBrand]);

  const tabs = [
    { id: 'master', label: 'Item Master', icon: LayoutGrid },
    { id: 'ledger', label: 'Stock Ledger', icon: Package },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    { id: 'warehouse', label: 'Warehouse / Store', icon: Store },
    { id: 'planning', label: 'Planning', icon: Calculator },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Nav */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="text-indigo-600" /> Inventory Management
            </h2>
            <p className="text-slate-500">End-to-end supply chain control: Catalog, Stock, and Replenishment.</p>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={() => setIsTransModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 flex items-center gap-2"
             >
                <ArrowRightLeft size={18} /> Record Movement
             </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex overflow-x-auto gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      
      {/* 1. Item Master */}
      {activeTab === 'master' && (
        <div className="space-y-4">
           <div className="flex gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="Search SKU or Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <button 
                 onClick={() => { setSelectedProduct(null); setIsProductFormOpen(true); }}
                 className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
              >
                 <Plus size={16} /> Add Item
              </button>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                 <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                    <tr>
                       <th className="px-6 py-4">Item Details</th>
                       <th className="px-6 py-4">Attributes</th>
                       <th className="px-6 py-4">Supplier</th>
                       <th className="px-6 py-4 text-right">Cost / Price</th>
                       <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                {p.imageUrl ? (
                                   <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100" alt="" />
                                ) : (
                                   <div className="w-10 h-10 rounded-lg bg-slate-100" />
                                )}
                                <div>
                                   <p className="font-bold text-slate-800">{p.name}</p>
                                   <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-slate-500">{p.sku}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 border border-slate-200">{p.brand}</span>
                                   </div>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-wrap gap-1">
                                {p.attributes?.fabric && <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">{p.attributes.fabric}</span>}
                                {p.attributes?.fit && <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">{p.attributes.fit}</span>}
                                {p.attributes?.gender && <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">{p.attributes.gender}</span>}
                             </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                             {p.supplierName || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <p className="font-medium text-slate-800">{formatCurrency(p.price)}</p>
                             <p className="text-xs text-slate-400">Cost: {formatCurrency(p.cost)}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button onClick={() => { setSelectedProduct(p); setIsProductFormOpen(true); }} className="p-2 hover:bg-slate-100 rounded-lg text-indigo-600">
                                <Edit2 size={16} />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* 2. Stock Ledger */}
      {activeTab === 'ledger' && (
         <div className="space-y-4">
            <div className="flex gap-4 mb-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                     className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                     placeholder="Filter by Store Name..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {storeStockSummary.map(store => (
                  <div 
                     key={store.id} 
                     onClick={() => { 
                        const items = inventory.filter(i => i.storeId === store.id && i.quantity > 0);
                        setSelectedStoreStock({ name: store.name, items });
                     }}
                     className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all"
                  >
                     <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-slate-800 line-clamp-1 pr-2">{store.name}</h4>
                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded">{store.region}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                           <p className="text-xs text-slate-500 uppercase">Stock Qty</p>
                           <p className="text-xl font-bold text-slate-800">{store.totalQty}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs text-slate-500 uppercase">Valuation</p>
                           <p className="text-xl font-bold text-emerald-600">{formatCurrency(store.totalValue)}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* 3. Transactions */}
      {activeTab === 'transactions' && (
         <StockMovementLog movements={movements} />
      )}

      {/* 4. Warehouse / Store */}
      {activeTab === 'warehouse' && (
         <StoreNetwork 
            stores={stores} 
            onAddAction={() => {}} 
            onEditAction={() => {}} 
            onImportAction={() => {}} 
            onBulkUpdateAction={() => {}}
         />
      )}

      {/* 5. Planning (Replenishment) */}
      {activeTab === 'planning' && (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calculator size={18} className="text-indigo-600" /> Replenishment Suggestions
               </h3>
               <div className="text-xs text-slate-500">
                  Based on Reorder Points & Safety Stock
               </div>
            </div>
            <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                     <th className="px-6 py-4">Product / SKU</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-right">Current Stock</th>
                     <th className="px-6 py-4 text-right">Reorder Point</th>
                     <th className="px-6 py-4 text-right text-indigo-700 font-bold bg-indigo-50/50">Suggested Order</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {replenishmentData.map((row) => (
                     <tr key={row.product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                           <div className="font-bold text-slate-800">{row.product.name}</div>
                           <div className="text-xs text-slate-400 font-mono">{row.product.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              row.status === 'Critical' ? 'bg-red-100 text-red-700' :
                              row.status === 'Reorder' ? 'bg-amber-100 text-amber-700' :
                              row.status === 'Overstock' ? 'bg-blue-100 text-blue-700' :
                              'bg-emerald-100 text-emerald-700'
                           }`}>
                              {row.status === 'Critical' && <AlertTriangle size={12} />}
                              {row.status === 'OK' && <CheckCircle size={12} />}
                              {row.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{row.currentStock}</td>
                        <td className="px-6 py-4 text-right text-slate-500">{row.reorderPoint}</td>
                        <td className="px-6 py-4 text-right font-bold text-indigo-700 bg-indigo-50/30">
                           {row.suggested > 0 ? `+${row.suggested}` : '-'}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )}

      {/* 6. Reports */}
      {activeTab === 'reports' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                  <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 mb-3"><LayoutGrid size={24} /></div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Total Inventory Value (Cost)</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">
                     {formatCurrency(inventory.reduce((acc, i) => {
                        const p = products.find(prod => prod.id === i.productId);
                        return acc + (i.quantity * (p?.cost || 0));
                     }, 0))}
                  </p>
               </div>
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                  <div className="p-3 bg-indigo-50 rounded-full text-indigo-600 mb-3"><LayoutGrid size={24} /></div>
                  <p className="text-sm font-bold text-slate-500 uppercase">Potential Revenue (Retail)</p>
                  <p className="text-3xl font-bold text-indigo-700 mt-1">
                     {formatCurrency(inventory.reduce((acc, i) => {
                        const p = products.find(prod => prod.id === i.productId);
                        return acc + (i.quantity * (p?.price || 0));
                     }, 0))}
                  </p>
               </div>
            </div>
            <ProductAnalytics movements={movements} products={products} />
         </div>
      )}

      {/* GLOBAL MODALS */}
      <TransactionFormModal 
         isOpen={isTransModalOpen} 
         onClose={() => setIsTransModalOpen(false)} 
         stores={stores} 
         products={products} 
         inventory={inventory} 
         onSubmit={onRecordTransaction} 
      />

      <ProductForm 
         isOpen={isProductFormOpen}
         onClose={() => setIsProductFormOpen(false)}
         onSave={() => setIsProductFormOpen(false)} // Mock save
         productToEdit={selectedProduct}
         inventory={inventory}
         stores={stores}
      />

      <StoreStockModal 
         isOpen={!!selectedStoreStock}
         onClose={() => setSelectedStoreStock(null)}
         storeName={selectedStoreStock?.name || ''}
         items={selectedStoreStock?.items || []}
         products={products}
         onViewProduct={() => {}}
      />

    </div>
  );
};
