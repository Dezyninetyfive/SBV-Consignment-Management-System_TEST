


import React, { useState, useMemo } from 'react';
import { SaleRecord, StockMovement, MovementType } from '../types';
import { Search, Filter, Download, Upload, Trash2, Edit2, Calendar, ChevronLeft, ChevronRight, CheckSquare, Square, ArrowUpDown, ArrowUp, ArrowDown, Store, ArrowLeft, DollarSign, History, ArrowUpRight, ArrowDownLeft, PlusCircle } from 'lucide-react';
import { SAMPLE_BRANDS } from '../constants';
import { formatCurrency } from '../utils/dataUtils';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { TransactionFormModal } from './TransactionFormModal';

interface Props {
  history: SaleRecord[];
  movements?: StockMovement[];
  onImportClick: (type: 'sales' | 'stock_movements') => void;
  onEditRecord: (record: SaleRecord) => void;
  onDeleteRecord: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onRecordTransaction?: (data: { date: string, type: MovementType, storeId: string, productId: string, variant: string, quantity: number, reference: string }) => void;
  onTransactionTransfer?: (data: any) => void; // Pass transfer handler if needed, though usually handled via onRecordTransaction for individual legs or unified modal
  stores?: any[]; // Passed for transaction modal
  products?: any[]; // Passed for transaction modal
}

type SortKey = 'date' | 'brand' | 'counter' | 'amount' | 'sku' | 'type' | 'quantity';
type SortDirection = 'asc' | 'desc';

