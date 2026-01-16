
import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { StockMovement, StoreProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reference: string;
  movements: StockMovement[];
  stores: StoreProfile[];
}

export const ConsignmentNoteModal: React.FC<Props> = ({ isOpen, onClose, reference, movements, stores }) => {
  if (!isOpen) return null;

  const relevantMovements = movements.filter(m => m.reference === reference);
  const first = relevantMovements[0];
  const store = stores.find(s => s.id === first?.storeId);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 print:p-0">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 print:shadow-none print:w-full">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <h3 className="text-lg font-bold text-slate-800">Consignment Note Preview</h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Printer size={18} /> Print
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
        </div>

        <div className="p-12 bg-white text-slate-900 min-h-[600px] font-serif border-8 border-double border-slate-100 m-4 print:m-0 print:border-none">
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Consignment Note</h1>
              <p className="text-sm font-mono mt-1 font-bold">REF: {reference}</p>
              <p className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-indigo-600 mb-2">
                <ShieldCheck size={24} />
                <span className="font-black text-xl tracking-tight">Celestrion ERP</span>
              </div>
              <p className="text-xs text-slate-500">Logistics & Supply Chain Division</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100">Recipient Outlet</p>
              <p className="font-bold text-lg">{store?.name || 'Manual Store'}</p>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{store?.address || 'N/A'}</p>
              <p className="text-sm text-slate-600 font-bold">{store?.city}, {store?.state}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100">Document Date</p>
              <p className="font-bold">{first?.date || 'N/A'}</p>
              <div className="mt-4 p-2 bg-slate-50 rounded border border-slate-200 inline-block text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Movement Type</p>
                <p className="text-sm font-bold text-indigo-600">{first?.type || 'Transfer'}</p>
              </div>
            </div>
          </div>

          <table className="w-full text-sm text-left mb-12">
            <thead className="border-y-2 border-slate-800 bg-slate-50 font-bold text-[10px] uppercase">
              <tr>
                <th className="px-4 py-2">SKU / Item Details</th>
                <th className="px-4 py-2">Variant</th>
                <th className="px-4 py-2 text-right w-24">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {relevantMovements.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-900">{m.productName}</p>
                    <p className="text-[10px] font-mono text-slate-500">{m.sku}</p>
                  </td>
                  <td className="px-4 py-4">{m.variant}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-lg">{Math.abs(m.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-800 font-bold">
              <tr>
                <td colSpan={2} className="px-4 py-4 text-right text-xs uppercase tracking-widest">Total Consigned Units</td>
                <td className="px-4 py-4 text-right text-xl font-black underline decoration-double">
                   {relevantMovements.reduce((acc, curr) => acc + Math.abs(curr.quantity), 0)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="grid grid-cols-2 gap-16 mt-20 pt-10 border-t border-slate-100">
            <div className="text-center">
              <div className="h-1 bg-slate-800 mb-2" />
              <p className="text-xs font-bold uppercase">Issued By (Celestrion HQ)</p>
              <p className="text-[10px] text-slate-400 mt-1">Authorized Logistics Manager</p>
            </div>
            <div className="text-center">
              <div className="h-1 bg-slate-800 mb-2" />
              <p className="text-xs font-bold uppercase">Received By (Outlet Manager)</p>
              <p className="text-[10px] text-slate-400 mt-1">Sign & Company Stamp Required</p>
            </div>
          </div>

          <div className="mt-20 text-[9px] text-slate-400 italic text-center border-t border-slate-100 pt-4">
            Legal Notice: Goods remain the property of Celestrion HQ until full settlement. Discrepancies must be reported within 24 hours of receipt.
          </div>
        </div>
      </div>
    </div>
  );
};
