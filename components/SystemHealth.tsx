
import React, { useMemo, useState, useEffect } from 'react';
import { InventoryItem, Invoice, Product, SaleRecord, StoreProfile } from '../types';
import { AlertTriangle, CheckCircle, ShieldCheck, Database, Link as LinkIcon, Activity, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/dataUtils';

interface Props {
  stores: StoreProfile[];
  products: Product[];
  inventory: InventoryItem[];
  history: SaleRecord[];
  invoices: Invoice[];
}

export const SystemHealth: React.FC<Props> = ({ stores, products, inventory, history, invoices }) => {
  const [lastScan, setLastScan] = useState(new Date());
  const [isScanning, setIsScanning] = useState(false);

  // Watch for data changes to simulate "Real-time Scanning" visualization
  useEffect(() => {
    setIsScanning(true);
    const timer = setTimeout(() => {
      setLastScan(new Date());
      setIsScanning(false);
    }, 800); // Visual delay for the "scanning" effect
    return () => clearTimeout(timer);
  }, [stores, products, inventory, history, invoices]);
  
  const healthCheck = useMemo(() => {
    const issues: { severity: 'high' | 'medium' | 'low', message: string, count: number }[] = [];
    const storeIds = new Set(stores.map(s => s.id));
    
    // 1. Check for Negative Stock
    const negativeStock = inventory.filter(i => i.quantity < 0);
    if (negativeStock.length > 0) {
      issues.push({ severity: 'high', message: 'Inventory items with negative quantity detected.', count: negativeStock.length });
    }

    // 2. Check for Orphaned Inventory (Store Deleted)
    const orphanedInventory = inventory.filter(i => !storeIds.has(i.storeId));
    if (orphanedInventory.length > 0) {
      issues.push({ severity: 'high', message: 'Inventory records linked to non-existent stores.', count: orphanedInventory.length });
    }

    // 3. Check for Orphaned Sales (Store Deleted)
    // Note: SaleRecord uses 'counter' name, not ID. We check names.
    const storeNames = new Set(stores.map(s => s.name));
    const orphanedSales = history.filter(r => !storeNames.has(r.counter));
    if (orphanedSales.length > 0) {
      issues.push({ severity: 'medium', message: 'Sales records linked to non-existent store names.', count: orphanedSales.length });
    }

    // 4. Check for Orphaned Invoices
    const orphanedInvoices = invoices.filter(i => !storeIds.has(i.storeId));
    if (orphanedInvoices.length > 0) {
      issues.push({ severity: 'high', message: 'AR Invoices linked to non-existent stores.', count: orphanedInvoices.length });
    }

    // 5. Products with Zero Cost/Price
    const incompleteProducts = products.filter(p => p.cost <= 0 || p.price <= 0);
    if (incompleteProducts.length > 0) {
      issues.push({ severity: 'medium', message: 'Products with missing Cost or Selling Price.', count: incompleteProducts.length });
    }

    return { issues };
  }, [stores, products, inventory, history, invoices]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
             <ShieldCheck className="text-indigo-600" size={32} />
             <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
             </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">System Diagnostics</h2>
            <p className="text-sm text-slate-500 flex items-center gap-2">
               {isScanning ? (
                  <span className="text-indigo-600 font-medium flex items-center gap-1">
                     <RefreshCw size={12} className="animate-spin" /> Scanning Data Spine...
                  </span>
               ) : (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                     <Activity size={12} /> Real-time Monitoring Active
                  </span>
               )}
            </p>
          </div>
        </div>
        
        <div className="text-right">
           <p className="text-xs text-slate-400 uppercase font-semibold">Last Scan</p>
           <p className="text-sm font-mono text-slate-700">{lastScan.toLocaleTimeString()} . {lastScan.getMilliseconds()}ms</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className={`p-6 rounded-xl border-l-4 shadow-sm transition-all duration-300 ${isScanning ? 'opacity-70 scale-[0.99]' : 'opacity-100 scale-100'} ${healthCheck.issues.length === 0 ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-amber-500'}`}>
           <h3 className="font-bold text-lg mb-2 text-slate-800">Overall Health</h3>
           {healthCheck.issues.length === 0 ? (
             <div className="flex items-center gap-2 text-emerald-700">
               <CheckCircle size={20} />
               <span>All Systems Operational</span>
             </div>
           ) : (
             <div className="flex items-center gap-2 text-amber-600">
               <AlertTriangle size={20} />
               <span>{healthCheck.issues.length} Integrity Warning(s)</span>
             </div>
           )}
        </div>

        {/* Database Stats */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-sm text-slate-500 uppercase mb-4 flex items-center gap-2">
             <Database size={16} /> Data Backbone
           </h3>
           <div className="space-y-2 text-sm">
             <div className="flex justify-between">
               <span>Total Stores</span>
               <span className="font-mono font-bold">{stores.length}</span>
             </div>
             <div className="flex justify-between">
               <span>Products</span>
               <span className="font-mono font-bold">{products.length}</span>
             </div>
             <div className="flex justify-between">
               <span>Inventory Records</span>
               <span className="font-mono font-bold">{inventory.length}</span>
             </div>
           </div>
        </div>

        {/* Financial Linkage */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-sm text-slate-500 uppercase mb-4 flex items-center gap-2">
             <LinkIcon size={16} /> Financial Integrity
           </h3>
           <div className="space-y-2 text-sm">
             <div className="flex justify-between">
               <span>Active Invoices</span>
               <span className="font-mono font-bold">{invoices.length}</span>
             </div>
             <div className="flex justify-between">
               <span>Total Value</span>
               <span className="font-mono font-bold text-emerald-600">
                 {formatCurrency(invoices.reduce((acc, i) => acc + i.amount, 0))}
               </span>
             </div>
           </div>
        </div>
      </div>

      {/* Issues List */}
      {healthCheck.issues.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-2">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Detected Issues</h3>
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">{healthCheck.issues.length} Issues</span>
          </div>
          <div className="divide-y divide-slate-100">
            {healthCheck.issues.map((issue, idx) => (
              <div key={idx} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className={`p-2 rounded-full flex-shrink-0 ${
                  issue.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                      issue.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {issue.severity} Severity
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Count: {issue.count}</span>
                  </div>
                  <p className="text-slate-800 mt-1 font-medium">{issue.message}</p>
                  <p className="text-xs text-slate-500 mt-1">Recommended Action: Check Data Management tab and remove invalid records.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {healthCheck.issues.length === 0 && (
         <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
               <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">System Healthy</h3>
            <p className="text-slate-500 max-w-md mt-2">
               No data integrity issues detected across the ERP. All relationships between Stores, Inventory, and Financials are valid.
            </p>
         </div>
      )}
    </div>
  );
};