export const DataManagement: React.FC<Props> = ({ 
  history, movements = [], onImportClick, onEditRecord, onDeleteRecord, onBulkDelete,
  onRecordTransaction, stores = [], products = []
}) => {
  // Data Source Switcher
  const [dataSource, setDataSource] = useState<'sales' | 'movements'>('sales');

  // Navigation State
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [movementTypeFilter, setMovementTypeFilter] = useState('All');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  
  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [itemToDeleteName, setItemToDeleteName] = useState<string | undefined>(undefined);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

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
    let data: any[] = dataSource === 'sales' ? history : movements;

    // Filter
    data = data.filter(record => {
      // Common Filters
      const matchesDateStart = !dateStart || record.date >= dateStart;
      const matchesDateEnd = !dateEnd || record.date <= dateEnd;
      
      if (!matchesDateStart || !matchesDateEnd) return false;

      // Sales Specific
      if (dataSource === 'sales') {
         const r = record as SaleRecord;
         if (viewMode === 'detail' && selectedStore && r.counter !== selectedStore) return false;
         
         const matchesSearch = viewMode === 'list' 
            ? r.counter.toLowerCase().includes(searchTerm.toLowerCase()) 
            : true;
         const matchesBrand = brandFilter === 'All' || r.brand === brandFilter;
         
         return matchesSearch && matchesBrand;
      }
      
      // Movements Specific
      if (dataSource === 'movements') {
         const m = record as StockMovement;
         const matchesSearch = 
            m.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.reference && m.reference.toLowerCase().includes(searchTerm.toLowerCase()));
         
         const matchesType = movementTypeFilter === 'All' || m.type === movementTypeFilter;
         return matchesSearch && matchesType;
      }

      return true;
    });

    // Sort
    data.sort((a, b) => {
      // Handle numeric vs string
      const valA = sortConfig.key === 'amount' || sortConfig.key === 'quantity' ? (a[sortConfig.key] || 0) : (a[sortConfig.key] || '');
      const valB = sortConfig.key === 'amount' || sortConfig.key === 'quantity' ? (b[sortConfig.key] || 0) : (b[sortConfig.key] || '');

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [history, movements, dataSource, searchTerm, brandFilter, movementTypeFilter, dateStart, dateEnd, sortConfig, viewMode, selectedStore]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Store Drill Down Stats (Sales Only) ---
  const storeStats = useMemo(() => {
    if (viewMode !== 'detail' || !selectedStore || dataSource !== 'sales') return null;

    const storeRecords = history.filter(r => r.counter === selectedStore);
    const totalRevenue = storeRecords.reduce((acc, r) => acc + r.amount, 0);
    const avgTicket = totalRevenue / (storeRecords.length || 1);
    
    const brandCounts: Record<string, number> = {};
    storeRecords.forEach(r => brandCounts[r.brand] = (brandCounts[r.brand] || 0) + r.amount);
    const topBrand = Object.entries(brandCounts).sort(([,a], [,b]) => b-a)[0]?.[0] || 'N/A';

    const monthCounts: Record<string, number> = {};
    storeRecords.forEach(r => {
        const m = r.date.substring(0, 7);
        monthCounts[m] = (monthCounts[m] || 0) + r.amount;
    });
    const bestMonth = Object.entries(monthCounts).sort(([,a], [,b]) => b-a)[0]?.[0] || 'N/A';

    return { totalRevenue, avgTicket, topBrand, bestMonth, recordCount: storeRecords.length };
  }, [viewMode, selectedStore, history, dataSource]);


  // --- Event Handlers ---

  const handleStoreClick = (storeName: string) => {
    setSelectedStore(storeName);
    setViewMode('detail');
    setCurrentPage(1);
    setSelectedIds(new Set());
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

  const triggerBulkDelete = () => {
     if (selectedIds.size > 0 && dataSource === 'sales') {
         setItemsToDelete(Array.from(selectedIds));
         setItemToDeleteName(undefined);
         setDeleteModalOpen(true);
     } else {
       alert("Bulk delete is currently only supported for Sales Records.");
     }
  };

  const triggerSingleDelete = (id: string) => {
     setItemsToDelete([id]);
     setItemToDeleteName(id);
     setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
     if (itemsToDelete.length === 1) {
         onDeleteRecord(itemsToDelete[0]);
     } else if (itemsToDelete.length > 1 && onBulkDelete) {
         onBulkDelete(itemsToDelete);
     }
     setSelectedIds(new Set());
     setItemsToDelete([]);
  };

  const handleExport = () => {
    let csvHeader = "";
    let csvRows = "";
    const filename = dataSource === 'sales' ? 'sales_data' : 'stock_movements';

    if (dataSource === 'sales') {
       csvHeader = "Date,Brand,Counter,Amount\n";
       csvRows = processedData.map(r => `${r.date},${r.brand},"${r.counter}",${r.amount}`).join("\n");
    } else {
       csvHeader = "Date,Type,StoreName,SKU,Variant,Quantity,Reference\n";
       csvRows = processedData.map(m => `${m.date},${m.type},"${m.storeName}",${m.sku},${m.variant},${m.quantity},${m.reference || ''}`).join("\n");
    }

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const movementTypes = ['Sale', 'Restock', 'Transfer In', 'Transfer Out', 'Adjustment', 'Return'];

  // --- Render ---

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header / Stats */}
      {dataSource === 'sales' && viewMode === 'list' && (
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
      )}

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-end sticky top-0 z-20">
        
        <div className="flex flex-col gap-4 w-full lg:w-auto">
          
          {/* Source Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg self-start">
             <button
                onClick={() => { setDataSource('sales'); setViewMode('list'); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                   dataSource === 'sales' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
             >
                <DollarSign size={16} /> Sales Records
             </button>
             <button
                onClick={() => { setDataSource('movements'); setViewMode('list'); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                   dataSource === 'movements' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
             >
                <History size={16} /> Stock Movements
             </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            {viewMode === 'list' && (
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Search</label>
                    <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder={dataSource === 'sales' ? "Store Name..." : "Store, Product, SKU..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-48 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    />
                    </div>
                </div>
            )}

            {/* Sales Filters */}
            {dataSource === 'sales' && viewMode === 'list' && (
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
            )}

            {/* Movement Filters */}
            {dataSource === 'movements' && (
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                    <div className="relative">
                    <select 
                        value={movementTypeFilter}
                        onChange={(e) => setMovementTypeFilter(e.target.value)}
                        className="w-full sm:w-32 pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 text-sm appearance-none"
                    >
                        <option value="All">All Types</option>
                        {movementTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>
            )}

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
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full lg:w-auto justify-end items-center">
          {dataSource === 'movements' && onRecordTransaction && (
             <button 
                onClick={() => setIsTransactionModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors whitespace-nowrap"
             >
                <PlusCircle size={16} /> Add Transaction
             </button>
          )}
          
          {selectedIds.size > 0 && dataSource === 'sales' && (
              <button 
                onClick={triggerBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors shadow-sm mr-2"
              >
                <Trash2 size={16} />
                Delete {selectedIds.size}
              </button>
          )}
          {viewMode === 'list' && (
             <button 
                onClick={() => onImportClick(dataSource === 'sales' ? 'sales' : 'stock_movements')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
                <Upload size={16} />
                Import
            </button>
          )}
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} />
            Export
          </button>
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                {/* Checkbox (Sales Only for now as Movements don't have bulk delete yet) */}
                {dataSource === 'sales' && (
                    <th className="px-4 py-4 w-10">
                        <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600">
                            {selectedIds.size === currentData.length && currentData.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                    </th>
                )}
                
                {/* Headers based on Source */}
                {dataSource === 'sales' ? (
                    <>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('date')}><div className="flex items-center gap-1">Date <SortIcon column="date"/></div></th>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('brand')}><div className="flex items-center gap-1">Brand <SortIcon column="brand"/></div></th>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('counter')}><div className="flex items-center gap-1">Store <SortIcon column="counter"/></div></th>
                        <th className="px-6 py-4 text-right cursor-pointer" onClick={() => handleSort('amount')}><div className="flex items-center justify-end gap-1">Amount <SortIcon column="amount"/></div></th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </>
                ) : (
                    <>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('date')}><div className="flex items-center gap-1">Date <SortIcon column="date"/></div></th>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('type')}><div className="flex items-center gap-1">Type <SortIcon column="type"/></div></th>
                        <th className="px-6 py-4">Store</th>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4 text-right cursor-pointer" onClick={() => handleSort('quantity')}><div className="flex items-center justify-end gap-1">Qty <SortIcon column="quantity"/></div></th>
                        <th className="px-6 py-4 text-right">Ref</th>
                    </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.map((record) => {
                if (dataSource === 'sales') {
                    // SALES ROW
                    const r = record as SaleRecord;
                    const isSelected = selectedIds.has(r.id);
                    return (
                        <tr key={r.id} className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                            <td className="px-4 py-4">
                                <button onClick={() => toggleSelect(r.id)} className={`transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>
                                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                </button>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                {r.date}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                                    ${r.brand === 'Domino' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                    r.brand === 'OTTO' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                    'bg-amber-50 text-amber-700 border-amber-100'
                                    }
                                `}>
                                {r.brand}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {viewMode === 'list' ? (
                                <button 
                                    onClick={() => handleStoreClick(r.counter)}
                                    className="text-indigo-600 hover:text-indigo-800 hover:underline text-left font-medium"
                                >
                                    {r.counter}
                                </button>
                                ) : (
                                    <span className="text-slate-700 font-medium">{r.counter}</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">
                                {formatCurrency(r.amount)}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => onEditRecord(r)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => triggerSingleDelete(r.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" 
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                                </div>
                            </td>
                        </tr>
                    );
                } else {
                    // MOVEMENT ROW
                    const m = record as StockMovement;
                    return (
                        <tr key={m.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-mono text-xs">{m.date}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${
                                    m.type === 'Sale' || m.type === 'Transfer Out' ? 'bg-red-50 text-red-700 border-red-100' :
                                    m.type === 'Restock' || m.type === 'Return' || m.type === 'Transfer In' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    'bg-slate-50 text-slate-600 border-slate-100'
                                }`}>
                                    {m.quantity > 0 ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                    {m.type}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-slate-800">{m.storeName}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-slate-800 font-medium">{m.productName}</div>
                                <div className="text-xs text-slate-400 font-mono flex gap-2">
                                    <span>{m.sku}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-indigo-600 font-medium">{m.variant}</span>
                                </div>
                            </td>
                            <td className={`px-6 py-4 text-right font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {m.quantity > 0 ? '+' : ''}{m.quantity}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">
                                {m.reference || '-'}
                            </td>
                        </tr>
                    );
                }
              })}
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

      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        count={itemsToDelete.length}
        itemName={itemToDeleteName}
      />

      {/* Transaction Modal for Adding Manual Records directly from Data tab */}
      {onRecordTransaction && (
        <TransactionFormModal 
            isOpen={isTransactionModalOpen}
            onClose={() => setIsTransactionModalOpen(false)}
            stores={stores}
            products={products}
            onSubmit={onRecordTransaction}
            onTransfer={undefined} // Transfer usually initiated from inventory context or unified modal, simple record here
        />
      )}

    </div>
  );
};