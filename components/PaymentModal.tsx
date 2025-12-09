

import React, { useState, useMemo } from 'react';
import { X, DollarSign, CheckCircle } from 'lucide-react';
import { Invoice, StoreProfile } from '../types';
import { formatCurrency } from '../utils/dataUtils';
import { PAYMENT_METHODS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  store: StoreProfile | null;
  invoices: Invoice[];
  onRecordPayment: (invoiceIds: string[], amount: number, method: string, ref: string) => void;
}

export const PaymentModal: React.FC<Props> = ({ isOpen, onClose, store, invoices, onRecordPayment }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [reference, setReference] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('auto'); // 'auto' or specific ID

  // Hook must be called unconditionally (before any return)
  const storeInvoices = useMemo(() => {
    if (!store) return [];
    return invoices
      .filter(inv => inv.storeId === store.id && inv.status !== 'Paid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [invoices, store]);

  const totalDue = useMemo(() => {
    return storeInvoices.reduce((acc, inv) => acc + (inv.amount - (inv.paidAmount || 0)), 0);
  }, [storeInvoices]);

  // Early return logic AFTER hooks
  if (!isOpen || !store) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) return;

    if (selectedInvoiceId === 'auto') {
      // Pass all invoice IDs for auto-allocation logic
      onRecordPayment(storeInvoices.map(i => i.id), payAmount, method, reference);
    } else {
      onRecordPayment([selectedInvoiceId], payAmount, method, reference);
    }
    // Reset form fields
    setAmount('');
    setReference('');
    setSelectedInvoiceId('auto');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Record Payment</h3>
            <p className="text-xs text-slate-500">{store.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex justify-between items-center">
             <div>
               <p className="text-sm text-emerald-800 font-medium">Total Outstanding</p>
               <p className="text-2xl font-bold text-emerald-900">{formatCurrency(totalDue)}</p>
             </div>
             <div className="bg-white p-2 rounded-full text-emerald-600">
               <DollarSign size={24} />
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Payment Amount</label>
               <input 
                 type="number"
                 step="0.01"
                 max={totalDue}
                 required
                 autoFocus
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-lg font-medium"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="0.00"
               />
            </div>

            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Payment Method</label>
               <select 
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                 value={method}
                 onChange={(e) => setMethod(e.target.value)}
               >
                 {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
               </select>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Reference No.</label>
               <input 
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                 value={reference}
                 onChange={(e) => setReference(e.target.value)}
                 placeholder="e.g. CHEQUE-123456"
               />
            </div>

            <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Allocation</label>
               <select 
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white text-sm"
                 value={selectedInvoiceId}
                 onChange={(e) => setSelectedInvoiceId(e.target.value)}
               >
                 <option value="auto">Auto-Allocate (Oldest First)</option>
                 {storeInvoices.map(inv => (
                   <option key={inv.id} value={inv.id}>
                     {inv.brand} - Inv #{inv.id.slice(-4)} - Due {inv.dueDate} ({formatCurrency(inv.amount - (inv.paidAmount || 0))})
                   </option>
                 ))}
               </select>
            </div>

            <button 
              type="submit"
              disabled={!amount}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors mt-4 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle size={18} /> Confirm Payment
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};
