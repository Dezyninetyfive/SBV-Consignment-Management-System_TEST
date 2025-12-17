
import React, { useState } from 'react';
import { X, Save, Calendar, DollarSign, Tag } from 'lucide-react';
import { Expense, StoreProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  stores: StoreProfile[];
}

export const ExpenseModal: React.FC<Props> = ({ isOpen, onClose, onSave, stores }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Misc',
    description: '',
    amount: '',
    isRecurring: false,
    storeId: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const store = stores.find(s => s.id === formData.storeId);

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: formData.date,
      category: formData.category as any,
      description: formData.description,
      amount: parseFloat(formData.amount),
      isRecurring: formData.isRecurring,
      storeId: formData.storeId || undefined,
      storeName: store ? store.name : undefined
    };

    onSave(newExpense);
    onClose();
    setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'Misc',
        description: '',
        amount: '',
        isRecurring: false,
        storeId: ''
    });
  };

  const categories = ['Rent', 'Salaries', 'Marketing', 'Utilities', 'Software', 'Travel', 'Misc'];

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Add Expense</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                 <input type="date" className="w-full px-3 py-2 border rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                 <select className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required placeholder="e.g. Monthly Internet Bill" />
           </div>

           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">MYR</span>
                 <input type="number" step="0.01" className="w-full pl-10 pr-3 py-2 border rounded-lg" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required placeholder="0.00" />
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Link to Store (Optional)</label>
              <select className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.storeId} onChange={e => setFormData({...formData, storeId: e.target.value})}>
                 <option value="">None (HQ / General)</option>
                 {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
           </div>

           <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="recurring" className="rounded" checked={formData.isRecurring} onChange={e => setFormData({...formData, isRecurring: e.target.checked})} />
              <label htmlFor="recurring" className="text-sm text-slate-700">Recurring Monthly?</label>
           </div>

           <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold mt-2">Record Expense</button>
        </form>
      </div>
    </div>
  );
};
