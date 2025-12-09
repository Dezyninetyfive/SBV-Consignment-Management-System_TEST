
import React, { useMemo, useState } from 'react';
import { Invoice, StoreProfile } from '../types';
import { formatCurrency } from '../utils/dataUtils';
import { AlertCircle, Clock, CheckCircle, DollarSign, Calendar, Filter, Download, ArrowUpDown, CreditCard, Upload, Search, ArrowLeft, FileText } from 'lucide-react';
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
  const [filterBrand, setFilterBrand] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'total' | 'overdue' | 'name'>('total');
  
  // Drill Down State
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // --- Main Aging Report Logic ---
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

      // Apply Filters EARLY
      if (filterBrand !== 'All' && inv.brand !== filterBrand) return;
      if (searchTerm && !store.name.toLowerCase().includes(searchTerm.toLowerCase())) return;

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

    // Filter by Group/Term (Store Level Properties)
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
  }, [invoices, stores, filterGroup, filterTerm, filterBrand, searchTerm, sortBy]);

  // --- Statement Logic (Drill Down) ---
  const statementData = useMemo(() => {
    if (!selectedStoreId) return null;

    const store = stores.find(s => s.id === selectedStoreId);
    if (!store) return null;

    // Get all transactions (Invoices & Payments) for this store
    const transactions: any[] = [];
    
    invoices.filter(inv => inv.storeId === selectedStoreId).forEach(inv => {
      // 1. Add Invoice (Debit)
      transactions.push({
        id: inv.id,
        date: inv.issueDate,
        type: 'Invoice',
        ref: inv.id.split('-').pop(), // Simple ref
        brand: inv.brand,
        debit: inv.amount,
        credit: 0,
        description: `Invoice #${inv.id.slice(-6)}`
      });

      // 2. Add Payments (Credit)
      if (inv.payments) {
        inv.payments.forEach(pay => {
           transactions.push({
             id: pay.id,
             date: pay.date,
             type: 'Payment',
             ref: pay.reference || 'PAYMENT',
             brand: inv.brand, // Payment tied to brand invoice
             debit: 0,
             credit: pay.amount,
             description: `Payment via ${pay.method}`
           });
        });
      }
    });

    // Sort by Date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate Running Balance
    let runningBalance = 0;
    const items = transactions.map(t => {
       runningBalance += (t.debit - t.credit);
       return { ...t, balance: runningBalance };
    });

    const totalDebit = items.reduce((acc, i) => acc + i.debit, 0);
    const totalCredit = items.reduce((acc, i) => acc + i.credit, 0);

    return { store, items, totalDebit, totalCredit, finalBalance: runningBalance };
  }, [selectedStoreId, invoices, stores]);

  // Top Level Stats
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

  // --- Render Statement View ---
  if (selectedStoreId && statementData) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedStoreId(null)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-white hover:text-indigo-600 transition-colors"
            >
               <ArrowLeft size={20} />
            </button>
            <div>
               <h2 className="text-2xl font-bold text-slate-800">{statementData.store.name}</h2>
               <p className="text-slate-500">Statement of Account</p>
            </div>
         </div>

         {/* Statement Summary Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Total Invoiced (Debits)</p>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(statementData.totalDebit)}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Total Paid (Credits)</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(statementData.totalCredit)}</p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
                <p className="text-xs font-bold text-indigo-600 uppercase mb-2">Current Balance Due</p>
                <p className="text-2xl font-bold text-indigo-900">{formatCurrency(statementData.finalBalance)}</p>
            </div>
         </div>

         {/* Statement Table */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <FileText size={18} /> Transaction History
               </h3>
               <button 
                 onClick={() => onOpenPaymentModal(statementData.store)}
                 className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
               >
                 Record Payment
               </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                     <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Brand</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Reference</th>
                        <th className="px-6 py-3 text-right">Debit (+)</th>
                        <th className="px-6 py-3 text-right">Credit (-)</th>
                        <th className="px-6 py-3 text-right">Balance</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {statementData.items.map((item, idx) => (
                        <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50">
                           <td className="px-6 py-3 font-medium">{item.date}</td>
                           <td className="px-6 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs border ${
                                  item.brand === 'Domino' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                  item.brand === 'OTTO' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                  'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {item.brand}
                              </span>
                           </td>
                           <td className="px-6 py-3">{item.description}</td>
                           <td className="px-6 py-3 text-xs font-mono text-slate-500">{item.ref}</td>
                           <td className="px-6 py-3 text-right font-medium text-slate-800">
                              {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                           </td>
                           <td className="px-6 py-3 text-right font-medium text-emerald-600">
                              {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                           </td>
                           <td className="px-6 py-3 text-right font-bold text-indigo-900 bg-slate-50/50">
                              {formatCurrency(item.balance)}
                           </td>
                        </tr>
                     ))}
                     {statementData.items.length === 0 && (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">No transactions found.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    );
  }

  // --- Render Aging Report (Main View) ---
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
         <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-1">
            
            <div className="space-y-1 flex-1 max-w-xs">
               <label className="text-xs font-semibold text-slate-500 uppercase">Search Store</label>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Filter Brand</label>
               <select 
                 className="w-full sm:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                 value={filterBrand}
                 onChange={(e) => setFilterBrand(e.target.value)}
               >
                  <option value="All">All Brands</option>
                  {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Retail Group</label>
               <select 
                 className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                 value={filterGroup}
                 onChange={(e) => setFilterGroup(e.target.value)}
               >
                  <option value="All">All Groups</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
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
                    <button 
                      onClick={() => setSelectedStoreId(row.store.id)}
                      className="text-left group"
                    >
                      <div className="font-medium text-slate-900 group-hover:text-indigo-600 group-hover:underline">{row.store.name}</div>
                      <div className="text-xs text-slate-400">{row.store.group}</div>
                    </button>
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
