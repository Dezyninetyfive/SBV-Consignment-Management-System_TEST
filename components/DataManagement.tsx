
import React, { useState, useMemo } from 'react';
import { SaleRecord, StockMovement, StoreProfile, Product, InventoryItem, MovementType } from '../types';
import { 
  Table, 
  FileText, 
  ShoppingBag, 
  Store, 
  ArrowRightLeft,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatCurrency } from '../utils/dataUtils';
import { StoreNetwork } from './StoreNetwork';
import { StockMovementLog } from './StockMovementLog';
import { TransactionFormModal } from './TransactionFormModal';
import { ProductForm } from './ProductForm';
import { StoreModal } from './StoreModal';
import { AddRecordModal } from './AddRecordModal';
import { SAMPLE_BRANDS } from '../constants';

interface Props {
  history: SaleRecord[];
  movements: StockMovement[];
  stores: StoreProfile[];
  products: Product[];
  inventory: InventoryItem[];
  targetStore?: string | null;
  onImportClick: (type: 'sales' | 'stores' | 'products' | 'stock_movements') => void;
  onEditRecord: (record: SaleRecord) => void;
  onDeleteRecord: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onRecordTransaction: (data: { date: string, type: MovementType, storeId: string, productId: string, variant: string, quantity: number, reference: string }) => void;
}

