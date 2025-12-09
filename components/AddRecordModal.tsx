
import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Calendar, DollarSign, Tag, MapPin, Save } from 'lucide-react';
import { SAMPLE_BRANDS } from '../constants';
import { SaleRecord, StoreProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: SaleRecord) => void;
  existingHistory?: SaleRecord[];
  availableStores?: StoreProfile[];
  onAddNewStore?: () => void;
  recordToEdit?: SaleRecord | null;
}

export const AddRecordModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  existingHistory = [], 
  availableStores = [],
  onAddNewStore,
  recordToEdit
}) => {
  const [date, setDate] = useState('');
  const [brand, setBrand] = useState('');
  const [counter, setCounter] = useState('');
  const [amount, setAmount] = useState('');

  // Pre-fill form if editing
  useEffect(() => {
    if (recordToEdit) {
      setDate(recordToEdit.date);
      setBrand(recordToEdit.brand);
      setCounter(recordToEdit.counter);
      setAmount(recordToEdit.amount.toString());
    } else {
      // Reset if adding new
      setDate('');
      setBrand('');
      setCounter('');
      setAmount('');
    }
  }, [recordToEdit, isOpen]);

  // Use Store names if available, otherwise fallback to history
  const uniqueCounters = useMemo(() => {
    if (availableStores.length > 0) {
      return availableStores.map(s => s.name).sort();
    }
    const fromHistory = new Set(existingHistory.map(r => r.counter));
    return Array.from(fromHistory).sort();
  }, [existingHistory, availableStores]);

  // If a store is selected, filter brands to what that store carries
  const filteredBrands = useMemo(() => {
    if (counter && availableStores.length > 0) {
      const store = availableStores.find(s => s.name === counter);
      if (store && store.carriedBrands.length > 0) {
        return store.carriedBrands;
      }
    }
    return SAMPLE_BRANDS;
  }, [counter, availableStores]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !amount || !brand || !counter) return;

    const newRecord: SaleRecord = {
      id: recordToEdit ? recordToEdit.id : `manual-${Date.now()}`,
      date,
      brand,
      counter,
      amount: parseFloat(amount)
    };

    onSubmit(newRecord);
    
    // Only clear if adding new, otherwise close modal
    if (!recordToEdit) {
      setAmount('');
      setDate('');
      setBrand('');
      setCounter('');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">
            {recordToEdit ? 'Edit Sales Record' : 'Add Sales Record'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
             <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MapPin size={16} className="text-slate-400" />
                  Counter / Store
                </label>
                {onAddNewStore && !recordToEdit && (
                  <button 
                    type="button" 
                    onClick={onAddNewStore}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus size={12} /> Add New Store
                  </button>
                )}
             </div>
              <div className="relative">
                <input
                  list="counter-list"
                  value={counter}
                  onChange={(e) => {
                    setCounter(e.target.value);
                    if (!recordToEdit) setBrand(''); // Reset brand only if not editing
                  }}
                  placeholder="Select or Search Store..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800"
                  required
                />
                <datalist id="counter-list">
                  {uniqueCounters.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
          </div>

          <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Tag size={16} className="text-slate-400" />
                Brand
              </label>
              <div className="relative">
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-800"
                  required
                  disabled={!counter}
                >
                  <option value="" disabled>Select Brand...</option>
                  {filteredBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {!counter && (
                  <p className="text-xs text-slate-400 mt-1">Select a store first to see available brands</p>
                )}
              </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <DollarSign size={16} className="text-slate-400" />
              Sales Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">RM</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {recordToEdit ? (
                <>
                  <Save size={18} /> Save Changes
                </>
              ) : (
                <>
                  <Plus size={18} /> Add Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
