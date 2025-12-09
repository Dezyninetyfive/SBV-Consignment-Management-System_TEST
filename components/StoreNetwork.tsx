import React, { useState, useMemo } from 'react';
import { StoreProfile } from '../types';
import { Search, MapPin, Building2, Plus, Edit2, Filter, Upload, CheckSquare, Square, Layers, Tag, Download, Trash2 } from 'lucide-react';
import { BulkEditModal } from './BulkEditModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface Props {
  stores: StoreProfile[];
  onEditAction: (store: StoreProfile) => void;
  onAddAction: () => void;
  onImportAction: () => void;
  onBulkUpdateAction: (ids: string[], updates: Partial<StoreProfile>) => void;
  onDeleteAction?: (storeId: string) => void;
}

export const StoreNetwork: React.FC<Props> = ({ stores, onEditAction, onAddAction, onImportAction, onBulkUpdateAction, onDeleteAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<'group' | 'brands' | null>(null);

  // Delete Modal State
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);

  // Derive unique groups for filter
  const groups = ['All', ...Array.from(new Set(stores.map(s => s.group))).sort()];

  // Filter Logic
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            store.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = filterGroup === 'All' || store.group === filterGroup;
      return matchesSearch && matchesGroup;
    });
  }, [stores, searchTerm, filterGroup]);

  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStores.length && filteredStores.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStores.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkSave = (updates: Partial<StoreProfile>) => {
    onBulkUpdateAction(Array.from(selectedIds), updates);
    setSelectedIds(new Set()); // Clear selection after update
  };

  const handleExportStores = () => {
    const csvHeader = "ID,Name,Group,Address,City,State,Region,PostalCode,CarriedBrands\n";
    const safe = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    
    const csvRows = stores.map(s => {
        const brands = s.carriedBrands.join('|');
        return `${safe(s.id)},${safe(s.name)},${safe(s.group)},${safe(s.address)},${safe(s.city)},${safe(s.state)},${safe(s.region)},${safe(s.postalCode)},${safe(brands)}`;
    }).join("\n");
    
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store_network_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const confirmDelete = () => {
    if (storeToDelete && onDeleteAction) {
      onDeleteAction(storeToDelete);
      setStoreToDelete(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-4 flex-1 w-full md:w-auto">
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search stores, cities..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-800"
            />
          </div>
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
               value={filterGroup}
               onChange={(e) => setFilterGroup(e.target.value)}
               className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm appearance-none cursor-pointer text-slate-800"
             >
               {groups.map(g => <option key={g} value={g}>{g}</option>)}
             </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleExportStores}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} />
            Export Stores
          </button>
          <button 
            onClick={onImportAction}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Upload size={16} />
            Import Stores
          </button>
          <button 
            onClick={onAddAction}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add New Store
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Total Stores</p>
          <p className="text-2xl font-bold text-slate-800">{stores.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Total Counters</p>
          <p className="text-2xl font-bold text-indigo-600">
            {stores.reduce((acc, s) => acc + s.carriedBrands.length, 0)}
          </p>
        </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Groups</p>
          <p className="text-2xl font-bold text-slate-800">{groups.length - 1}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase">Cities</p>
          <p className="text-2xl font-bold text-slate-800">
            {new Set(stores.map(s => s.city)).size}
          </p>
        </div>
      </div>

      {/* Table Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-16">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-4 w-10">
                  <button 
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-indigo-600"
                  >
                     {selectedIds.size > 0 && selectedIds.size === filteredStores.length ? (
                       <CheckSquare size={18} className="text-indigo-600" />
                     ) : (
                       <Square size={18} />
                     )}
                  </button>
                </th>
                <th className="px-6 py-4">Store Name</th>
                <th className="px-6 py-4">Group</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Carried Brands</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStores.map((store) => {
                const isSelected = selectedIds.has(store.id);
                return (
                  <tr key={store.id} className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => toggleSelect(store.id)}
                        className={`transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'}`}
                      >
                         {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{store.name}</div>
                      <div className="text-xs text-slate-400">{store.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                        <Building2 size={12} className="mr-1" />
                        {store.group}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                         <MapPin size={14} className="mt-0.5 text-slate-400 flex-shrink-0" />
                         <div>
                           <div className="text-slate-700">{store.city}, {store.state}</div>
                           <div className="text-xs text-slate-400">{store.address}, {store.postalCode}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {store.carriedBrands.map(brand => (
                          <span key={brand} className={`px-2 py-0.5 rounded text-xs font-medium border
                            ${brand === 'Domino' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                              brand === 'OTTO' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                              'bg-amber-50 text-amber-700 border-amber-100'
                            }
                          `}>
                            {brand}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button 
                            onClick={() => onEditAction(store)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium p-1 hover:bg-indigo-50 rounded"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          {onDeleteAction && (
                            <button 
                              onClick={() => setStoreToDelete(store.id)}
                              className="text-red-500 hover:text-red-700 font-medium p-1 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredStores.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No stores found matching your filters.
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 z-[40] animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-md">
              {selectedIds.size}
            </span>
            <span className="text-sm font-medium">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setBulkMode('group')}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg text-sm transition-colors"
            >
              <Layers size={16} className="text-indigo-400" />
              Edit Group
            </button>
            <button 
              onClick={() => setBulkMode('brands')}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-lg text-sm transition-colors"
            >
              <Tag size={16} className="text-emerald-400" />
              Edit Brands
            </button>
          </div>
          <button 
            onClick={() => setSelectedIds(new Set())}
            className="ml-2 text-slate-400 hover:text-white text-xs"
          >
            Clear
          </button>
        </div>
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal 
        isOpen={!!bulkMode}
        mode={bulkMode}
        count={selectedIds.size}
        existingGroups={groups.filter(g => g !== 'All')}
        onClose={() => setBulkMode(null)}
        onSave={handleBulkSave}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={!!storeToDelete}
        onClose={() => setStoreToDelete(null)}
        onConfirm={confirmDelete}
        count={1}
        itemName={storeToDelete || undefined}
      />

    </div>
  );
};