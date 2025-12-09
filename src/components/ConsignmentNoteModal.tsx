import React from 'react';
import { X, Printer } from 'lucide-react';
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

  // Group movements by product to clean up list
  const groupedItems = movements.reduce((acc, mov) => {
    const key = `${mov.sku}-${mov.variant}`;
    if (!acc[key]) {
      acc[key] = {
        sku: mov.sku,
        name: mov.productName,
        variant: mov.variant,
        quantity: 0
      };
    }
    acc[key].quantity += Math.abs(mov.quantity);
    return acc;
  }, {} as Record<string, { sku: string, name: string, variant: string, quantity: number }>);

  const items = Object.values(groupedItems) as { sku: string, name: string, variant: string, quantity: number }[];
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const firstMov = movements[0];
  const date = firstMov?.date || new Date().toISOString().split('T')[0];
  const store = stores.find(s => s.id === firstMov?.storeId);
  
  // Determine Type (Transfer In / Out / Restock)
  const docType = firstMov?.type === 'Transfer Out' ? 'TRANSFER OUT NOTE' : 
                  firstMov?.type === 'Transfer In' ? 'TRANSFER IN NOTE' : 
                  'CONSIGNMENT DELIVERY ORDER';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 print:p-0">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:w-full print:max-w-none print:absolute print:inset-0">
        
        {/* Screen Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <h3 className="text-lg font-bold text-slate-800">Print Preview</h3>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint} 
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Printer size={18} /> Print Document
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-8 md:p-12 print:p-0 bg-white text-slate-900 min-h-[600px]" id="printable-area">
          
          {/* Doc Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{docType}</h1>
              <p className="text-sm text-slate-500 mt-1">Ref No: <span className="font-mono font-bold text-slate-900">{reference}</span></p>
            </div>
            <div className="text-right">
              <h2 className="font-bold text-lg text-indigo-600">SalesCast Consignment</h2>
              <p className="text-xs text-slate-500">HQ Warehouse</p>
              <p className="text-xs text-slate-500">123 Fashion Ave, Kuala Lumpur</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date</p>
              <p className="font-medium">{date}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">To / From Store</p>
              <p className="font-bold text-lg">{store?.name || 'Unknown Store'}</p>
              <p className="text-slate-600">{store?.address}</p>
              <p className="text-slate-600">{store?.city}, {store?.state}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-sm mb-8 border border-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-xs">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200">#</th>
                <th className="px-4 py-3 border-b border-slate-200">SKU</th>
                <th className="px-4 py-3 border-b border-slate-200">Product Name</th>
                <th className="px-4 py-3 border-b border-slate-200">Variant</th>
                <th className="px-4 py-3 border-b border-slate-200 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono">{item.sku}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.variant}</td>
                  <td className="px-4 py-3 text-right font-bold">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right uppercase">Total Units</td>
                <td className="px-4 py-3 text-right">{totalQty}</td>
              </tr>
            </tfoot>
          </table>

          {/* Signature Section */}
          <div className="grid grid-cols-2 gap-12 mt-12 pt-12">
            <div>
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-sm">Issued By</p>
                <p className="text-xs text-slate-500">Authorized Signature & Stamp</p>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-sm">Received By</p>
                <p className="text-xs text-slate-500">Store Manager Signature & Stamp</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-[10px] text-slate-400">
            <p>Generated by Consignment Management System on {new Date().toLocaleString()}</p>
          </div>

        </div>
      </div>
    </div>
  );
};