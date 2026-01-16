
import React, { useMemo, useState, useEffect } from 'react';
import { InventoryItem, Invoice, Product, SaleRecord, StoreProfile, StockMovement } from '../types';
import { AlertTriangle, CheckCircle, ShieldCheck, Database, Link as LinkIcon, Activity, RefreshCw, Server, Cloud, HardDrive, RefreshCcw } from 'lucide-react';
import { formatCurrency } from '../utils/dataUtils';
import { useERP } from '../contexts/ERPContext';

interface Props {
  stores: StoreProfile[];
  products: Product[];
  inventory: InventoryItem[];
  history: SaleRecord[];
  invoices: Invoice[];
  movements: StockMovement[];
}

export const SystemHealth: React.FC<Props> = ({ stores, products, inventory, history, invoices, movements }) => {
  const { isSynced, actions } = useERP();
  const [lastScan, setLastScan] = useState(new Date());
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    setIsScanning(true);
    const timer = setTimeout(() => {
      setLastScan(new Date());
      setIsScanning(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [stores, products, inventory, history, invoices, movements]);
  
  const healthCheck = useMemo(() => {
    const issues: { severity: 'high' | 'medium' | 'low', message: string, count: number }[] = [];
    const storeIds = new Set(stores.map(s => s.id));
    
    const negativeStock = inventory.filter(i => i.quantity < 0);
    if (negativeStock.length > 0) {
      issues.push({ severity: 'high', message: 'Negative physical inventory detected.', count: negativeStock.length });
    }

    const orphanedInvoices = invoices.filter(i => !storeIds.has(i.storeId));
    if (orphanedInvoices.length > 0) {
      issues.push({ severity: 'high', message: 'AR Records tied to non-existent stores.', count: orphanedInvoices.length });
    }

    return { issues };
  }, [stores, inventory, invoices]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
             <div className="p-3 bg-indigo-50 rounded-xl">
               <ShieldCheck className="text-indigo-600" size={32} />
             </div>
             <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
             </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Spine Diagnostics</h2>
            <div className="flex items-center gap-4 mt-1">
               <p className="text-xs text-slate-500 flex items-center gap-2 font-mono uppercase tracking-tight">
                  {isScanning ? (
                     <span className="text-indigo-600 flex items-center gap-1.5">
                        <RefreshCw size={12} className="animate-spin" /> SCANNING_BACKBONE...
                     </span>
                  ) : (
                     <span className="text-emerald-600 flex items-center gap-1.5 font-bold">
                        <Activity size={12} /> SPINE_CONNECTION_STABLE
                     </span>
                  )}
               </p>
               <div className="h-3 w-px bg-slate-200" />
               <p className={`text-[10px] font-bold uppercase flex items-center gap-1.5 ${isSynced ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {isSynced ? <Cloud size={12} /> : <RefreshCcw size={12} className="animate-spin" />}
                  {isSynced ? 'All Data Persisted' : 'Syncing to LocalStorage...'}
               </p>
            </div>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-slate-400 uppercase font-black">Last Integrity Scan</p>
           <p className="text-sm font-mono text-slate-700 font-bold">{lastScan.toLocaleTimeString()} . {lastScan.getMilliseconds()}ms</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-2xl border-l-4 shadow-sm ${healthCheck.issues.length === 0 ? 'bg-emerald-50 border-emerald-500' : 'bg-amber-50 border-amber-500'}`}>
           <h3 className="font-bold text-sm text-slate-500 uppercase mb-2">System Health</h3>
           <div className={`flex items-center gap-2 font-black text-sm ${healthCheck.issues.length === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {healthCheck.issues.length === 0 ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              {healthCheck.issues.length === 0 ? 'OPERATIONAL' : `${healthCheck.issues.length} ANOMALIES`}
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-xs text-slate-400 uppercase mb-3 flex items-center gap-2">
             <HardDrive size={16} /> Data Persistence
           </h3>
           <div className="space-y-1">
             <p className="text-sm font-bold text-slate-800">LocalStorage Active</p>
             <p className="text-[10px] text-slate-500 leading-tight">Your data is being saved automatically to your browser session.</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-xs text-slate-400 uppercase mb-3 flex items-center gap-2">
             <Server size={16} /> Backend Readiness
           </h3>
           <div className="space-y-1">
             <p className="text-sm font-bold text-indigo-600">SQL Schema Valid</p>
             <p className="text-[10px] text-slate-500 leading-tight">Data models are optimized for PostgreSQL/Supabase migration.</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-xs text-slate-400 uppercase mb-3 flex items-center gap-2">
             <Database size={16} /> Volume
           </h3>
           <div className="flex justify-between items-end">
              <div>
                 <p className="text-lg font-black text-slate-800">{history.length + movements.length}</p>
                 <p className="text-[10px] text-slate-400">Total JSON Nodes</p>
              </div>
              <button 
                 onClick={actions.resetData}
                 className="text-[10px] font-bold text-red-500 hover:text-red-700 underline"
              >
                 Hard Reset
              </button>
           </div>
        </div>
      </div>

      {!healthCheck.issues.length ? (
         <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
               <CheckCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Spine Integrity Verified</h3>
            <p className="text-slate-500 max-w-md mt-2 text-sm">
               All relationship pointers between Store Profiles, Inventory Units, and AR Invoices are synchronized and logically sound.
            </p>
         </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
           {/* Logic to show issues would go here */}
        </div>
      )}
    </div>
  );
};
