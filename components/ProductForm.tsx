
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { SAMPLE_BRANDS, PRODUCT_CATEGORIES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
}

export const ProductForm: React.FC<Props> = ({ isOpen, onClose, onSave, productToEdit }) => {
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
  const [variantInput, setVariantInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData(productToEdit);
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
            variants: ['S', 'M', 'L'] // Default
        });
      }
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addVariant = () => {
    if (variantInput.trim() && !formData.variants.includes(variantInput.trim())) {
      setFormData(prev => ({ ...prev, variants: [...prev.variants, variantInput.trim()] }));
      setVariantInput('');
    }
  };

  const removeVariant = (v: string) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter(item => item !== v) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const availableCategories = PRODUCT_CATEGORIES[formData.brand as keyof typeof PRODUCT_CATEGORIES] || [];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {productToEdit ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
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

            {/* Classification */}
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

            {/* Pricing */}
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

            {/* Variants */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Variants (Size / Color)</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={variantInput}
                  onChange={(e) => setVariantInput(e.target.value)}
                  placeholder="Type variant and press Add (e.g. XL, Red)"
                  onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addVariant(); } }}
                />
                <button 
                  type="button" 
                  onClick={addVariant}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.variants.map(v => (
                  <span key={v} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    {v}
                    <button type="button" onClick={() => removeVariant(v)} className="hover:text-indigo-900"><X size={14}/></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Image URL</label>
                <input 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                  value={formData.imageUrl}
                  onChange={(e) => handleChange('imageUrl', e.target.value)}
                  placeholder="https://..."
                />
                {formData.imageUrl && (
                  <div className="mt-2 w-20 h-20 rounded-lg border border-slate-200 overflow-hidden">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
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
