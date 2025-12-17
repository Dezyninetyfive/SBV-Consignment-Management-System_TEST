
import React, { useState } from 'react';
import { X, Save, Calendar, DollarSign, FileText } from 'lucide-react';
import { VendorBill, Supplier } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bill: VendorBill) => void;
  suppliers: Supplier[];
}

export const BillModal: React.FC<Props> = ({ isOpen, onClose, onSave, suppliers }) => {
  const [formData, setFormData] = useState({
    supplierId: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    amount: '',
    reference: '',
    category: 'COGS' as const
  });

  if (!isOpen) return null;

  const handleSupplierChange = (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      const due = new Date(formData.billDate);
      due.setDate(due.getDate() + supplier.paymentTerms);
      setFormData(prev => ({
        ...prev,
        supplierId: id,
        dueDate: due.toISOString().split('T')[0]
      }));
    } else {
       setFormData(prev => ({ ...prev, supplierId: id }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === formData.supplierId);
    if (!supplier || !formData.amount) return;

    const newBill: VendorBill = {
      id: `bill-${Date.now()}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      billDate: formData.billDate,
      dueDate: formData.dueDate || formData.billDate,
      amount: parseFloat(formData.amount),
      paidAmount: 0,
      status: 'Unpaid',
      reference: formData.reference,
      category: formData.category
    };

    onSave(newBill);
    onClose();
    setFormData({
        supplierId: '',
        billDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        amount: '',
        reference: '',
        category: 'COGS'
    });
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Record Vendor Bill</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           {/* Form Fields */}
           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Supplier</label>
              <select 
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                value={formData.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                required
              >
                <option value="">Select Supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Bill Date</label>
                 <input type="date" className="w-full px-3 py-2 border rounded-lg" value={formData.billDate} onChange={e => setFormData({...formData, billDate: e.target.value})} required />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Due Date</label>
                 <input type="date" className="w-full px-3 py-2 border rounded-lg" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} required />
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">MYR</span>
                 <input type="number" step="0.01" className="w-full pl-10 pr-3 py-2 border rounded-lg" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required placeholder="0.00" />
              </div>
           </div>

           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Reference / Invoice #</label>
              <input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} required placeholder="INV-001" />
           </div>

           <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold mt-2">Save Bill</button>
        </form>
      </div>
    </div>
  );
};
