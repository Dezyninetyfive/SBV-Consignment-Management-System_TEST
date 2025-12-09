
import React, { useState } from 'react';
import { Supplier } from '../types';
import { Search, Plus, Phone, Mail, MapPin, Edit2 } from 'lucide-react';

interface Props {
  suppliers: Supplier[];
  onAdd: () => void;
  onEdit: (s: Supplier) => void;
}

export const SupplierList: React.FC<Props> = ({ suppliers, onAdd, onEdit }) => {
  const [search, setSearch] = useState('');

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search suppliers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(supplier => (
          <div key={supplier.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors group relative">
            <button 
              onClick={() => onEdit(supplier)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Edit2 size={16} />
            </button>
            
            <h3 className="font-bold text-slate-800 text-lg mb-1">{supplier.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{supplier.address}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <div className="p-1.5 bg-slate-100 rounded text-slate-500"><UserIcon size={14} /></div>
                <span className="font-medium">{supplier.contactPerson}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="p-1.5 bg-slate-100 rounded text-slate-500"><Phone size={14} /></div>
                <span>{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <div className="p-1.5 bg-slate-100 rounded text-slate-500"><Mail size={14} /></div>
                <a href={`mailto:${supplier.email}`} className="hover:text-indigo-600 hover:underline">{supplier.email}</a>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs">
              <div>
                <span className="text-slate-400 block uppercase font-bold">Terms</span>
                <span className="font-mono font-medium text-slate-700">{supplier.paymentTerms} Days</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block uppercase font-bold">Lead Time</span>
                <span className="font-mono font-medium text-slate-700">{supplier.leadTime} Days</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-400">No suppliers found.</div>
        )}
      </div>
    </div>
  );
};

const UserIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
