
import React, { useMemo } from 'react';
import { X, Box } from 'lucide-react';
import { InventoryItem, Product } from '../types';
import { formatCurrency } from '../utils/dataUtils';

interface Props {
  storeName: string | null;
  items: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onViewProduct: (sku: string) => void;
  products: Product[];
}

export const StoreStockModal: React.FC<Props> = ({ storeName, items, isOpen, onClose, onViewProduct, products }) => {
  
  const getProductCost = (productId: string) => {
     const p = products.find(prod => prod.id === productId);
     return p ? p.cost : 0;
  };

  if (!isOpen || !storeName) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
       <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                  <h3 className="text-lg font-bold text-slate-800">{storeName}</h3>
                  <p className="text-xs text-slate-500">Stock Detail Report</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
              </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10 shadow-sm">
                      <tr>
                          <th className="px-6 py-3 bg-slate-50">SKU</th>
                          <th className="px-6 py-3 bg-slate-50">Product Name</th>
                          <th className="px-6 py-3 bg-slate-50">Brand</th>
                          <th className="px-6 py-3 text-right bg-slate-50">Quantity</th>
                          <th className="px-6 py-3 text-right bg-slate-50">Unit Cost</th>
                          <th className="px-6 py-3 text-right bg-slate-50">Total Value</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {items.map(item => {
                          const cost = getProductCost(item.productId);
                          return (
                              <tr key={item.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-3 font-mono text-xs">{item.sku}</td>
                                  <td className="px-6 py-3">
                                      <button 
                                        onClick={() => onViewProduct(item.sku)}
                                        className="font-medium text-slate-800 hover:text-indigo-600 hover:underline"
                                      >
                                          {item.productName}
                                      </button>
                                  </td>
                                  <td className="px-6 py-3">
                                      <span className={`px-2 py-0.5 rounded text-xs border ${
                                          item.brand === 'Domino' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                          item.brand === 'OTTO' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                          'bg-amber-50 text-amber-700 border-amber-100'
                                      }`}>
                                          {item.brand}
                                      </span>
                                  </td>
                                  <td className="px-6 py-3 text-right font-medium">{item.quantity}</td>
                                  <td className="px-6 py-3 text-right text-slate-500">{formatCurrency(cost)}</td>
                                  <td className="px-6 py-3 text-right font-medium text-emerald-600">{formatCurrency(cost * item.quantity)}</td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
              {items.length === 0 && (
                  <div className="p-8 text-center text-slate-400">No items in stock.</div>
              )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
              <div className="text-sm">
                  <span className="text-slate-500">Total Items: </span>
                  <span className="font-bold text-slate-800">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
              </div>
              <button 
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                  Close Report
              </button>
          </div>
       </div>
    </div>
  );
};