export const DataManagement: React.FC<Props> = ({ 
  history, movements, stores, products, inventory, targetStore,
  onImportClick, onEditRecord, onDeleteRecord, onBulkDelete, onRecordTransaction 
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'movements' | 'products' | 'stores'>('sales');
  
  // Modals State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<StoreProfile | null>(null);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SaleRecord | null>(null);

  // --- Sales Filtering & Sorting ---
  const [salesSearch, setSalesSearch] = useState('');
  const [salesBrand, setSalesBrand] = useState('All');
  const [salesStore, setSalesStore] = useState('All');
  const [salesSort, setSalesSort] = useState<{ key: keyof SaleRecord, dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });

  const filteredHistory = useMemo(() => {
    let data = history.filter(r => {
      const matchSearch = r.counter.toLowerCase().includes(salesSearch.toLowerCase()) || r.brand.toLowerCase().includes(salesSearch.toLowerCase());
      const matchBrand = salesBrand === 'All' || r.brand === salesBrand;
      const matchStore = salesStore === 'All' || r.counter === salesStore;
      return matchSearch && matchBrand && matchStore;
    });

    return data.sort((a, b) => {
      const valA = a[salesSort.key];
      const valB = b[salesSort.key];
      if (valA < valB) return salesSort.dir === 'asc' ? -1 : 1;
      if (valA > valB) return salesSort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [history, salesSearch, salesBrand, salesStore, salesSort]);

  const handleSalesSort = (key: keyof SaleRecord) => {
    setSalesSort(prev => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));
  };

  // --- Product Filtering ---
  const [prodSearch, setProdSearch] = useState('');
  const [prodBrand, setProdBrand] = useState('All');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku.toLowerCase().includes(prodSearch.toLowerCase());
      const matchBrand = prodBrand === 'All' || p.brand === prodBrand;
      return matchSearch && matchBrand;
    });
  }, [products, prodSearch, prodBrand]);

  const SortIcon = ({ col, currentSort }: { col: string, currentSort: any }) => {
    if (currentSort.key !== col) return <div className="w-4 h-4" />;
    return currentSort.dir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Table className="text-indigo-600" /> Data Management
             </h2>
             <p className="text-slate-500">Manage master data and transaction records.</p>
          </div>
          
          <div className="bg-slate-100 p-1 rounded-lg flex overflow-x-auto max-w-full">
             {[
               { id: 'sales', label: 'Sales History', icon: FileText },
               { id: 'movements', label: 'Stock Log', icon: ArrowRightLeft },
               { id: 'products', label: 'Products', icon: ShoppingBag },
               { id: 'stores', label: 'Stores', icon: Store },
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 <tab.icon size={16} /> {tab.label}
               </button>
             ))}
          </div>
       </div>

       <div className="bg-slate-50 rounded-xl p-1 min-h-[500px]">
          {activeTab === 'sales' && (
             <div className="space-y-4">
                {/* Sales Toolbar */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex flex-wrap gap-3 flex-1">
                      <div className="relative flex-1 min-w-[200px]">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         <input 
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Search records..."
                            value={salesSearch}
                            onChange={(e) => setSalesSearch(e.target.value)}
                         />
                      </div>
                      <select 
                         className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                         value={salesBrand}
                         onChange={(e) => setSalesBrand(e.target.value)}
                      >
                         <option value="All">All Brands</option>
                         {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <select 
                         className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none max-w-[200px]"
                         value={salesStore}
                         onChange={(e) => setSalesStore(e.target.value)}
                      >
                         <option value="All">All Stores</option>
                         {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => onImportClick('sales')}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                      >
                        Import CSV
                      </button>
                      <button 
                        onClick={() => { setRecordToEdit(null); setIsAddRecordModalOpen(true); }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                      >
                        <Plus size={16} /> Add Sale
                      </button>
                   </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                         <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                               <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSalesSort('date')}>
                                  <div className="flex items-center gap-1">Date <SortIcon col="date" currentSort={salesSort} /></div>
                               </th>
                               <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSalesSort('counter')}>
                                  <div className="flex items-center gap-1">Store <SortIcon col="counter" currentSort={salesSort} /></div>
                               </th>
                               <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSalesSort('brand')}>
                                  <div className="flex items-center gap-1">Brand <SortIcon col="brand" currentSort={salesSort} /></div>
                               </th>
                               <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSalesSort('amount')}>
                                  <div className="flex items-center justify-end gap-1">Amount <SortIcon col="amount" currentSort={salesSort} /></div>
                               </th>
                               <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {filteredHistory.slice(0, 100).map(r => (
                               <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{r.date}</td>
                                  <td className="px-6 py-4 font-medium text-slate-800">{r.counter}</td>
                                  <td className="px-6 py-4">
                                     <span className={`px-2 py-0.5 rounded text-xs border ${
                                        r.brand === 'Domino' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        r.brand === 'OTTO' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                        'bg-amber-50 text-amber-700 border-amber-100'
                                     }`}>
                                        {r.brand}
                                     </span>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-indigo-900">{formatCurrency(r.amount)}</td>
                                  <td className="px-6 py-4 text-right">
                                     <button 
                                       onClick={() => onDeleteRecord(r.id)} 
                                       className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                       title="Delete Record"
                                     >
                                        <Trash2 size={16} />
                                     </button>
                                  </td>
                               </tr>
                            ))}
                            {filteredHistory.length === 0 && (
                               <tr><td colSpan={5} className="p-8 text-center text-slate-400">No records found matching filters.</td></tr>
                            )}
                         </tbody>
                      </table>
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                         Showing {Math.min(100, filteredHistory.length)} of {filteredHistory.length} records.
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'movements' && (
             <StockMovementLog 
                movements={movements}
                onAddTransaction={() => setIsTransactionModalOpen(true)}
                onPrintDO={(ref) => console.log("Printing DO", ref)}
             />
          )}

          {activeTab === 'products' && (
             <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex gap-4 flex-1 w-full sm:w-auto">
                      <div className="relative flex-1 max-w-xs">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         <input 
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Search products..."
                            value={prodSearch}
                            onChange={(e) => setProdSearch(e.target.value)}
                         />
                      </div>
                      <select 
                         className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                         value={prodBrand}
                         onChange={(e) => setProdBrand(e.target.value)}
                      >
                         <option value="All">All Brands</option>
                         {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => onImportClick('products')}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                      >
                        Import Products
                      </button>
                      <button 
                        onClick={() => { setProductToEdit(null); setIsProductFormOpen(true); }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                      >
                        <Plus size={16} /> Add Product
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                   {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                         <div className="aspect-square bg-slate-100 relative">
                            <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                            <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm">
                               {p.brand}
                            </div>
                         </div>
                         <div className="p-3">
                            <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                            <p className="text-xs text-slate-500 font-mono mb-2">{p.sku}</p>
                            <div className="flex justify-between items-center">
                               <span className="font-bold text-indigo-600">{formatCurrency(p.price)}</span>
                               <button 
                                 onClick={() => { setProductToEdit(p); setIsProductFormOpen(true); }}
                                 className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                               >
                                  <Edit2 size={16} />
                               </button>
                            </div>
                         </div>
                      </div>
                   ))}
                   {filteredProducts.length === 0 && (
                      <div className="col-span-full p-12 text-center text-slate-400">No products found.</div>
                   )}
                </div>
             </div>
          )}

          {activeTab === 'stores' && (
             <StoreNetwork 
                stores={stores}
                onAddAction={() => { setStoreToEdit(null); setIsStoreModalOpen(true); }}
                onEditAction={(s) => { setStoreToEdit(s); setIsStoreModalOpen(true); }}
                onImportAction={() => onImportClick('stores')}
                onBulkUpdateAction={() => {}} // Placeholder
                onDeleteAction={() => {}} // Placeholder
             />
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
       />

       <ProductForm 
          isOpen={isProductFormOpen}
          onClose={() => setIsProductFormOpen(false)}
          onSave={(p) => {
             // Logic to save/update product would go here (lifted up to App typically)
             console.log("Saving Product", p);
             setIsProductFormOpen(false);
          }}
          productToEdit={productToEdit}
          stores={stores}
          inventory={inventory}
       />

       <StoreModal 
          isOpen={isStoreModalOpen}
          onClose={() => setIsStoreModalOpen(false)}
          store={storeToEdit}
          onSave={(s) => {
             console.log("Saving Store", s);
             setIsStoreModalOpen(false);
          }}
       />

       <AddRecordModal 
          isOpen={isAddRecordModalOpen}
          onClose={() => setIsAddRecordModalOpen(false)}
          onSubmit={(r) => {
             // onAddRecord(r);
             console.log("Adding Record", r);
             setIsAddRecordModalOpen(false);
          }}
          existingHistory={history}
          availableStores={stores}
          recordToEdit={recordToEdit}
       />
    </div>
  );
};
