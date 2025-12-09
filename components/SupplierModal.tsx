
import React, { useState, useEffect } from 'react';
import { X, Save, Building2, User, Phone, Mail, MapPin, Clock, CreditCard } from 'lucide-react';
import { Supplier } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSave: (s: Supplier) => void;
}

export const SupplierModal: React.FC<Props> = ({ isOpen, onClose, supplier, onSave }) => {
  const [formData, setFormData] = useState<Supplier>({
    id: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: 30,
    leadTime: 14
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setFormData(supplier);
      } else {
        setFormData({
          id: `sup-${Date.now()}`,
          name: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          paymentTerms: 30,
          leadTime: 14
        });
      }
    }
  }, [isOpen, supplier]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Supplier, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Building2 size={14} /> Company Name
            </label>
            <input 
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. FabriCo Ltd"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                <User size={14} /> Contact Person
              </label>
              <input 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                <Phone size={14} /> Phone
              </label>
              <input 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Mail size={14} /> Email Address
            </label>
            <input 
              type="email"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <MapPin size={14} /> Address
            </label>
            <textarea 
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800 resize-none h-20"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                <CreditCard size={14} /> Payment Terms
              </label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full pl-3 pr-12 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={formData.paymentTerms}
                  onChange={(e) => handleChange('paymentTerms', parseInt(e.target.value) || 0)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Days</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                <Clock size={14} /> Lead Time
              </label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full pl-3 pr-12 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={formData.leadTime}
                  onChange={(e) => handleChange('leadTime', parseInt(e.target.value) || 0)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">Cancel</button>
          <button 
            onClick={() => onSave(formData)}
            disabled={!formData.name}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Save size={18} className="inline mr-2" /> Save Supplier
          </button>
        </div>
      </div>
    </div>
  );
};
