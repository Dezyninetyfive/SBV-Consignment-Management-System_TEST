
import React, { useState, useMemo } from 'react';
import { SaleRecord } from '../types';
import { Search, Filter, Download, Upload, Trash2, Edit2, Calendar, ChevronLeft, ChevronRight, CheckSquare, Square, ArrowUpDown, ArrowUp, ArrowDown, Store, TrendingUp, DollarSign, PieChart, ArrowLeft } from 'lucide-react';
import { SAMPLE_BRANDS } from '../constants';
import { formatCurrency } from '../utils/dataUtils';

interface Props {
  history: SaleRecord[];
  onImportClick: () => void;
  onEditRecord: (record: SaleRecord) => void;
  onDeleteRecord: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
}

type SortKey = 'date' | 'brand' | 'counter' | 'amount';
type SortDirection = 'asc' | 'desc';

export const DataManagement: React.FC<Props> = ({ history, onImportClick, onEditRecord, onDeleteRecord, onBulkDelete }) => {
  // Navigation State
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- Helpers ---

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} className="text-slate-300" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />;
  };

  // --- Filtering & Sorting Logic ---

  const processedData = useMemo(() => {
    // 1. Filter
    let data = history.filter(record => {
      // If in Detail mode, strictly filter by selected store
      if (viewMode === 'detail' && selectedStore) {
         if (record.counter !== selectedStore) return false;
      }

      const matchesSearch = viewMode === 'list' 
        ? record.counter.toLowerCase().includes(searchTerm.toLowerCase()) 
        : true; // In detail mode, we are already drilling down, search can be ignored or used for ID? Let's ignore for clarity or maybe filter brand.
      
      const matchesBrand = brandFilter === 'All' || record.brand === brandFilter;
      const matchesDateStart = !dateStart || record.date >= dateStart;
      const matchesDateEnd = !dateEnd || record.date <= dateEnd;
      return matchesSearch && matchesBrand && matchesDateStart && matchesDateEnd;
    });

    // 2. Sort
    data.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [history, searchTerm, brandFilter, dateStart, dateEnd, sortConfig, viewMode, selectedStore]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Store Drill Down Stats ---
  const storeStats = useMemo(() => {
    if (viewMode !== 'detail' || !selectedStore) return null;

    const storeRecords = history.filter(r => r.counter === selectedStore);
    const totalRevenue = storeRecords.reduce((acc, r) => acc + r.amount, 0);
    const avgTicket = totalRevenue / (storeRecords.length || 1);
    
    // Top Brand
    const brandCounts: Record<string, number> = {};
    storeRecords.forEach(r => brandCounts[r.brand] = (brandCounts[r.brand] || 0) + r.amount);
    const topBrand = Object.entries(brandCounts).sort(([,a], [,b]) => b-a)[0]?.[0] || 'N/A';

    // Best Month
    const monthCounts: Record<string, number> = {};
    storeRecords.forEach(r => {
        const m = r.date.substring(0, 7);
        monthCounts[m] = (monthCounts[m] || 0) + r.amount;
    });
    const bestMonth = Object.entries(monthCounts).sort(([,a], [,b]) => b-a)[0]?.[0] || 'N/A';

    return { totalRevenue, avgTicket, topBrand, bestMonth, recordCount: storeRecords.length };
  }, [viewMode, selectedStore, history]);


  // --- Event Handlers ---

  const handleStoreClick = (storeName: string) => {
    setSelectedStore(storeName);
    setViewMode('detail');
    setCurrentPage(1); // Reset page
    setSelectedIds(new Set()); // Clear selection
    // Optional: Reset filters or keep them? keeping them is usually better UX
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedStore(null);
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentData.length && currentData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentData.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
     if (window.confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) {
         if (onBulkDelete) onBulkDelete(Array.from(selectedIds));
         setSelectedIds(new Set());
     }
  };

  const handleExport = () => {
    const csvHeader = "Date,Brand,Counter,Amount\n";
    const csvRows = processedData.map(r => `${r.date},${r.brand},"${r.counter}",${r.amount}`).join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_data_${viewMode === 'detail' ? selectedStore : 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      onDeleteRecord(id);
    }
  };

  // --- Render ---

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header / Stats */}
      {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Calendar size={24} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Total Records</p>
                    <h3 className="text-xl font-bold text-slate-800">{history.length.toLocaleString()}</h3>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Total Revenue</p>
                    <h3 className="text-xl font-bold text-emerald-700">{formatCurrency(history.reduce((a,b) => a + b.amount, 0))}</h3>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                    <Store size={24} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Unique Stores</p>
                    <h3 className="text-xl font-bold text-slate-800">{new Set(history.map(r => r.counter)).size}</h3>
                </div>
            </div>
          </div>
      ) : (
          <div className="space-y-4">
            <button 
                onClick={handleBackToList}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
                <ArrowLeft size={18} /> Back to All Data
            </button>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                     <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Store className="text-indigo-600" />
                            {selectedStore}
                        </h2>
                        <p className="text-slate-500">Sales Transaction History</p>
                     </div>
                     <div className="flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 uppercase">
                            {storeStats?.recordCount} Transactions
                        </span>
                     </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Total Sales</p>
                        <p className="text-xl font-bold text-indigo-900">{formatCurrency(storeStats?.totalRevenue || 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Avg Ticket</p>
                        <p className="text-xl font-bold text-slate-700">{formatCurrency(storeStats?.avgTicket || 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Top Brand</p>
                        <p className="text-xl font-bold text-slate-700">{storeStats?.topBrand}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Best Month</p>
                        <p className="text-xl font-bold text-emerald-600">{storeStats?.bestMonth}</p>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-end sticky top-0 z-20">
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Search - Hide in Detail view since we selected a store */}
          {viewMode === 'list' && (
            <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Search Store</label>
                <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Store Name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm"
                />
                </div>
            </div>
          )}

          {/* Brand Filter */}
          <div className="space-y-1">
             <label className="text-xs font-semibold text-slate-500 uppercase">Brand</label>
             <div className="relative">
               <select 
                 value={brandFilter}
                 onChange={(e) => setBrandFilter(e.target.value)}
                 className="w-full sm:w-32 pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm appearance-none"
               >
                 <option value="All">All Brands</option>
                 {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
               <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
             </div>
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Date Range</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-32 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date" 
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-32 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full lg:w-auto justify-end items-center">
          {selectedIds.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors shadow-sm mr-2"
              >
                <Trash2 size={16} />
                Delete {selectedIds.size}
              </button>
          )}
          {viewMode === 'list' && (
             <button 
                onClick={onImportClick}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
                <Upload size={16} />
                Import CSV
            </button>
          )}
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-4 w-10">
                   <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600">
                      {selectedIds.size === currentData.length && currentData.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                   </button>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">Date <SortIcon column="date"/></div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('brand')}
                >
                  <div className="flex items-center gap-1">Brand <SortIcon column="brand"/></div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('counter')}
                >
                   <div className="flex items-center gap-1">Counter / Store <SortIcon column="counter"/></div>
                </th>
                <th 
                   className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                   onClick={() => handleSort('amount')}
                >
                   <div className="flex items-center justify-end gap-1">Amount <SortIcon column="amount"/></div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.map((record) => {
                const isSelected = selectedIds.has(record.id);
                return (
                <tr key={record.id} className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-4 py-4">
                     <button onClick={() => toggleSelect(record.id)} className={`transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                     </button>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {record.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                        ${record.brand === 'Domino' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                          record.brand === 'OTTO' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }
                    `}>
                      {record.brand}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {viewMode === 'list' ? (
                      <button 
                        onClick={() => handleStoreClick(record.counter)}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline text-left font-medium"
                      >
                        {record.counter}
                      </button>
                    ) : (
                        <span className="text-slate-700 font-medium">{record.counter}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">
                    {formatCurrency(record.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => onEditRecord(record)}
                         className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                         title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                         onClick={() => handleDeleteClick(record.id)}
                         className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" 
                         title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {processedData.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            No records found matching your filters.
          </div>
        )}

        {/* Pagination Footer */}
        {processedData.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> of <span className="font-medium">{processedData.length}</span> records
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
