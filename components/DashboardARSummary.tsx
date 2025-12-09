
import React, { useMemo } from 'react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/dataUtils';
import { Clock, AlertTriangle, CheckCircle, ArrowRight, DollarSign } from 'lucide-react';

interface Props {
  invoices: Invoice[];
  onViewAllClick: () => void;
}

export const DashboardARSummary: React.FC<Props> = ({ invoices, onViewAllClick }) => {
  const stats = useMemo(() => {
    const today = new Date();
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let invoiceCount = 0;
    const storeBalances: Record<string, number> = {};

    invoices.forEach(inv => {
      if (inv.status === 'Paid') return;
      
      const balance = inv.amount - (inv.paidAmount || 0);
      if (balance <= 0) return;

      totalOutstanding += balance;
      invoiceCount++;

      const isOverdue = new Date(inv.dueDate) < today;
      if (isOverdue) {
        totalOverdue += balance;
      }

      storeBalances[inv.storeName] = (storeBalances[inv.storeName] || 0) + balance;
    });

    const topDebtors = Object.entries(storeBalances)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    return { totalOutstanding, totalOverdue, invoiceCount, topDebtors };
  }, [invoices]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Clock className="text-indigo-600" size={18} />
          Current AR Status
        </h3>
        <button 
          onClick={onViewAllClick}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          View Aging <ArrowRight size={12} />
        </button>
      </div>
      
      <div className="p-5 grid grid-cols-2 gap-4">
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-xs text-indigo-600 font-semibold uppercase mb-1">Total Outstanding</p>
          <p className="text-xl font-bold text-slate-800">{formatCurrency(stats.totalOutstanding)}</p>
          <p className="text-xs text-slate-400 mt-1">{stats.invoiceCount} open invoices</p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-xs text-red-600 font-semibold uppercase mb-1">Overdue Amount</p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(stats.totalOverdue)}</p>
          <p className="text-xs text-red-400 mt-1">
             {stats.totalOutstanding > 0 ? ((stats.totalOverdue / stats.totalOutstanding) * 100).toFixed(0) : 0}% of total
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 flex-1 flex flex-col">
        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Top Debtors</h4>
        <div className="flex-1 overflow-y-auto min-h-[120px]">
          {stats.topDebtors.length > 0 ? (
            <div className="space-y-3">
              {stats.topDebtors.map((debtor, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate text-slate-700 font-medium" title={debtor.name}>
                      {debtor.name}
                    </span>
                  </div>
                  <span className="font-mono font-medium text-slate-800">
                    {formatCurrency(debtor.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center">
              <CheckCircle size={24} className="mb-2 text-emerald-400" />
              <p>All payments collected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
