import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { StoreProfile } from '../types';
import { SAMPLE_BRANDS } from '../constants';

interface Props {
  isOpen: boolean;
  mode: 'group' | 'brands' | null;
  count: number;
  onClose: () => void;
  onSave: (updates: Partial<StoreProfile>) => void;
  existingGroups: string[];
}

export const BulkEditModal: React.FC<Props> = ({ isOpen, mode, count, onClose, onSave, existingGroups }) => {
  const [group, setGroup] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  if (!isOpen || !mode) return null;

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleSave = () => {
    if (mode === 'group') {
      onSave({ group });
    } else {
      onSave({ carriedBrands: selectedBrands });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            Bulk Edit {mode === 'group' ? 'Retail Group' : 'Carried Brands'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            You are about to update <span className="font-bold text-indigo-600">{count}</span> stores. 
            This change cannot be undone easily.
          </p>

          {mode === 'group' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">New Group Name</label>
              <input 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="e.g. Central Group"
                list="group-options"
                autoFocus
              />
              <datalist id="group-options">
                {existingGroups.map(g => <option key={g} value={g} />)}
              </datalist>
              <p className="text-xs text-slate-400 mt-1">All selected stores will be moved to this group.</p>
            </div>
          )}

          {mode === 'brands' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase">Set Brands To:</label>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_BRANDS.map(brand => (
                  <label key={brand} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedBrands.includes(brand) 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }
                  `}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center
                      ${selectedBrands.includes(brand) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}
                    `}>
                      {selectedBrands.includes(brand) && <Check size={12} className="text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                    />
                    <span className="font-medium">{brand}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
                Warning: This will overwrite the existing brand list for all selected stores.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={mode === 'group' ? !group : selectedBrands.length === 0}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Stores
          </button>
        </div>
      </div>
    </div>
  );
};