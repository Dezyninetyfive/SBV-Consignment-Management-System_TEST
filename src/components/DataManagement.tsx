import React, { useState } from 'react';
import { SaleRecord, StockMovement, StoreProfile, Product, InventoryItem, MovementType } from '../types';
import { 
  Table, 
  FileText, 
  ShoppingBag, 
  Store, 
  ArrowRightLeft,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import { formatCurrency } from '../utils/dataUtils';
import { StoreNetwork } from './StoreNetwork';
import { StockMovementLog } from './StockMovementLog';
import { TransactionFormModal } from './TransactionFormModal';
import { ProductForm } from './ProductForm';
import { StoreModal } from './StoreModal';
import { AddRecordModal } from './AddRecordModal';

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
                <div className="flex justify-end gap-2 mb-4">
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
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                         <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                               <th className="px-6 py-4">Date</th>
                               <th className="px-6 py-4">Store</th>
                               <th className="px-6 py-4">Brand</th>
                               <th className="px-6 py-4 text-right">Amount</th>
                               <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {history.slice(0, 50).map(r => (
                               <tr key={r.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 font-mono text-xs">{r.date}</td>
                                  <td className="px-6 py-4 font-medium text-slate-800">{r.counter}</td>
                                  <td className="px-6 py-4">
                                     <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{r.brand}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-indigo-900">{formatCurrency(r.amount)}</td>
                                  <td className="px-6 py-4 text-right">
                                     <button onClick={() => onDeleteRecord(r.id)} className="text-slate-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                     </button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                         Showing last 50 records. Use search or filter for specific data.
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
                <div className="flex justify-end gap-2 mb-4">
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
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                   {products.map(p => (
                      <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                         <div className="aspect-square bg-slate-100 relative">
                            <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                            <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold uppercase">
                               {p.brand}
                            </div>
                         </div>
                         <div className="p-3">
                            <h4 className="font-bold text-slate-800 line-clamp-1">{p.name}</h4>
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