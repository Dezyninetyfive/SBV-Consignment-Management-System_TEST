
import React, { useState, useMemo, useEffect } from 'react';
import { SaleRecord, StoreProfile, Supplier, MovementType, StockMovement, Product, InventoryItem } from '../types';
import { 
  Table, FileText, Store, Plus, Trash2, Edit2, Upload, Truck, Search, Filter, Calendar, ChevronLeft, ChevronRight, CheckSquare, Square, ArrowUp, ArrowDown, X
} from 'lucide-react';
import { formatCurrency } from '../utils/dataUtils';
import { StoreNetwork } from './StoreNetwork';
import { StoreModal } from './StoreModal';
import { AddRecordModal } from './AddRecordModal';
import { SupplierList } from './SupplierList';
import { SupplierModal } from './SupplierModal';
import { SAMPLE_BRANDS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  history: SaleRecord[];
  movements: StockMovement[];
  stores: StoreProfile[];
  products: Product[];
  inventory: InventoryItem[];
  suppliers?: Supplier[];
  targetStore?: string | null;
  onImportClick: (type: any) => void;
  onEditRecord: (record: SaleRecord) => void;
  onDeleteRecord: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onRecordTransaction: (data: any) => void;
}

export const DataManagement: React.FC<Props> = ({ 
  history, stores, suppliers = [], targetStore,
  onImportClick, onEditRecord, onDeleteRecord, onBulkDelete
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sales' | 'stores' | 'suppliers'>('sales');
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<StoreProfile | null>(null);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SaleRecord | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterStore, setFilterStore] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (targetStore) {
      setActiveTab('sales');
      setFilterStore(targetStore);
    }
  }, [targetStore]);

  const filteredSales = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) || item.amount.toString().includes(searchTerm);
      const matchesBrand = filterBrand === 'All' || item.brand === filterBrand;
      const matchesStore = filterStore === 'All' || item.counter === filterStore;
      let matchesDate = true;
      if (dateRange.start) matchesDate = matchesDate && item.date >= dateRange.start;
      if (dateRange.end) matchesDate = matchesDate && item.date <= dateRange.end;
      return matchesSearch && matchesBrand && matchesStore && matchesDate;
    });
  }, [history, searchTerm, filterBrand, filterStore, dateRange]);

  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Table className="text-indigo-600" /> {t('data')}
             </h2>
             <p className="text-slate-500">{t('master_data_admin')}</p>
          </div>
          <div className="bg-slate-100 p-1 rounded-lg flex overflow-x-auto max-w-full">
             {[
               { id: 'sales', label: t('sales_records'), icon: FileText },
               { id: 'stores', label: t('store_network'), icon: Store },
               { id: 'suppliers', label: t('suppliers'), icon: Truck },
             ].map(tab => (
               <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                 <tab.icon size={16} /> {tab.label}
               </button>
             ))}
          </div>
       </div>

       <div className="bg-slate-50 rounded-xl p-1 min-h-[500px]">
          {activeTab === 'sales' && (
             <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                   <div className="flex gap-4">
                      <input type="text" placeholder="Search sales..." className="px-4 py-2 bg-slate-50 border rounded-lg text-sm outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                      <select className="px-4 py-2 bg-slate-50 border rounded-lg text-sm outline-none" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
                         <option value="All">All Brands</option>
                         {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => onImportClick('sales')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"><Upload size={16} /> {t('import')}</button>
                      <button onClick={() => { setRecordToEdit(null); setIsAddRecordModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"><Plus size={16} /> {t('add_new')}</button>
                   </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 border-b text-xs uppercase font-semibold text-slate-500">
                         <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Store</th>
                            <th className="px-6 py-4">Brand</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {paginatedSales.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50">
                               <td className="px-6 py-4 font-mono text-xs">{r.date}</td>
                               <td className="px-6 py-4 font-medium text-slate-800">{r.counter}</td>
                               <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700">{r.brand}</span></td>
                               <td className="px-6 py-4 text-right font-bold">{formatCurrency(r.amount)}</td>
                               <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                     <button onClick={() => { setRecordToEdit(r); setIsAddRecordModalOpen(true); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                                     <button onClick={() => onDeleteRecord(r.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
          {activeTab === 'stores' && (
             <StoreNetwork stores={stores} onAddAction={() => { setStoreToEdit(null); setIsStoreModalOpen(true); }} onEditAction={(s) => { setStoreToEdit(s); setIsStoreModalOpen(true); }} onImportAction={() => onImportClick('stores')} onBulkUpdateAction={() => {}} onDeleteAction={() => {}} />
          )}
          {activeTab === 'suppliers' && (
             <SupplierList suppliers={suppliers} onAdd={() => { setSupplierToEdit(null); setIsSupplierModalOpen(true); }} onEdit={(s) => { setSupplierToEdit(s); setIsSupplierModalOpen(true); }} />
          )}
       </div>

       <StoreModal isOpen={isStoreModalOpen} onClose={() => setIsStoreModalOpen(false)} store={storeToEdit} onSave={(s) => setIsStoreModalOpen(false)} />
       <AddRecordModal isOpen={isAddRecordModalOpen} onClose={() => setIsAddRecordModalOpen(false)} onSubmit={(r) => { onEditRecord(r); setIsAddRecordModalOpen(false); }} existingHistory={history} availableStores={stores} recordToEdit={recordToEdit} />
       <SupplierModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} supplier={supplierToEdit} onSave={() => setIsSupplierModalOpen(false)} />
    </div>
  );
};
