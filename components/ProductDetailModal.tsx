
import React, { useMemo } from 'react';
import { X, Edit, Box, DollarSign, Tag, Layers, MapPin } from 'lucide-react';
import { Product, InventoryItem } from '../types';
import { formatCurrency } from '../utils/dataUtils';

interface Props {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[]; // Needed to show where stock is located
  onEdit: (p: Product) => void;
}

export const ProductDetailModal: React.FC<Props> = ({ product, isOpen, onClose, inventory, onEdit }) => {
  
  // Calculate stock availability for this specific product
  const stockLocation = useMemo(() => {
    if (!product) return [];
    return inventory
      .filter(item => item.productId === product.id)
      .sort((a, b) => b.quantity - a.quantity);
  }, [product, inventory]);

  const totalStock = stockLocation.reduce((acc, item) => acc + item.quantity, 0);
  
  const currentPrice = product?.markdownPrice && product.markdownPrice > 0 ? product.markdownPrice : (product?.price || 0);
  const isDiscounted = product?.markdownPrice && product.markdownPrice > 0 && product.markdownPrice < product.price;

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               Product Details
               <span className="text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-mono">
                 {product.sku}
               </span>
             </h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit(product)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <Edit size={16} /> Edit Product
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Column: Image & Key Stats */}
            <div className="md:col-span-1 space-y-6">
              <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group">
                 {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Box size={48} />
                    </div>
                 )}
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    {isDiscounted ? (
                        <div>
                            <p className="text-white font-bold text-lg flex items-center gap-2">
                                {formatCurrency(currentPrice)}
                                <span className="text-sm line-through text-white/70 font-normal">{formatCurrency(product.price)}</span>
                            </p>
                            <span className="inline-block bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1">
                                SAVE {((1 - currentPrice/product.price)*100).toFixed(0)}%
                            </span>
                        </div>
                    ) : (
                        <p className="text-white font-bold text-lg">{formatCurrency(product.price)}</p>
                    )}
                    <p className="text-slate-200 text-xs">Retail Price</p>
                 </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                 <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Cost Price</span>
                    <span className="font-mono font-medium text-slate-700">{formatCurrency(product.cost)}</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Margin</span>
                    <span className="font-mono font-medium text-emerald-600">
                      {currentPrice > 0 ? ((1 - (product.cost / currentPrice)) * 100).toFixed(1) : 0}%
                    </span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Total Stock</span>
                    <span className="font-bold text-indigo-600">{totalStock} units</span>
                 </div>
              </div>
            </div>

            {/* Right Column: Details & Stock Table */}
            <div className="md:col-span-2 space-y-8">
              
              {/* Info Block */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{product.name}</h2>
                {product.description && <p className="text-slate-600 text-sm mb-4 leading-relaxed">{product.description}</p>}
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                    product.brand === 'Domino' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    product.brand === 'OTTO' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {product.brand}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {product.category}
                  </span>
                   {product.subCategory && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {product.subCategory}
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2">
                    <Layers size={14} /> Variants
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.length > 0 ? (
                      product.variants.map((v, idx) => (
                        <div key={idx} className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                           <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                           <span className="text-sm font-medium text-slate-700">{v}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400 italic">No variants defined</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Availability */}
              <div>
                 <h4 className="text-sm font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Store Availability ({stockLocation.length})
                 </h4>
                 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {stockLocation.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                          <tr>
                            <th className="px-4 py-3">Store Name</th>
                            <th className="px-4 py-3">Variant Breakdown</th>
                            <th className="px-4 py-3 text-right">Total Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stockLocation.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-700">{item.storeName}</td>
                              <td className="px-4 py-3">
                                 <div className="flex flex-wrap gap-1">
                                    {Object.entries(item.variantQuantities || {}).map(([variant, qty]) => (qty as number) > 0 && (
                                       <span key={variant} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                                          {variant}: <b>{qty as number}</b>
                                       </span>
                                    ))}
                                 </div>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-900">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                       <div className="p-8 text-center text-slate-400">
                         <Box size={32} className="mx-auto mb-2 opacity-50" />
                         <p>No stock currently recorded in any store.</p>
                       </div>
                    )}
                 </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
