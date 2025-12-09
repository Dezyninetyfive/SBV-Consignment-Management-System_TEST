
import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number; // Number of records being deleted (1 or many)
  itemName?: string; // Optional name of item being deleted (e.g. ID or Store Name)
}

export const DeleteConfirmationModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, count, itemName }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    if (isConfirmed) {
      onConfirm();
      onClose();
      setIsConfirmed(false); // Reset for next time
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600 flex-shrink-0">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800">Restricted Action</h3>
            <p className="text-sm text-red-600 mt-1">Admin permission required</p>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-slate-700 font-medium">
              You are about to permanently delete <span className="font-bold text-slate-900">{count} record{count > 1 ? 's' : ''}</span>.
            </p>
            {itemName && (
              <p className="text-xs font-mono text-slate-500 mt-1 bg-slate-50 p-2 rounded border border-slate-200">
                ID: {itemName}
              </p>
            )}
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              This action cannot be undone. The data will be removed from all reports, charts, and forecasts immediately.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 shadow-sm transition-all checked:border-red-500 checked:bg-red-500 hover:border-red-400"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                />
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 text-white">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <span className="text-sm text-slate-700 select-none group-hover:text-slate-900">
                I understand that this data will be permanently deleted and acknowledge this action.
              </span>
            </label>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirmClick}
            disabled={!isConfirmed}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 size={18} /> Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};
