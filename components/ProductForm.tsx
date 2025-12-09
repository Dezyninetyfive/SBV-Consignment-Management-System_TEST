
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Layers, RefreshCw, Truck, Tag, Image, DollarSign, Box } from 'lucide-react';
import { Product, InventoryItem, StoreProfile, Supplier } from '../types';
import { SAMPLE_BRANDS, PRODUCT_CATEGORIES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  inventory?: InventoryItem[];
  stores?: StoreProfile[];
  suppliers?: Supplier[];
}

export const ProductForm: React.FC<Props> = ({ isOpen, onClose, onSave, productToEdit, suppliers = [] }) => {
  const [formData, setFormData] = useState<Product>({
    id: '',
    sku: '',
    name: '',
    description: '',
    brand: SAMPLE_BRANDS[0],
    category: 'General',
    subCategory: '',
    cost: 0,
    price: 0,
    imageUrl: '',
    variants: [],
    attributes: {},
    inventoryPlanning: { reorderPoint: 10, safetyStock: 5 },
    supplierId: '',
    supplierName: ''
  });

  const [newVariant, setNewVariant] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData(productToEdit);
      } else {
        setFormData({
            id: `p-${Date.now()}`,
            sku: '',
            name: '',
            description: '',
            brand: SAMPLE_BRANDS[0],
            category: 'General',
            subCategory: '',
            cost: 0,
            price: 0,
            imageUrl: '',
            variants: [],
            attributes: {},
            inventoryPlanning: { reorderPoint: 10, safetyStock: 5 },
            supplierId: '',
            supplierName: ''
        });
      }
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAttributeChange = (key: string, val: string) => {
    setFormData(prev => ({
        ...prev,
        attributes: { ...prev.attributes, [key]: val }
    }));
  };

  const handlePlanningChange = (key: string, val: number) => {
    setFormData(prev => ({
        ...prev,
        inventoryPlanning: { ...prev.inventoryPlanning!, [key]: val }
    }));
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supId = e.target.value;
    const sup = suppliers.find(s => s.id === supId);
    setFormData(prev => ({
        ...prev,
        supplierId: supId,
        supplierName: sup ? sup.name : ''
    }));
  };

  const addVariant = () => {
    if (newVariant.trim()) {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, newVariant.trim()]
        }));
        setNewVariant('');
    }
  };

  const removeVariant = (idx: number) => {
    setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== idx)
    }));
  };

  // Derived Category Lists
  const availableCategories = PRODUCT_CATEGORIES[formData.brand as keyof typeof PRODUCT_CATEGORIES] || ['General'];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">{productToEdit ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Section 1: Basic Info */}
            <div>
               <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Box size={16} /> Basic Information
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
                     <input className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="e.g. Slim Fit Cotton Shirt" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">SKU Code</label>
                     <input className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-sm" value={formData.sku} onChange={e => handleChange('sku', e.target.value)} placeholder="e.g. DOM-SH-001" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                     <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                     <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none h-20 resize-none text-sm" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} placeholder="Detailed product description..." />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                     <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Image size={14}/> Image URL</label>
                     <input className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm" value={formData.imageUrl} onChange={e => handleChange('imageUrl', e.target.value)} placeholder="https://..." />
                  </div>
               </div>
            </div>

            {/* Section 2: Categorization */}
            <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Layers size={16} /> Categorization
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Brand</label>
                     <select className="w-full px-3 py-2 border rounded-lg bg-white outline-none" value={formData.brand} onChange={e => handleChange('brand', e.target.value)}>
                        {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                     <select className="w-full px-3 py-2 border rounded-lg bg-white outline-none" value={formData.category} onChange={e => handleChange('category', e.target.value)}>
                        {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Sub-Category</label>
                     <input className="w-full px-3 py-2 border rounded-lg outline-none" value={formData.subCategory} onChange={e => handleChange('subCategory', e.target.value)} placeholder="e.g. Casual" />
                  </div>
               </div>
            </div>

            {/* Section 3: Financials & Sourcing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><DollarSign size={16}/> Pricing & Financials</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Cost Price</label>
                        <input type="number" step="0.01" className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.cost} onChange={e => handleChange('cost', parseFloat(e.target.value))} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Retail Price</label>
                        <input type="number" step="0.01" className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.price} onChange={e => handleChange('price', parseFloat(e.target.value))} />
                     </div>
                     <div className="col-span-2">
                        <div className="flex justify-between text-xs text-slate-500 bg-white p-2 rounded border border-slate-200">
                           <span>Projected Margin:</span>
                           <span className="font-bold text-emerald-600">
                              {formData.price > 0 ? ((1 - (formData.cost / formData.price)) * 100).toFixed(1) : 0}%
                           </span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Truck size={16}/> Sourcing & Stock</h4>
                  <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Supplier</label>
                        <select 
                           className="w-full px-3 py-2 border rounded-lg bg-white outline-none" 
                           value={formData.supplierId || ''} 
                           onChange={handleSupplierChange}
                        >
                           <option value="">Select Supplier...</option>
                           {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-500 uppercase">Reorder Point</label>
                           <input type="number" className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.inventoryPlanning?.reorderPoint} onChange={e => handlePlanningChange('reorderPoint', parseInt(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-500 uppercase">Safety Stock</label>
                           <input type="number" className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.inventoryPlanning?.safetyStock} onChange={e => handlePlanningChange('safetyStock', parseInt(e.target.value))} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Section 4: Attributes & Variants */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
               <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2"><Tag size={16}/> Attributes & Variants</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Attributes */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-700 uppercase">Fabric</label>
                        <input className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white" value={formData.attributes?.fabric || ''} onChange={e => handleAttributeChange('fabric', e.target.value)} placeholder="Cotton" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-700 uppercase">Fit / Cut</label>
                        <input className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white" value={formData.attributes?.fit || ''} onChange={e => handleAttributeChange('fit', e.target.value)} placeholder="Slim" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-700 uppercase">Gender</label>
                        <select className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white outline-none" value={formData.attributes?.gender || ''} onChange={e => handleAttributeChange('gender', e.target.value)}>
                           <option value="">Select...</option>
                           <option value="Men">Men</option>
                           <option value="Women">Women</option>
                           <option value="Kids">Kids</option>
                           <option value="Unisex">Unisex</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-indigo-700 uppercase">Season</label>
                        <input className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white" value={formData.attributes?.season || ''} onChange={e => handleAttributeChange('season', e.target.value)} placeholder="SS24" />
                     </div>
                  </div>

                  {/* Variants */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-indigo-700 uppercase">Product Variants (Size/Color)</label>
                     <div className="flex gap-2">
                        <input 
                           className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg bg-white outline-none text-sm"
                           value={newVariant}
                           onChange={e => setNewVariant(e.target.value)}
                           placeholder="e.g. Red-S"
                           onKeyDown={e => e.key === 'Enter' && addVariant()}
                        />
                        <button type="button" onClick={addVariant} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus size={16}/></button>
                     </div>
                     <div className="flex flex-wrap gap-2 mt-2 p-2 bg-white rounded-lg border border-indigo-100 min-h-[80px]">
                        {formData.variants.length > 0 ? (
                           formData.variants.map((v, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm border border-indigo-100">
                                 {v}
                                 <button onClick={() => removeVariant(idx)} className="hover:text-red-500"><X size={12}/></button>
                              </span>
                           ))
                        ) : (
                           <span className="text-sm text-slate-400 italic self-center">No variants added yet.</span>
                        )}
                     </div>
                  </div>
               </div>
            </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
           <button onClick={onClose} className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
           <button 
              onClick={() => { onSave(formData); onClose(); }} 
              className="flex-[2] py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-2"
           >
              <Save size={18} /> Save Product
           </button>
        </div>
      </div>
    </div>
  );
};
