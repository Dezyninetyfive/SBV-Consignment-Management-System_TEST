
import React, { useMemo } from 'react';
import { InventoryItem, Invoice, Product, SaleRecord, StoreProfile } from '../types';
import { AlertTriangle, CheckCircle, ShieldCheck, Database, Link as LinkIcon, DollarSign, Package } from 'lucide-react';
import { formatCurrency } from '../utils/dataUtils';

interface Props {
  stores: StoreProfile[];
  products: Product[];
  inventory: InventoryItem[];
  history: SaleRecord[];
  invoices: Invoice[];
}

export const SystemHealth: React.FC<Props> = ({ stores, products, inventory, history, invoices }) => {
  
  const healthCheck = useMemo(() => {
    const issues: { severity: 'high' | 'medium' | 'low', message: string, count: number }[] = [];
    const storeIds = new Set(stores.map(s => s.id));
    const productIds = new Set(products.map(p => p.id));

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
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-indigo-600" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Diagnostics</h2>
          <p className="text-slate-500">Real-time data integrity audit and health check.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className={`p-6 rounded-xl border-l-4 shadow-sm ${healthCheck.issues.length === 0 ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-amber-500'}`}>
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
             <Database size={16} /> Database Stats
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-800">Detected Issues</h3>
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
    </div>
  );
};
