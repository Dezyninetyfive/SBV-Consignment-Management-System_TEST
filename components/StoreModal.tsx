
import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { StoreProfile } from '../types';
import { SAMPLE_BRANDS } from '../constants';

interface Props {
  isOpen: boolean;
  store: StoreProfile | null;
  onClose: () => void;
  onSave: (s: StoreProfile) => void;
}

export const StoreModal: React.FC<Props> = ({ isOpen, store, onClose, onSave }) => {
  const [formData, setFormData] = useState<StoreProfile>({
    id: '',
    name: '',
    group: '',
    address: '',
    city: '',
    state: '',
    region: 'Central',
    postalCode: '',
    carriedBrands: [],
    margins: {},
    creditTerm: 30,
    riskStatus: 'Low'
  });

  // Reset form when modal opens or store changes
  useEffect(() => {
    if (isOpen) {
      if (store) {
        setFormData(store);
      } else {
        setFormData({
          id: `new-${Date.now()}`,
          name: '',
          group: '',
          address: '',
          city: '',
          state: '',
          region: 'Central',
          postalCode: '',
          carriedBrands: [],
          margins: {},
          creditTerm: 30,
          riskStatus: 'Low'
        });
      }
    }
  }, [isOpen, store]);

  if (!isOpen) return null;

  const toggleBrand = (brand: string) => {
    const isSelected = formData.carriedBrands.includes(brand);
    let newBrands = isSelected
      ? formData.carriedBrands.filter(b => b !== brand)
      : [...formData.carriedBrands, brand];
    
    // Initialize margin if adding
    let newMargins = { ...formData.margins };
    if (!isSelected && !newMargins[brand]) {
      newMargins[brand] = 25; // Default 25%
    }
    
    setFormData(prev => ({
      ...prev,
      carriedBrands: newBrands,
      margins: newMargins
    }));
  };

  const handleMarginChange = (brand: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      margins: { ...prev.margins, [brand]: value }
    }));
  };

  const handleChange = (field: keyof StoreProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {store ? 'Edit Store Details' : 'Add New Store'}
          </h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {store && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                   <strong>Warning:</strong> Editing the Store ID will automatically update related inventory and invoices to maintain data links.
                </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Store ID</label>
              <input 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800 font-mono text-sm"
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value)}
                placeholder="store-unique-id"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Store Name</label>
              <input 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Central Plaza Ladprao"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Retail Group</label>
              <input 
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
                 value={formData.group}
                 onChange={(e) => handleChange('group', e.target.value)}
                 list="group-list"
              />
              <datalist id="group-list">
                 <option value="Central Group" />
                 <option value="The Mall Group" />
                 <option value="Aeon" />
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Postal Code</label>
              <input 
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
                 value={formData.postalCode}
                 onChange={(e) => handleChange('postalCode', e.target.value)}
              />
            </div>
             <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
              <input 
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
                 value={formData.address}
                 onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">City / Area</label>
              <input 
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
                 value={formData.city}
                 onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Region / State</label>
              <input 
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
                 value={formData.region}
                 onChange={(e) => handleChange('region', e.target.value)}
                 list="region-list"
              />
               <datalist id="region-list">
                 <option value="Central" />
                 <option value="North" />
                 <option value="North-East" />
                 <option value="South" />
                 <option value="East" />
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Credit Term (Days)</label>
              <input 
                 type="number"
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
                 value={formData.creditTerm}
                 onChange={(e) => handleChange('creditTerm', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Risk Status</label>
              <select 
                 className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800 bg-white"
                 value={formData.riskStatus}
                 onChange={(e) => handleChange('riskStatus', e.target.value as any)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Carried Brands & Margins</label>
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_BRANDS.map(brand => {
                const isChecked = formData.carriedBrands.includes(brand);
                return (
                  <div key={brand} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isChecked ? 'bg-slate-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 focus:ring-indigo-500" 
                        checked={isChecked}
                        onChange={() => toggleBrand(brand)}
                      />
                      <span className={`font-medium ${isChecked ? 'text-indigo-700' : 'text-slate-500'}`}>{brand}</span>
                    </label>
                    {isChecked && (
                       <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500">Margin:</label>
                          <div className="relative w-20">
                            <input 
                              type="number" 
                              min="0" max="100"
                              className="w-full pl-2 pr-6 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:border-indigo-400"
                              value={formData.margins?.[brand] || 25}
                              onChange={(e) => handleMarginChange(brand, parseFloat(e.target.value))}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                          </div>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button 
            onClick={() => onSave(formData)} 
            disabled={!formData.name || formData.carriedBrands.length === 0}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Store
          </button>
        </div>
      </div>
    </div>
  );
};
