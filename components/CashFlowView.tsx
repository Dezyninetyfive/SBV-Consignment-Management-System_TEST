
import React, { useState, useMemo } from 'react';
import { Expense, VendorBill, SaleRecord, Invoice, PlanningConfig } from '../types';
import { formatCurrency } from '../utils/dataUtils';
import { TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

interface Props {
  expenses: Expense[];
  bills: VendorBill[];
  history: SaleRecord[];
  invoices: Invoice[]; // AR
  planningData: PlanningConfig;
  onAddExpense: () => void;
}

export const CashFlowView: React.FC<Props> = ({ expenses, bills, history, invoices, planningData, onAddExpense }) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'expenses'>('flow');
  const [year, setYear] = useState(new Date().getFullYear());

  // --- Cash Flow Projection Logic ---
  const cashFlowData = useMemo(() => {
    const data: any[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // 1. Calculate Historical Cash Flow (Based on Actuals)
    // 2. Calculate Projected Cash Flow (Based on Due Dates)

    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(year, m, 1);
      const monthEnd = new Date(year, m + 1, 0);
      
      // INFLOWS
      // A. Cash Sales (assuming 30% of sales are cash/immediate) + AR Collections due this month
      const monthSales = history.filter(r => {
         const d = new Date(r.date);
         return d.getFullYear() === year && d.getMonth() === m;
      }).reduce((sum, r) => sum + r.amount, 0);
      
      // For simplicity, let's assume actual sales act as cash proxy for history, 
      // and for future, we use Targets or AR Due Dates.
      // Better logic: AR Invoices Due in this month
      const collections = invoices.filter(inv => {
         const d = new Date(inv.dueDate);
         return d.getFullYear() === year && d.getMonth() === m;
      }).reduce((sum, inv) => sum + (inv.amount - (inv.paidAmount||0)), 0);

      const estimatedCashIn = monthSales > 0 ? monthSales : collections; // Fallback logic for demo

      // OUTFLOWS
      // A. Bills Due (AP)
      const billsDue = bills.filter(b => {
         const d = new Date(b.dueDate);
         return d.getFullYear() === year && d.getMonth() === m;
      }).reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);

      // B. Expenses (Recurring + One-off)
      const monthlyExpenses = expenses.filter(e => {
         const d = new Date(e.date);
         return (d.getFullYear() === year && d.getMonth() === m) || e.isRecurring;
      }).reduce((sum, e) => sum + e.amount, 0);

      const net = estimatedCashIn - (billsDue + monthlyExpenses);

      data.push({
        name: months[m],
        inflow: estimatedCashIn,
        outflow: billsDue + monthlyExpenses,
        net,
        bills: billsDue,
        expenses: monthlyExpenses
      });
    }
    return data;
  }, [year, expenses, bills, history, invoices]);

  // --- Expense Breakdown Logic ---
  const expenseBreakdown = useMemo(() => {
    const agg: Record<string, number> = {};
    expenses.forEach(e => {
       agg[e.category] = (agg[e.category] || 0) + e.amount;
    });
    return Object.entries(agg)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [expenses]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
               <TrendingUp className="text-indigo-600" /> Cash Flow & Expenses
             </h2>
             <p className="text-slate-500">Monitor liquidity, operational costs, and net position.</p>
          </div>
          <div className="flex gap-2">
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                   onClick={() => setActiveTab('flow')} 
                   className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'flow' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >
                   Cash Flow
                </button>
                <button 
                   onClick={() => setActiveTab('expenses')} 
                   className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'expenses' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                >
                   Expenses
                </button>
             </div>
             <button onClick={onAddExpense} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                + Add Expense
             </button>
          </div>
       </div>

       {activeTab === 'flow' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Main Chart */}
             <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex justify-between">
                   <span>Projected Cash Flow ({year})</span>
                   <select 
                      value={year} 
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      className="text-sm border border-slate-200 rounded px-2 py-1 bg-slate-50"
                   >
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                   </select>
                </h3>
                <div className="h-[350px] w-full min-w-0">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cashFlowData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                         <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} />
                         <YAxis tickFormatter={(val) => `RM${(val/1000).toFixed(0)}k`} tick={{fontSize: 12, fill: '#64748B'}} axisLine={false} tickLine={false} />
                         <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            cursor={{fill: '#F1F5F9'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                         />
                         <Legend />
                         <Bar dataKey="inflow" name="Cash In (Sales/AR)" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                         <Bar dataKey="outflow" name="Cash Out (AP/Exp)" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Stats Cards */}
             <div className="space-y-4">
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 flex flex-col justify-between h-40">
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-emerald-700 font-bold text-sm uppercase">Proj. Annual Inflow</p>
                         <p className="text-2xl font-bold text-emerald-900 mt-1">
                            {formatCurrency(cashFlowData.reduce((acc, c) => acc + c.inflow, 0))}
                         </p>
                      </div>
                      <div className="p-2 bg-emerald-100 rounded-full text-emerald-600"><ArrowDownRight size={24} /></div>
                   </div>
                   <p className="text-xs text-emerald-600">Based on AR & Sales Targets</p>
                </div>

                <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col justify-between h-40">
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-red-700 font-bold text-sm uppercase">Proj. Annual Outflow</p>
                         <p className="text-2xl font-bold text-red-900 mt-1">
                            {formatCurrency(cashFlowData.reduce((acc, c) => acc + c.outflow, 0))}
                         </p>
                      </div>
                      <div className="p-2 bg-red-100 rounded-full text-red-600"><ArrowUpRight size={24} /></div>
                   </div>
                   <div className="flex gap-4 text-xs text-red-600 mt-2">
                      <span>Bills: {formatCurrency(cashFlowData.reduce((acc, c) => acc + c.bills, 0))}</span>
                      <span>OpEx: {formatCurrency(cashFlowData.reduce((acc, c) => acc + c.expenses, 0))}</span>
                   </div>
                </div>

                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex flex-col justify-between h-40">
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-indigo-700 font-bold text-sm uppercase">Net Cash Position</p>
                         <p className="text-2xl font-bold text-indigo-900 mt-1">
                            {formatCurrency(cashFlowData.reduce((acc, c) => acc + c.net, 0))}
                         </p>
                      </div>
                      <div className="p-2 bg-indigo-100 rounded-full text-indigo-600"><DollarSign size={24} /></div>
                   </div>
                   <p className="text-xs text-indigo-600">Surplus / (Deficit)</p>
                </div>
             </div>
          </div>
       ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChart className="text-indigo-600" size={20}/> Expense Breakdown</h3>
                <div className="h-[300px] w-full min-w-0">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expenseBreakdown} layout="vertical" margin={{ left: 40 }}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: '#64748B'}} width={100} axisLine={false} tickLine={false} />
                         <Tooltip cursor={{fill: '#F8FAFC'}} formatter={(value: number) => formatCurrency(value)} />
                         <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={30} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                   <h3 className="font-bold text-slate-800">Recent Expense Log</h3>
                </div>
                <div className="overflow-y-auto max-h-[400px]">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase sticky top-0">
                         <tr>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                            <th className="px-6 py-3 text-center">Type</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {expenses.map((e, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                               <td className="px-6 py-3 font-medium text-slate-800">{e.category}</td>
                               <td className="px-6 py-3 text-slate-500">{e.description}</td>
                               <td className="px-6 py-3 text-right font-bold text-slate-800">{formatCurrency(e.amount)}</td>
                               <td className="px-6 py-3 text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs ${e.isRecurring ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                     {e.isRecurring ? 'Recurring' : 'One-off'}
                                  </span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};
