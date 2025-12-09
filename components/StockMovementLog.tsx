
import React, { useState, useMemo } from 'react';
import { StockMovement } from '../types';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, PlusCircle, Printer, FileText, CreditCard } from 'lucide-react';

interface Props {
  movements: StockMovement[];
  onAddTransaction?: () => void;
  onPrintDO?: (reference: string) => void;
}

export const StockMovementLog: React.FC<Props> = ({ movements, onAddTransaction, onPrintDO }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

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
                   className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                >
                   <option value="All">All Types</option>
                   {movementTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
             <div className="text-xs text-slate-500 hidden sm:block">
               {filteredMovements.length} records
             </div>
             
             {onAddTransaction && (
               <button 
                 onClick={onAddTransaction}
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors whitespace-nowrap"
               >
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
                      <th className="px-6 py-4">Store Outlet</th>
                      <th className="px-6 py-4">Product Details</th>
                      <th className="px-6 py-4 text-right">Quantity</th>
                      <th className="px-6 py-4 text-right">Reference</th>
                      <th className="px-6 py-4 text-center">Actions / Links</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredMovements.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                         <td className="px-6 py-4 font-mono text-xs">{m.date}</td>
                         <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${
                               m.type === 'Sale' || m.type === 'Transfer Out' ? 'bg-red-50 text-red-700 border-red-100' :
                               m.type === 'Restock' || m.type === 'Return' || m.type === 'Transfer In' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                               'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>
                               {m.quantity > 0 ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                               {m.type}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{m.storeName}</div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="text-slate-800 font-medium">{m.productName}</div>
                            <div className="text-xs text-slate-400 font-mono flex gap-2">
                               <span>{m.sku}</span>
                               <span className="text-slate-300">|</span>
                               <span className="text-indigo-600 font-medium">{m.variant}</span>
                            </div>
                         </td>
                         <td className={`px-6 py-4 text-right font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                         </td>
                         <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">
                            {m.reference || '-'}
                         </td>
                         <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                               {m.linkedSaleId && (
                                  <div className="group relative">
                                     <div className="p-1.5 text-indigo-600 bg-indigo-50 rounded-full cursor-help">
                                        <FileText size={14} />
                                     </div>
                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                        Linked Sales Record
                                     </div>
                                  </div>
                               )}
                               {m.linkedInvoiceId && (
                                  <div className="group relative">
                                     <div className={`p-1.5 rounded-full cursor-help ${m.type === 'Return' ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                                        <CreditCard size={14} />
                                     </div>
                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                        {m.type === 'Return' ? 'Linked Credit Note' : 'Linked Invoice'}
                                     </div>
                                  </div>
                               )}
                               {onPrintDO && m.reference && (m.type === 'Transfer Out' || m.type === 'Transfer In' || m.type === 'Restock') && (
                                 <button 
                                   onClick={() => onPrintDO(m.reference!)}
                                   className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
                                   title="Print Delivery Order / Note"
                                 >
                                   <Printer size={16} />
                                 </button>
                               )}
                            </div>
                         </td>
                      </tr>
                   ))}
                   {filteredMovements.length === 0 && (
                      <tr>
                         <td colSpan={7} className="p-8 text-center text-slate-400">No stock movements found.</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};
