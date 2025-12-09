
import React, { useMemo, useState } from 'react';
import { Invoice, StoreProfile } from '../types';
import { formatCurrency } from '../utils/dataUtils';
import { AlertCircle, Clock, CheckCircle, DollarSign, Calendar, Filter, Download, ArrowUpDown, CreditCard, Upload } from 'lucide-react';
import { SAMPLE_BRANDS, CREDIT_TERMS } from '../constants';

interface Props {
  invoices: Invoice[];
  stores: StoreProfile[];
  onOpenPaymentModal: (store: StoreProfile) => void;
  onImportClick: () => void;
}

export const AccountsReceivable: React.FC<Props> = ({ invoices, stores, onOpenPaymentModal, onImportClick }) => {
  const [filterGroup, setFilterGroup] = useState('All');
  const [filterTerm, setFilterTerm] = useState('All');
  const [sortBy, setSortBy] = useState<'total' | 'overdue' | 'name'>('total');
  
  // Calculate Aging Buckets per Store AND Brand
  const agingReport = useMemo(() => {
    // Key is storeId + brand
    const report: Record<string, { 
      id: string,
      store: StoreProfile, 
      brand: string,
      total: number, 
      paid: number,
      balance: number,
      current: number, 
      over30: number, 
      over60: number, 
      over90: number 
    }> = {};

    const storeMap = new Map<string, StoreProfile>(stores.map(s => [s.id, s] as [string, StoreProfile]));
    const today = new Date();

    invoices.forEach(inv => {
      const store = storeMap.get(inv.storeId);
      if (!store || inv.status === 'Paid') return;

      const key = `${inv.storeId}-${inv.brand}`;
      if (!report[key]) {
        report[key] = { 
            id: key,
            store, 
            brand: inv.brand,
            total: 0, 
            paid: 0, 
            balance: 0, 
            current: 0, 
            over30: 0, 
            over60: 0, 
            over90: 0 
        };
      }

      const remaining = inv.amount - (inv.paidAmount || 0);
      report[key].total += inv.amount;
      report[key].paid += (inv.paidAmount || 0);
      report[key].balance += remaining;

      const dueDate = new Date(inv.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        report[key].current += remaining;
      } else if (diffDays <= 30) {
        report[key].over30 += remaining;
      } else if (diffDays <= 60) {
        report[key].over60 += remaining;
      } else {
        report[key].over90 += remaining;
      }
    });

    let results = Object.values(report);

    // Filter
    if (filterGroup !== 'All') {
        results = results.filter(r => r.store.group === filterGroup);
    }
    if (filterTerm !== 'All') {
        results = results.filter(r => r.store.creditTerm.toString() === filterTerm);
    }

    // Sort
    return results.sort((a, b) => {
        if (sortBy === 'name') return a.store.name.localeCompare(b.store.name);
        if (sortBy === 'overdue') return (b.over30 + b.over60 + b.over90) - (a.over30 + a.over60 + a.over90);
        return b.balance - a.balance;
    });
  }, [invoices, stores, filterGroup, filterTerm, sortBy]);

  const totalOutstanding = agingReport.reduce((acc, r) => acc + r.balance, 0);
  const totalOverdue = agingReport.reduce((acc, r) => acc + r.over30 + r.over60 + r.over90, 0);

  const groups = ['All', ...Array.from(new Set(stores.map(s => s.group))).sort()];

  const handleExport = () => {
    const header = "Store,Group,Brand,CreditTerm,TotalBalance,Current,1-30 Days,31-60 Days,90+ Days\n";
    const rows = agingReport.map(r => 
        `"${r.store.name}","${r.store.group}",${r.brand},${r.store.creditTerm},${r.balance},${r.current},${r.over30},${r.over60},${r.over90}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aging_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Clock className="text-indigo-600" />
             Accounts Receivable
           </h2>
           <p className="text-slate-500">Track consignment settlements and aging reports.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-right">
             <p className="text-xs font-semibold text-slate-500 uppercase">Total Outstanding</p>
             <p className="text-xl font-bold text-slate-800">{formatCurrency(totalOutstanding)}</p>
           </div>
           <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 shadow-sm text-right">
             <p className="text-xs font-semibold text-red-500 uppercase">Total Overdue</p>
             <p className="text-xl font-bold text-red-700">{formatCurrency(totalOverdue)}</p>
           </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center">
         <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Retail Group</label>
               <select 
                 className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                 value={filterGroup}
                 onChange={(e) => setFilterGroup(e.target.value)}
               >
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Credit Term</label>
               <select 
                 className="w-full sm:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                 value={filterTerm}
                 onChange={(e) => setFilterTerm(e.target.value)}
               >
                  <option value="All">All Terms</option>
                  {CREDIT_TERMS.map(t => <option key={t} value={t}>{t} Days</option>)}
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Sort By</label>
               <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
                  <button 
                     onClick={() => setSortBy('total')}
                     className={`px-3 py-1 rounded text-xs font-medium ${sortBy === 'total' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                  >
                     Balance
                  </button>
                  <button 
                     onClick={() => setSortBy('overdue')}
                     className={`px-3 py-1 rounded text-xs font-medium ${sortBy === 'overdue' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                  >
                     Risk
                  </button>
                   <button 
                     onClick={() => setSortBy('name')}
                     className={`px-3 py-1 rounded text-xs font-medium ${sortBy === 'name' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                  >
                     Name
                  </button>
               </div>
            </div>
         </div>
         <div className="flex gap-2">
            <button 
                onClick={onImportClick}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
                <Upload size={16} /> Import Invoices
            </button>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
                <Download size={16} /> Export CSV
            </button>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Customer Store</th>
                <th className="px-6 py-4">Brand</th>
                <th className="px-6 py-4">Term</th>
                <th className="px-6 py-4 text-right">Balance Due</th>
                <th className="px-6 py-4 text-right text-emerald-600">Current</th>
                <th className="px-6 py-4 text-right text-yellow-600">1-30 Days</th>
                <th className="px-6 py-4 text-right text-orange-600">31-60 Days</th>
                <th className="px-6 py-4 text-right text-red-600">90+ Days</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agingReport.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{row.store.name}</div>
                    <div className="text-xs text-slate-400">{row.store.group}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border
                        ${row.brand === 'Domino' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                          row.brand === 'OTTO' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }
                    `}>
                        {row.brand}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                      {row.store.creditTerm} Days
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">
                    {formatCurrency(row.balance)}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-600 opacity-80">
                    {row.current > 0 ? formatCurrency(row.current) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-yellow-600 font-medium">
                    {row.over30 > 0 ? formatCurrency(row.over30) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-orange-600 font-medium">
                    {row.over60 > 0 ? formatCurrency(row.over60) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600 font-bold bg-red-50/30">
                    {row.over90 > 0 ? formatCurrency(row.over90) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                       onClick={() => onOpenPaymentModal(row.store)}
                       className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors"
                    >
                       <CreditCard size={12} /> Pay
                    </button>
                  </td>
                </tr>
              ))}
              {agingReport.length === 0 && (
                  <tr>
                      <td colSpan={9} className="text-center p-8 text-slate-400">No invoices found matching criteria.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
