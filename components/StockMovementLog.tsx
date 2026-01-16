import React, { useState, useMemo } from 'react';
import { StockMovement, StoreProfile } from '../types';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, PlusCircle, Printer, FileText, CreditCard } from 'lucide-react';
import { ConsignmentNoteModal } from './ConsignmentNoteModal';
import { useERP } from '../contexts/ERPContext';

interface Props {
  movements: StockMovement[];
  onAddTransaction?: () => void;
}

export const StockMovementLog: React.FC<Props> = ({ movements, onAddTransaction }) => {
  const { stores } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [printRef, setPrintRef] = useState<string | null>(null);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchSearch = 
         m.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
         m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         m.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (m.reference && m.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = filterType === 'All' || m.type === filterType;
      return matchSearch && matchType;
    });
  }, [movements, searchTerm, filterType]);

  const movementTypes = ['Sale', 'Restock', 'Transfer In', 'Transfer Out', 'Adjustment', 'Return'];

  return (
    <div className="space-y-4">
       <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 w-full sm:w-auto flex-1">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                   type="text"
                   placeholder="Search store, product, ref..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
             </div>
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                   value={filterType}
                   onChange={(e) => setFilterType(e.target.value)}
                   className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none appearance-none cursor-pointer"
                >
                   <option value="All">All Types</option>
                   {movementTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             {onAddTransaction && (
               <button onClick={onAddTransaction} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm">
                 <PlusCircle size={16} /> Record Transaction
               </button>
             )}
          </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                   <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Outlet</th>
                      <th className="px-6 py-4">Product Detail</th>
                      <th className="px-6 py-4 text-right">Qty</th>
                      <th className="px-6 py-4 text-right">Reference</th>
                      <th className="px-6 py-4 text-center">Docs</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredMovements.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                         <td className="px-6 py-4 font-mono text-[10px]">{m.date}</td>
                         <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                               m.type === 'Sale' || m.type === 'Transfer Out' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                               {m.type}
                            </span>
                         </td>
                         <td className="px-6 py-4 font-medium text-slate-800">{m.storeName}</td>
                         <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{m.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{m.sku} | {m.variant}</div>
                         </td>
                         <td className={`px-6 py-4 text-right font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                         </td>
                         <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">{m.reference || '-'}</td>
                         <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                               {m.reference && (
                                 <button onClick={() => setPrintRef(m.reference!)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="Print Note">
                                   <Printer size={16} />
                                 </button>
                               )}
                               {/* Fix: Wrapped CreditCard icon in a span to use the title attribute, as Lucide components don't support it directly */}
                               {m.linkedInvoiceId && <span title="Financial Link OK"><CreditCard size={14} className="text-emerald-500" /></span>}
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>

       {printRef && (
          <ConsignmentNoteModal 
            isOpen={true} 
            onClose={() => setPrintRef(null)} 
            reference={printRef} 
            movements={movements} 
            stores={stores} 
          />
       )}
    </div>
  );
};