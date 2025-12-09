
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Plus, Trash2, Layers, RefreshCw, Eye } from 'lucide-react';
import { Product, InventoryItem, StoreProfile } from '../types';
import { SAMPLE_BRANDS, PRODUCT_CATEGORIES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  inventory?: InventoryItem[];
  stores?: StoreProfile[];
}

interface AttributeGroup {
  id: string;
  name: string; // e.g. "Size", "Color"
  values: string[]; // e.g. ["S", "M"], ["Red", "Blue"]
}

export const ProductForm: React.FC<Props> = ({ isOpen, onClose, onSave, productToEdit, inventory = [], stores = [] }) => {
  const [formData, setFormData] = useState<Product>({
    id: '',
    sku: '',
    name: '',
    brand: SAMPLE_BRANDS[0],
    category: 'General',
    subCategory: '',
    cost: 0,
    price: 0,
    imageUrl: '',
    variants: []
  });

  // Variant Generator State
  const [useMatrix, setUseMatrix] = useState(false);
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([
    { id: '1', name: 'Size', values: [] },
    { id: '2', name: 'Color', values: [] }
  ]);
  const [newValues, setNewValues] = useState<Record<string, string>>({ '1': '', '2': '' });

  // UI State for stock viewing
  const [openVariantStock, setOpenVariantStock] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData(productToEdit);
        setUseMatrix(false); 
      } else {
        setFormData({
            id: `p-${Date.now()}`,
            sku: '',
            name: '',
            brand: SAMPLE_BRANDS[0],
            category: 'General',
            subCategory: '',
            cost: 0,
            price: 0,
            imageUrl: '',
            variants: [] 
        });
        setUseMatrix(true);
      }
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVariantNameChange = (oldName: string, newName: string) => {
    setFormData(prev => ({
        ...prev,
        variants: prev.variants.map(v => v === oldName ? newName : v)
    }));
  };

  const addVariant = () => {
    const newName = `New Variant ${formData.variants.length + 1}`;
    setFormData(prev => ({ ...prev, variants: [...prev.variants, newName] }));
  };

  const removeVariant = (v: string) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter(item => item !== v) }));
  };

  // --- Matrix/Generator Logic ---
  const addAttributeValue = (groupId: string) => {
    const val = newValues[groupId]?.trim();
    if (!val) return;
    
    setAttributeGroups(prev => prev.map(g => {
      if (g.id === groupId && !g.values.includes(val)) {
        return { ...g, values: [...g.values, val] };
      }
      return g;
    }));
    setNewValues(prev => ({ ...prev, [groupId]: '' }));
  };

  const removeAttributeValue = (groupId: string, val: string) => {
    setAttributeGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, values: g.values.filter(v => v !== val) };
      }
      return g;
    }));
  };

  const generateCombinations = () => {
    const activeGroups = attributeGroups.filter(g => g.values.length > 0);
    if (activeGroups.length === 0) return;

    const combinations = cartesian(activeGroups.map(g => g.values));
    
    const generatedVariants = combinations.map(combo => {
      const parts = Array.isArray(combo) ? combo : [combo];
      return parts.join('-'); 
    });

    setFormData(prev => ({
      ...prev,
      variants: Array.from(new Set([...prev.variants, ...generatedVariants]))
    }));
  };

  const cartesian = (args: any[]) => {
    const r: any[] = [];
    const max = args.length - 1;
    function helper(arr: any[], i: number) {
        for (let j = 0, l = args[i].length; j < l; j++) {
            const a = arr.slice(0);
            a.push(args[i][j]);
            if (i === max) r.push(a);
            else helper(a, i + 1);
        }
    }
    helper([], 0);
    return r.length === 0 ? args[0] : r;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const availableCategories = PRODUCT_CATEGORIES[formData.brand as keyof typeof PRODUCT_CATEGORIES] || [];

  // Helper to get stock details for a variant
  const getVariantStock = (variantName: string) => {
      const items = inventory.filter(i => i.productId === formData.id);
      let total = 0;
      const breakdown: {storeName: string, qty: number}[] = [];

      items.forEach(item => {
          const qty = item.variantQuantities?.[variantName] || 0;
          if (qty > 0) {
              total += qty;
              breakdown.push({ storeName: item.storeName, qty });
          }
      });
      return { total, breakdown };
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {productToEdit ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- Section 1: Core Details --- */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Core Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">SKU Code</label>
                  <input 
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    placeholder="e.g. DOM-SH-001"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Product Name</label>
                  <input 
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Slim Fit Cotton Shirt"
                  />
                </div>
              </div>
            </div>

            {/* --- Section 2: Classification --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Brand</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                >
                  {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Category</label>
                 <select 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="General">General</option>
                  {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* --- Section 3: Pricing --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
               <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Cost Price (RM)</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={formData.cost}
                  onChange={(e) => handleChange('cost', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Selling Price (RM)</label>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* --- Section 4: Variants Engine --- */}
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-indigo-600"/> 
                  Product Variants
                </h4>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    type="button"
                    onClick={() => setUseMatrix(false)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!useMatrix ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                  >
                    Edit List
                  </button>
                  <button 
                    type="button"
                    onClick={() => setUseMatrix(true)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${useMatrix ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                  >
                    Attribute Builder
                  </button>
                </div>
              </div>

              {useMatrix && (
                <div className="space-y-4 animate-in fade-in bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-6">
                   <p className="text-xs text-indigo-800 font-medium mb-2">Define attributes (e.g. Size, Color) to automatically generate combinations.</p>
                   
                   {attributeGroups.map((group) => (
                      <div key={group.id} className="space-y-2">
                         <div className="flex items-center justify-between">
                            <input 
                              value={group.name}
                              onChange={(e) => {
                                 const val = e.target.value;
                                 setAttributeGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: val } : g));
                              }}
                              className="text-xs font-bold text-slate-700 uppercase bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-24"
                            />
                            <span className="text-[10px] text-slate-400">Press Enter to add value</span>
                         </div>
                         <div className="flex gap-2">
                            <input 
                               className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                               placeholder={`Add ${group.name} value (e.g. ${group.name === 'Size' ? 'S' : 'Red'})...`}
                               value={newValues[group.id]}
                               onChange={(e) => setNewValues(prev => ({ ...prev, [group.id]: e.target.value }))}
                               onKeyDown={(e) => { 
                                 if(e.key === 'Enter') { e.preventDefault(); addAttributeValue(group.id); } 
                               }}
                            />
                            <button 
                               type="button"
                               onClick={() => addAttributeValue(group.id)}
                               className="px-3 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600"
                            >
                               <Plus size={16} />
                            </button>
                         </div>
                         <div className="flex flex-wrap gap-2 min-h-[28px]">
                            {group.values.map(val => (
                               <span key={val} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 flex items-center gap-1">
                                  {val}
                                  <button type="button" onClick={() => removeAttributeValue(group.id, val)} className="text-slate-400 hover:text-red-500">
                                    <X size={12} />
                                  </button>
                               </span>
                            ))}
                         </div>
                      </div>
                   ))}

                   <button 
                     type="button" 
                     onClick={generateCombinations}
                     className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                   >
                     <RefreshCw size={14} /> Generate & Append Combinations
                   </button>
                </div>
              )}

              {/* Variant List Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                 <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Variants List ({formData.variants.length})</span>
                    <button type="button" onClick={addVariant} className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                       <Plus size={12} /> Add Row
                    </button>
                 </div>
                 
                 <div className="max-h-[300px] overflow-y-auto">
                    {formData.variants.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <tbody className="divide-y divide-slate-100">
                                {formData.variants.map((v, idx) => {
                                    const stockInfo = getVariantStock(v);
                                    const isExpanded = openVariantStock === v;

                                    return (
                                        <React.Fragment key={idx}>
                                            <tr className="group hover:bg-slate-50">
                                                <td className="px-4 py-2 w-full">
                                                    <input 
                                                        className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-medium text-sm p-0"
                                                        value={v}
                                                        onChange={(e) => handleVariantNameChange(v, e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${stockInfo.total > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                            {stockInfo.total} qty
                                                        </span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setOpenVariantStock(isExpanded ? null : v)}
                                                            className={`p-1.5 rounded-full hover:bg-slate-200 transition-colors ${isExpanded ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                                                            title="View Store Breakdown"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeVariant(v)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50 shadow-inner">
                                                    <td colSpan={3} className="px-4 py-3">
                                                        <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs">
                                                            <p className="font-semibold text-slate-500 mb-2 uppercase">Stock by Store</p>
                                                            {stockInfo.breakdown.length > 0 ? (
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {stockInfo.breakdown.map((s, i) => (
                                                                        <div key={i} className="flex justify-between border-b border-slate-100 pb-1 last:border-0">
                                                                            <span className="text-slate-600 truncate mr-2">{s.storeName}</span>
                                                                            <span className="font-mono font-bold text-slate-800">{s.qty}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-slate-400 italic">No stock in any outlet.</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm italic">
                            No variants defined. Use the builder or add manually.
                        </div>
                    )}
                 </div>
              </div>
            </div>

            {/* --- Section 5: Image --- */}
            <div className="space-y-1 pt-4 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-500 uppercase">Image URL</label>
                <div className="flex gap-4 items-start">
                   <div className="flex-1">
                      <input 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                        value={formData.imageUrl}
                        onChange={(e) => handleChange('imageUrl', e.target.value)}
                        placeholder="https://..."
                      />
                   </div>
                   {formData.imageUrl && (
                      <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                   )}
                </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">Cancel</button>
          <button 
            type="submit"
            form="product-form"
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} /> {productToEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>

      </div>
    </div>
  );
};
