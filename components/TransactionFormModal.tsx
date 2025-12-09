
import React, { useState, useMemo, useEffect } from 'react';
import { X, Save, ArrowRightLeft, Search, Plus, Trash2, Box, AlertCircle, ShoppingCart, Layers } from 'lucide-react';
import { StoreProfile, Product, MovementType, InventoryItem } from '../types';
import { SAMPLE_BRANDS } from '../constants';
import { formatCurrency } from '../utils/dataUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreProfile[];
  products: Product[];
  inventory: InventoryItem[]; // Needed to show current stock levels
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

interface TransactionItem {
  tempId: string;
  product: Product;
  variant: string;
  quantity: number;
  currentStock: number; // For display/validation
}

export const TransactionFormModal: React.FC<Props> = ({ isOpen, onClose, stores, products, inventory, onSubmit, onTransfer }) => {
  // Header State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<MovementType | 'Store Transfer'>('Sale');
  const [reference, setReference] = useState('');
  
  // Store Selection
  const [storeId, setStoreId] = useState('');
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');

  // Filtering State
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [productSearch, setProductSearch] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState<TransactionItem[]>([]);

  // --- Derived Variables (Moved Up) ---
  const isTransfer = type === 'Store Transfer';
  const isInbound = ['Restock', 'Transfer In', 'Return'].includes(type as string);
  const activeStoreId = isTransfer ? fromStoreId : storeId;

  // --- Logic: Available Products (Moved Up) ---
  const availableProducts = useMemo(() => {
    // Optimization: If modal is closed, return empty to save calc, BUT hooks must run.
    // However, since this is inside useMemo, it's fine.
    if (!isOpen) return [];

    let baseProducts = products;

    // 1. Filter by Brand
    if (selectedBrand !== 'All') {
      baseProducts = baseProducts.filter(p => p.brand === selectedBrand);
    }

    // 2. Filter by Search
    if (productSearch) {
      const lower = productSearch.toLowerCase();
      baseProducts = baseProducts.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.sku.toLowerCase().includes(lower)
      );
    }

    // 3. Map to include Stock Info
    return baseProducts.map(p => {
      // Find total stock for this product in the selected store
      let stock = 0;
      if (activeStoreId) {
        const item = inventory.find(i => i.storeId === activeStoreId && i.productId === p.id);
        stock = item ? item.quantity : 0;
      }
      return { ...p, currentStock: stock };
    }).filter(p => {
      // If it's an outbound transaction, hide items with 0 stock to prevent errors
      // Unless it's a Transfer In or Restock, then show everything
      if (!isInbound && !isTransfer && type !== 'Adjustment') {
         return p.currentStock > 0;
      }
      return true;
    });

  }, [products, inventory, activeStoreId, selectedBrand, productSearch, isInbound, isTransfer, type, isOpen]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCartItems([]);
      setReference('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // --- Handlers ---

  const addToCart = (product: any) => {
    const defaultVariant = product.variants.length > 0 ? product.variants[0] : 'Standard';
    
    const exists = cartItems.find(item => item.product.id === product.id && item.variant === defaultVariant);
    if (exists) return; 

    setCartItems(prev => [...prev, {
      tempId: Math.random().toString(36),
      product,
      variant: defaultVariant,
      quantity: 1,
      currentStock: product.currentStock 
    }]);
  };

  const removeFromCart = (tempId: string) => {
    setCartItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const updateCartItem = (tempId: string, field: keyof TransactionItem, value: any) => {
    setCartItems(prev => prev.map(item => {
      if (item.tempId === tempId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = () => {
    if (cartItems.length === 0) return;
    if (isTransfer && (!fromStoreId || !toStoreId)) return;
    if (!isTransfer && !storeId) return;

    cartItems.forEach(item => {
      if (isTransfer) {
        if (onTransfer) {
          onTransfer({
            date,
            fromStoreId,
            toStoreId,
            productId: item.product.id,
            variant: item.variant,
            quantity: item.quantity,
            reference
          });
        }
      } else {
        onSubmit({
          date,
          type: type as MovementType,
          storeId,
          productId: item.product.id,
          variant: item.variant,
          quantity: item.quantity,
          reference
        });
      }
    });

    onClose();
  };

  const getVariantStock = (productId: string, variant: string) => {
    if (!activeStoreId) return 0;
    const invItem = inventory.find(i => i.storeId === activeStoreId && i.productId === productId);
    return invItem?.variantQuantities?.[variant] || 0;
  };

  // --- Early Return for Visibility ---
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* --- Header Section --- */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-4 shadow-sm z-20">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="text-indigo-600" />
                {isTransfer ? 'Bulk Stock Transfer' : 'Record Transaction'}
              </h3>
              <p className="text-xs text-slate-500">Add multiple items to a single transaction record.</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Transaction Date</label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
             </div>
             
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                <select 
                  className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold outline-none
                    ${isTransfer ? 'bg-indigo-50 text-indigo-700' : isInbound ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}
                  `}
                  value={type}
                  onChange={(e) => {
                     setType(e.target.value as any);
                     setCartItems([]); 
                  }}
                >
                  <option value="Sale">Sale (Out)</option>
                  <option value="Restock">Restock (In)</option>
                  <option value="Store Transfer">Store Transfer</option>
                  <option value="Return">Return (In)</option>
                  <option value="Adjustment">Adjustment</option>
                  <option value="Transfer Out">Transfer Out (Manual)</option>
                </select>
             </div>

             {isTransfer ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">From Store (Source)</label>
                    <select 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none"
                      value={fromStoreId}
                      onChange={(e) => { setFromStoreId(e.target.value); setCartItems([]); }}
                    >
                      <option value="">Select Source...</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">To Store (Dest)</label>
                    <select 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none"
                      value={toStoreId}
                      onChange={(e) => setToStoreId(e.target.value)}
                    >
                      <option value="">Select Destination...</option>
                      {stores.filter(s => s.id !== fromStoreId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </>
             ) : (
                <div className="space-y-1 md:col-span-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Store / Outlet</label>
                   <select 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none"
                      value={storeId}
                      onChange={(e) => { setStoreId(e.target.value); setCartItems([]); }}
                   >
                      <option value="">Select Store...</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
             )}
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="flex-1 flex overflow-hidden">
           
           {/* LEFT: Product Picker (Catalog) */}
           <div className="w-1/2 flex flex-col border-r border-slate-200 bg-slate-50/30">
              <div className="p-4 border-b border-slate-200 bg-white flex flex-col gap-3">
                 <div className="flex gap-2">
                    <select 
                       className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none"
                       value={selectedBrand}
                       onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                       <option value="All">All Brands</option>
                       {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <div className="relative flex-1">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                          type="text" 
                          placeholder="Search SKU or Name..."
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                       />
                    </div>
                 </div>
                 {activeStoreId ? (
                    <p className="text-xs text-slate-500">
                       Showing products {isInbound ? 'available globally' : 'available at selected store'}
                    </p>
                 ) : (
                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                       <AlertCircle size={12} /> Please select a store first to see inventory.
                    </p>
                 )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                 {!activeStoreId ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                       <Box size={48} className="mb-2 opacity-20" />
                       <p>Select a store to load products</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                       {availableProducts.map(product => (
                          <div 
                             key={product.id} 
                             onClick={() => addToCart(product)}
                             className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md cursor-pointer transition-all group relative"
                          >
                             <div className="aspect-square bg-slate-100 relative">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                {(!isInbound && product.currentStock > 0) && (
                                   <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                      {product.currentStock} In Stock
                                   </div>
                                )}
                                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors flex items-center justify-center">
                                   <div className="bg-white p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
                                      <Plus size={20} className="text-indigo-600" />
                                   </div>
                                </div>
                             </div>
                             <div className="p-3">
                                <p className="text-xs font-bold text-indigo-600 uppercase mb-0.5">{product.brand}</p>
                                <h4 className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight mb-1">{product.name}</h4>
                                <p className="text-xs font-mono text-slate-400">{product.sku}</p>
                             </div>
                          </div>
                       ))}
                       {availableProducts.length === 0 && (
                          <div className="col-span-full py-12 text-center text-slate-400">
                             No products found for this criteria.
                          </div>
                       )}
                    </div>
                 )}
              </div>
           </div>

           {/* RIGHT: Transaction Cart */}
           <div className="w-1/2 flex flex-col bg-white">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShoppingCart size={18} className="text-indigo-600" />
                    Transaction Items
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs ml-2">{cartItems.length}</span>
                 </h3>
                 <div className="flex gap-2">
                    <input 
                       className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-40 focus:outline-none"
                       placeholder="Reference Doc #"
                       value={reference}
                       onChange={(e) => setReference(e.target.value)}
                    />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-0">
                 {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                       <Layers size={48} className="mb-4 opacity-20" />
                       <p className="text-sm">No items selected.</p>
                       <p className="text-xs opacity-70">Click products on the left to add them.</p>
                    </div>
                 ) : (
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase sticky top-0 z-10 shadow-sm">
                          <tr>
                             <th className="px-4 py-3">Product</th>
                             <th className="px-4 py-3 w-32">Variant</th>
                             <th className="px-4 py-3 text-center w-24">Qty</th>
                             <th className="px-4 py-3 w-10"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {cartItems.map((item) => {
                             const variantStock = getVariantStock(item.product.id, item.variant);
                             const isStockError = (!isInbound && !isTransfer && type !== 'Adjustment') && (item.quantity > variantStock);

                             return (
                                <tr key={item.tempId} className="hover:bg-slate-50 group">
                                   <td className="px-4 py-3">
                                      <div className="flex items-center gap-3">
                                         <img src={item.product.imageUrl} className="w-8 h-8 rounded object-cover bg-slate-100" alt="" />
                                         <div>
                                            <p className="font-medium text-slate-800 line-clamp-1">{item.product.name}</p>
                                            <p className="text-xs font-mono text-slate-400">{item.product.sku}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-4 py-3">
                                      <select 
                                         className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                                         value={item.variant}
                                         onChange={(e) => updateCartItem(item.tempId, 'variant', e.target.value)}
                                      >
                                         {item.product.variants.map(v => (
                                            <option key={v} value={v}>{v}</option>
                                         ))}
                                      </select>
                                      {(!isInbound && activeStoreId) && (
                                         <p className={`text-[10px] mt-1 ${isStockError ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                            Avail: {getVariantStock(item.product.id, item.variant)}
                                         </p>
                                      )}
                                   </td>
                                   <td className="px-4 py-3">
                                      <input 
                                         type="number" 
                                         min="1"
                                         className={`w-full text-center py-1 border rounded text-sm outline-none font-bold ${isStockError ? 'border-red-300 text-red-600 bg-red-50' : 'border-slate-200 text-slate-800'}`}
                                         value={item.quantity}
                                         onChange={(e) => updateCartItem(item.tempId, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                                      />
                                   </td>
                                   <td className="px-4 py-3 text-right">
                                      <button 
                                         onClick={() => removeFromCart(item.tempId)}
                                         className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                      >
                                         <Trash2 size={16} />
                                      </button>
                                   </td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-slate-600 uppercase">Total Quantity</span>
                    <span className="text-xl font-bold text-indigo-700">
                       {cartItems.reduce((acc, i) => acc + i.quantity, 0)} units
                    </span>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium">
                       Cancel
                    </button>
                    <button 
                       onClick={handleSubmit}
                       disabled={cartItems.length === 0 || (!isTransfer && !storeId) || (isTransfer && (!fromStoreId || !toStoreId))}
                       className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                       <Save size={20} />
                       {isTransfer ? 'Transfer Stock' : 'Confirm Transaction'}
                    </button>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};
