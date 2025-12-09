
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Layers, RefreshCw, Truck, Tag } from 'lucide-react';
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
    variants: [],
    attributes: {},
    inventoryPlanning: { reorderPoint: 10, safetyStock: 5 }
  });

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
            variants: [],
            attributes: {},
            inventoryPlanning: { reorderPoint: 10, safetyStock: 5 }
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

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">{productToEdit ? 'Edit Product' : 'New Product'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Core Info */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">SKU</label>
                  <input className="w-full px-3 py-2 border rounded-lg" value={formData.sku} onChange={e => handleChange('sku', e.target.value)} />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                  <input className="w-full px-3 py-2 border rounded-lg" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
               </div>
            </div>

            {/* Sourcing & Supplier */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
               <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Truck size={16}/> Sourcing</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Supplier</label>
                     <input className="w-full px-3 py-2 border rounded-lg bg-white" placeholder="Select supplier..." value={formData.supplierName || ''} onChange={e => handleChange('supplierName', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-500 uppercase">Reorder Point</label>
                     <input type="number" className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.inventoryPlanning?.reorderPoint} onChange={e => handlePlanningChange('reorderPoint', parseInt(e.target.value))} />
                  </div>
               </div>
            </div>

            {/* Attributes */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
               <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2"><Tag size={16}/> Fashion Attributes</h4>
               <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-indigo-700 uppercase">Fabric</label>
                     <input className="w-full px-3 py-2 border border-indigo-200 rounded-lg" value={formData.attributes?.fabric || ''} onChange={e => handleAttributeChange('fabric', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-indigo-700 uppercase">Fit / Cut</label>
                     <input className="w-full px-3 py-2 border border-indigo-200 rounded-lg" value={formData.attributes?.fit || ''} onChange={e => handleAttributeChange('fit', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-indigo-700 uppercase">Gender</label>
                     <select className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white" value={formData.attributes?.gender || ''} onChange={e => handleAttributeChange('gender', e.target.value)}>
                        <option value="">Select...</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                        <option value="Unisex">Unisex</option>
                     </select>
                  </div>
               </div>
            </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
           <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
           <button onClick={() => { onSave(formData); onClose(); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">Save Product</button>
        </div>
      </div>
    </div>
  );
};
