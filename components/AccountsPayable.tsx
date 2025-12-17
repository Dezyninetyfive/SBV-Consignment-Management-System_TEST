
import React, { useState, useMemo } from 'react';
import { VendorBill, Supplier } from '../types';
import { formatCurrency } from '../utils/dataUtils';
import { Search, Filter, Plus, Calendar, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  bills: VendorBill[];
  suppliers: Supplier[];
  onAddBill: () => void;
  onPayBill: (billId: string, amount: number) => void;
}

export const AccountsPayable: React.FC<Props> = ({ bills, suppliers, onAddBill, onPayBill }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchSearch = b.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'All' || 
                          (filterStatus === 'Open' && b.status !== 'Paid') ||
                          b.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [bills, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    let totalDue = 0;
    let overdue = 0;
    const today = new Date();

    bills.forEach(b => {
      const remaining = b.amount - b.paidAmount;
      if (remaining > 0) {
        totalDue += remaining;
        if (new Date(b.dueDate) < today) overdue += remaining;
      }
    });
    return { totalDue, overdue };
  }, [bills]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-indigo-600" /> Accounts Payable
          </h2>
          <p className="text-slate-500">Manage vendor bills and outgoing payments.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-right">
             <p className="text-xs font-semibold text-slate-500 uppercase">Total Payable</p>
             <p className="text-xl font-bold text-slate-800">{formatCurrency(stats.totalDue)}</p>
           </div>
           <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 shadow-sm text-right">
             <p className="text-xs font-semibold text-red-500 uppercase">Overdue</p>
             <p className="text-xl font-bold text-red-700">{formatCurrency(stats.overdue)}</p>
           </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
         <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-xs">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search supplier or bill #..." 
                 className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="relative">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <select 
                 className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                 value={filterStatus}
                 onChange={e => setFilterStatus(e.target.value)}
               >
                 <option value="All">All Status</option>
                 <option value="Open">Open (Unpaid/Partial)</option>
                 <option value="Overdue">Overdue</option>
                 <option value="Paid">Paid</option>
               </select>
            </div>
         </div>
         <button onClick={onAddBill} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus size={16} /> Record Bill
         </button>
      </div>

      {/* Bill List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
               <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Bill Ref</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Balance Due</th>
                  <th className="px-6 py-4 text-center">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filteredBills.map(bill => {
                  const balance = bill.amount - bill.paidAmount;
                  const isOverdue = new Date(bill.dueDate) < new Date() && balance > 0;
                  
                  return (
                     <tr key={bill.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                           {bill.status === 'Paid' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                 <CheckCircle size={12} /> Paid
                              </span>
                           ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                 <AlertCircle size={12} /> Overdue
                              </span>
                           ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                                 Unpaid
                              </span>
                           )}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700">{bill.reference}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{bill.supplierName}</td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col text-xs">
                              <span className="text-slate-500">Bill: {bill.billDate}</span>
                              <span className={`${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>Due: {bill.dueDate}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">{formatCurrency(bill.amount)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(balance)}</td>
                        <td className="px-6 py-4 text-center">
                           {balance > 0 && (
                              <button 
                                 onClick={() => onPayBill(bill.id, balance)} 
                                 className="text-xs text-indigo-600 font-bold hover:underline"
                              >
                                 Pay Full
                              </button>
                           )}
                        </td>
                     </tr>
                  );
               })}
               {filteredBills.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-400">No bills found.</td></tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};
