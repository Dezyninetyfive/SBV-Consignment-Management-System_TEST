
import React, { useState, useMemo } from 'react';
import { X, Save, ArrowRightLeft } from 'lucide-react';
import { StoreProfile, Product, MovementType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreProfile[];
  products: Product[];
  onSubmit: (data: {
    date: string;
    type: MovementType;
    storeId: string;
    productId: string;
    variant: string;
    quantity: number;
    reference: string;
  }) => void;
  onTransfer?: (data: {
    date: string;
    fromStoreId: string;
    toStoreId: string;
    productId: string;
    variant: string;
    quantity: number;
    reference: string;
  }) => void;
}

export const TransactionFormModal: React.FC<Props> = ({ isOpen, onClose, stores, products, onSubmit, onTransfer }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<MovementType | 'Store Transfer'>('Restock');
  const [storeId, setStoreId] = useState('');
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [productId, setProductId] = useState('');
  const [variant, setVariant] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');

  // Search state for products
  const [productSearch, setProductSearch] = useState('');

  const selectedProduct = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 50); // Limit list if empty
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 50);
  }, [products, productSearch]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity) return;

    if (type === 'Store Transfer') {
        if (!fromStoreId || !toStoreId) return;
        if (onTransfer) {
            onTransfer({
                date,
                fromStoreId,
                toStoreId,
                productId,
                variant: variant || 'Standard',
                quantity: parseInt(quantity),
                reference
            });
        }
    } else {
        if (!storeId) return;
        onSubmit({
            date,
            type: type as MovementType,
            storeId,
            productId,
            variant: variant || 'Standard',
            quantity: parseInt(quantity),
            reference
        });
    }
    
    onClose();
    // Reset form
    setQuantity('');
    setReference('');
    setProductSearch('');
  };

  const isTransfer = type === 'Store Transfer';
  const isInbound = ['Restock', 'Transfer In', 'Return'].includes(type as string);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-indigo-600" />
            {isTransfer ? 'Transfer Stock' : 'Record Transaction'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
                <input 
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Movement Type</label>
                <select 
                  className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium ${isTransfer ? 'text-indigo-700 bg-indigo-50' : (isInbound ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50')}`}
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="Restock">Restock (In)</option>
                  <option value="Sale">Sale (Out)</option>
                  <option value="Store Transfer">Store Transfer</option>
                  <option value="Return">Return (In)</option>
                  <option value="Adjustment">Adjustment (Any)</option>
                  <option value="Transfer In">Transfer In (Single)</option>
                  <option value="Transfer Out">Transfer Out (Single)</option>
                </select>
              </div>
            </div>

            {isTransfer ? (
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">From Store</label>
                    <select 
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      value={fromStoreId}
                      onChange={(e) => setFromStoreId(e.target.value)}
                    >
                      <option value="">Select Source...</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">To Store</label>
                    <select 
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      value={toStoreId}
                      onChange={(e) => setToStoreId(e.target.value)}
                    >
                      <option value="">Select Destination...</option>
                      {stores.filter(s => s.id !== fromStoreId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
               </div>
            ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Store / Outlet</label>
                  <select 
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                  >
                    <option value="">Select Store...</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Product</label>
              {!selectedProduct ? (
                 <input 
                   className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                   placeholder="Search SKU or Name..."
                   value={productSearch}
                   onChange={(e) => setProductSearch(e.target.value)}
                   list="product-options"
                 />
              ) : (
                <div className="flex items-center justify-between p-2 border border-indigo-100 bg-indigo-50 rounded-lg">
                   <div className="text-sm">
                      <p className="font-bold text-indigo-900">{selectedProduct.sku}</p>
                      <p className="text-xs text-indigo-700">{selectedProduct.name}</p>
                   </div>
                   <button 
                     type="button" 
                     onClick={() => { setProductId(''); setVariant(''); }}
                     className="text-xs text-indigo-500 hover:text-indigo-800"
                   >
                     Change
                   </button>
                </div>
              )}
              <datalist id="product-options">
                 {filteredProducts.map(p => (
                    <option key={p.id} value={p.sku}>{p.name}</option>
                 ))}
              </datalist>
              {!selectedProduct && productSearch && (
                 <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg mt-1 bg-white shadow-sm">
                    {filteredProducts.map(p => (
                       <div 
                         key={p.id} 
                         className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                         onClick={() => { setProductId(p.id); setProductSearch(''); }}
                       >
                          <span className="font-mono font-bold text-slate-600 text-xs mr-2">{p.sku}</span>
                          {p.name}
                       </div>
                    ))}
                 </div>
              )}
            </div>

            {selectedProduct && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Variant</label>
                <select 
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                >
                  <option value="">Select Variant...</option>
                  {selectedProduct.variants.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Quantity</label>
                <input 
                  type="number"
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Reference / Doc #</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={isTransfer ? "e.g. TR-1001" : "e.g. PO-1001"}
                />
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">Cancel</button>
          <button 
            type="submit"
            form="transaction-form"
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} /> {isTransfer ? 'Confirm Transfer' : 'Save Record'}
          </button>
        </div>

      </div>
    </div>
  );
};
