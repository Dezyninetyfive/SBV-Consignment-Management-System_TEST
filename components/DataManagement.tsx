
import React, { useState, useMemo, useEffect } from 'react';
import { SaleRecord, StockMovement, StoreProfile, Product, InventoryItem, MovementType, Supplier } from '../types';
import { 
  Table, 
  FileText, 
  Store, 
  Plus,
  Trash2,
  Edit2,
  Upload,
  Truck,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  ArrowUp,
  ArrowDown,
  Download,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/dataUtils';
import { StoreNetwork } from './StoreNetwork';
import { StoreModal } from './StoreModal';
import { AddRecordModal } from './AddRecordModal';
import { SupplierList } from './SupplierList';
import { SupplierModal } from './SupplierModal';
import { SAMPLE_BRANDS } from '../constants';

interface Props {
  history: SaleRecord[];
  movements: StockMovement[];
  stores: StoreProfile[];
  products: Product[];
  inventory: InventoryItem[];
  suppliers?: Supplier[];
  targetStore?: string | null;
  onImportClick: (type: 'sales' | 'stores' | 'products' | 'stock_movements' | 'suppliers' | 'inventory' | 'invoices') => void;
  onEditRecord: (record: SaleRecord) => void;
  onDeleteRecord: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onRecordTransaction: (data: { date: string, type: MovementType, storeId: string, productId: string, variant: string, quantity: number, reference: string }) => void;
}

export const DataManagement: React.FC<Props> = ({ 
  history, movements, stores, products, inventory, suppliers = [], targetStore,
  onImportClick, onEditRecord, onDeleteRecord, onBulkDelete, onRecordTransaction 
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'stores' | 'suppliers'>('sales');
  
  // --- Modals State ---
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<StoreProfile | null>(null);
  
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SaleRecord | null>(null);
  
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  // --- Sales Tab State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterStore, setFilterStore] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortConfig, setSortConfig] = useState<{ key: keyof SaleRecord, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Handle drill-down
  useEffect(() => {
    if (targetStore) {
      setActiveTab('sales');
      setFilterStore(targetStore); // Auto-filter by target store
    }
  }, [targetStore]);

  // --- Sales Data Logic ---
  
  const filteredSales = useMemo(() => {
    return history.filter(item => {
      // 1. Search (ID or Amount)
      const matchesSearch = 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.amount.toString().includes(searchTerm);
      
      // 2. Filters
      const matchesBrand = filterBrand === 'All' || item.brand === filterBrand;
      const matchesStore = filterStore === 'All' || item.counter === filterStore; // SaleRecord uses 'counter' for store name
      
      // 3. Date Range
      let matchesDate = true;
      if (dateRange.start) matchesDate = matchesDate && item.date >= dateRange.start;
      if (dateRange.end) matchesDate = matchesDate && item.date <= dateRange.end;

      return matchesSearch && matchesBrand && matchesStore && matchesDate;
    });
  }, [history, searchTerm, filterBrand, filterStore, dateRange]);

  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSales, sortConfig]);

  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSales.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSales, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const totalAmount = useMemo(() => filteredSales.reduce((sum, r) => sum + r.amount, 0), [filteredSales]);

  // Handlers
  const handleSort = (key: keyof SaleRecord) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedSales.length && paginatedSales.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedSales.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDeleteAction = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  // Helper for Sort Icon
  const SortIcon = ({ column }: { column: keyof SaleRecord }) => {
    if (sortConfig.key !== column) return <div className="w-4 h-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Table className="text-indigo-600" /> Data Management
             </h2>
             <p className="text-slate-500">Master Data Administration & Financial Records</p>
          </div>
          
          <div className="bg-slate-100 p-1 rounded-lg flex overflow-x-auto max-w-full">
             {[
               { id: 'sales', label: 'Sales Records', icon: FileText },
               { id: 'stores', label: 'Store Network', icon: Store },
               { id: 'suppliers', label: 'Suppliers', icon: Truck },
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
                
                {/* Advanced Filter Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex flex-col lg:flex-row gap-4 justify-between">
                      <div className="flex flex-wrap gap-4 flex-1">
                         {/* Date Range */}
                         <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                            <Calendar size={16} className="text-slate-400 ml-2" />
                            <input 
                               type="date" 
                               className="bg-transparent text-sm text-slate-600 focus:outline-none"
                               value={dateRange.start}
                               onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                            <span className="text-slate-300">-</span>
                            <input 
                               type="date" 
                               className="bg-transparent text-sm text-slate-600 focus:outline-none"
                               value={dateRange.end}
                               onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                         </div>

                         {/* Brand Filter */}
                         <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <select 
                               value={filterBrand}
                               onChange={(e) => setFilterBrand(e.target.value)}
                               className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                               <option value="All">All Brands</option>
                               {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                         </div>

                         {/* Store Filter */}
                         <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <select
                               value={filterStore}
                               onChange={(e) => setFilterStore(e.target.value)}
                               className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                               <option value="All">All Stores</option>
                               {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                         </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                         <button 
                           onClick={() => onImportClick('sales')}
                           className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                         >
                           <Upload size={16} /> Import
                         </button>
                         <button 
                           onClick={() => { setRecordToEdit(null); setIsAddRecordModalOpen(true); }}
                           className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                         >
                           <Plus size={16} /> Add Sale
                         </button>
                      </div>
                   </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.size > 0 && (
                   <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-3">
                         <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">{selectedIds.size} Selected</span>
                         <span className="text-sm text-indigo-700 font-medium">Bulk Actions:</span>
                      </div>
                      <div className="flex gap-2">
                         <button 
                            onClick={handleBulkDeleteAction}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                         >
                            <Trash2 size={14} /> Delete Selected
                         </button>
                         <button 
                            onClick={() => setSelectedIds(new Set())}
                            className="p-1.5 text-slate-400 hover:text-slate-600"
                         >
                            <X size={16} />
                         </button>
                      </div>
                   </div>
                )}
                
                {/* Data Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                         <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                               <th className="px-4 py-4 w-10">
                                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600">
                                     {selectedIds.size > 0 && selectedIds.size === paginatedSales.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                  </button>
                               </th>
                               <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('date')}>
                                  <div className="flex items-center gap-1">Date <SortIcon column="date" /></div>
                               </th>
                               <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('counter')}>
                                  <div className="flex items-center gap-1">Store <SortIcon column="counter" /></div>
                               </th>
                               <th className="px-6 py-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('brand')}>
                                  <div className="flex items-center gap-1">Brand <SortIcon column="brand" /></div>
                               </th>
                               <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('amount')}>
                                  <div className="flex items-center justify-end gap-1">Amount <SortIcon column="amount" /></div>
                               </th>
                               <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {paginatedSales.map(r => (
                               <tr key={r.id} className={`hover:bg-slate-50 ${selectedIds.has(r.id) ? 'bg-indigo-50/30' : ''}`}>
                                  <td className="px-4 py-4">
                                     <button 
                                        onClick={() => toggleSelect(r.id)} 
                                        className={selectedIds.has(r.id) ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}
                                     >
                                        {selectedIds.has(r.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                     </button>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-xs">{r.date}</td>
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
                                     <div className="flex justify-end gap-2">
                                        <button 
                                           onClick={() => { setRecordToEdit(r); setIsAddRecordModalOpen(true); }}
                                           className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                        >
                                           <Edit2 size={16} />
                                        </button>
                                        <button 
                                           onClick={() => onDeleteRecord(r.id)} 
                                           className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        >
                                           <Trash2 size={16} />
                                        </button>
                                     </div>
                                  </td>
                               </tr>
                            ))}
                            {paginatedSales.length === 0 && (
                               <tr><td colSpan={6} className="p-8 text-center text-slate-400">No records found matching filters.</td></tr>
                            )}
                         </tbody>
                         {/* Footer Summary */}
                         <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                            <tr>
                               <td colSpan={4} className="px-6 py-4 text-right uppercase text-xs text-slate-500">Total (Filtered View)</td>
                               <td className="px-6 py-4 text-right text-emerald-700">{formatCurrency(totalAmount)}</td>
                               <td></td>
                            </tr>
                         </tfoot>
                      </table>
                   </div>

                   {/* Pagination Controls */}
                   <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-white">
                      <div className="text-xs text-slate-500">
                         Showing {paginatedSales.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} records
                      </div>
                      <div className="flex items-center gap-2">
                         <select 
                            className="border border-slate-200 rounded px-2 py-1 text-xs outline-none"
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                         >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                         </select>
                         <div className="flex rounded border border-slate-200 overflow-hidden">
                            <button 
                               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                               disabled={currentPage === 1}
                               className="p-1.5 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white border-r border-slate-200"
                            >
                               <ChevronLeft size={16} />
                            </button>
                            <span className="px-3 py-1.5 text-xs font-medium flex items-center bg-slate-50">
                               Page {currentPage} of {Math.max(1, totalPages)}
                            </span>
                            <button 
                               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                               disabled={currentPage === totalPages}
                               className="p-1.5 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                            >
                               <ChevronRight size={16} />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'stores' && (
             <StoreNetwork 
                stores={stores}
                onAddAction={() => { setStoreToEdit(null); setIsStoreModalOpen(true); }}
                onEditAction={(s) => { setStoreToEdit(s); setIsStoreModalOpen(true); }}
                onImportAction={() => onImportClick('stores')}
                onBulkUpdateAction={() => {}} 
                onDeleteAction={() => {}} 
             />
          )}

          {activeTab === 'suppliers' && (
             <SupplierList 
                suppliers={suppliers}
                onAdd={() => { setSupplierToEdit(null); setIsSupplierModalOpen(true); }}
                onEdit={(s) => { setSupplierToEdit(s); setIsSupplierModalOpen(true); }}
             />
          )}
       </div>

       {/* Modals */}
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
             onEditRecord(r); // This is passed from App.tsx which handles Add/Edit based on ID presence
             setIsAddRecordModalOpen(false);
          }}
          existingHistory={history}
          availableStores={stores}
          recordToEdit={recordToEdit}
       />

       <SupplierModal 
          isOpen={isSupplierModalOpen} 
          onClose={() => setIsSupplierModalOpen(false)} 
          supplier={supplierToEdit} 
          onSave={() => setIsSupplierModalOpen(false)} 
       />
    </div>
  );
};
