
import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Percent } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/dataUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (productId: string, price: number) => void;
}

export const MarkdownModal: React.FC<Props> = ({ isOpen, onClose, product, onSave }) => {
  const [newPrice, setNewPrice] = useState<string>('');
  
  useEffect(() => {
    if (isOpen && product) {
      setNewPrice(product.markdownPrice ? product.markdownPrice.toString() : product.price.toString());
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentPrice = product.price;
  const discountAmount = currentPrice - parseFloat(newPrice || '0');
  const discountPercent = currentPrice > 0 ? (discountAmount / currentPrice) * 100 : 0;

  const handleSave = () => {
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      onSave(product.id, price);
      onClose();
    }
  };

  const handleRemove = () => {
    onSave(product.id, 0); // 0 or undefined removes discount logic
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Tag size={18} className="text-indigo-600" />
            Manage Markdown / Discount
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
             <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-200">
               <img src={product.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
             </div>
             <div>
                <p className="font-bold text-slate-800 line-clamp-1">{product.name}</p>
                <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Original Price</label>
                <div className="text-lg font-bold text-slate-700 mt-1">{formatCurrency(currentPrice)}</div>
             </div>
             <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Cost Price</label>
                <div className="text-lg font-medium text-slate-500 mt-1">{formatCurrency(product.cost)}</div>
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-indigo-700">Set New Selling Price (Markdown)</label>
             <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">RM</span>
                <input 
                   type="number"
                   step="0.01"
                   min="0"
                   className="w-full pl-10 pr-4 py-3 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-xl font-bold text-slate-800"
                   value={newPrice}
                   onChange={(e) => setNewPrice(e.target.value)}
                />
             </div>
          </div>

          {parseFloat(newPrice) < currentPrice && (
             <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700">
                   <Percent size={18} />
                   <span className="font-bold">Discount Applied</span>
                </div>
                <span className="text-xl font-bold text-emerald-600">-{discountPercent.toFixed(1)}%</span>
             </div>
          )}
          
          {parseFloat(newPrice) < product.cost && (
             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium text-center">
                Warning: Price is below cost. This will result in a loss.
             </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button 
             onClick={handleRemove}
             className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
          >
             Remove Discount
          </button>
          <div className="flex-1"></div>
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">Cancel</button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors"
          >
            Save Price
          </button>
        </div>
      </div>
    </div>
  );
};
