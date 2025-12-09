
import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { SaleRecord, StoreProfile, Product, InventoryItem, Invoice } from '../types';
import { CSV_TEMPLATES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'sales' | 'stores' | 'products' | 'inventory' | 'invoices';
  onImportSales?: (data: SaleRecord[]) => void;
  onImportStores?: (data: StoreProfile[]) => void;
  onImportProducts?: (data: Product[]) => void;
  onImportInventory?: (data: any[]) => void;
  onImportInvoices?: (data: any[]) => void;
}

export const ImportModal: React.FC<Props> = ({ 
  isOpen, onClose, type, 
  onImportSales, onImportStores, onImportProducts, onImportInventory, onImportInvoices
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    try {
      setError(null);
      const lines = text.trim().split('\n');
      if (lines.length < 2) throw new Error("File appears empty or missing data rows");

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const results: any[] = [];

      // Validation logic
      if (type === 'sales' && (!headers.includes('date') || !headers.includes('amount'))) {
        throw new Error("Missing columns: Date, Amount");
      }
      if (type === 'stores' && !headers.includes('name')) {
        throw new Error("Missing column: Name");
      }
      if (type === 'products' && (!headers.includes('sku') || !headers.includes('brand'))) {
        throw new Error("Missing columns: SKU, Brand");
      }
      if (type === 'inventory' && (!headers.includes('storename') || !headers.includes('sku'))) {
        throw new Error("Missing columns: StoreName, SKU");
      }
      if (type === 'invoices' && (!headers.includes('storename') || !headers.includes('amount'))) {
         throw new Error("Missing columns: StoreName, Amount");
      }

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length < headers.length) continue;
        
        const obj: any = {};
        headers.forEach((h, index) => {
          obj[h] = row[index]?.trim();
        });
        
        // Transform based on type
        if (type === 'sales') {
          results.push({
            id: `import-${Date.now()}-${i}`,
            date: obj.date,
            brand: obj.brand || 'Unknown',
            counter: obj.counter || 'Unknown',
            amount: parseFloat(obj.amount) || 0
          } as SaleRecord);
        } else if (type === 'stores') {
          results.push({
            id: `store-import-${Date.now()}-${i}`,
            name: obj.name,
            group: obj.group || 'Independent',
            city: obj.city || 'Unknown',
            region: obj.region || 'Central',
            address: obj.address || '',
            postalCode: '',
            state: obj.region || '',
            carriedBrands: obj.brands ? obj.brands.split('|') : [],
            creditTerm: 30,
            riskStatus: 'Low'
          } as StoreProfile);
        } else if (type === 'products') {
          results.push({
            id: `prod-import-${Date.now()}-${i}`,
            sku: obj.sku,
            name: obj.name || obj.sku,
            brand: obj.brand,
            category: obj.category || 'General',
            subCategory: '',
            cost: parseFloat(obj.cost) || 0,
            price: parseFloat(obj.price) || 0,
            imageUrl: '',
            variants: obj.variants ? obj.variants.split('|') : []
          } as Product);
        } else if (type === 'inventory') {
          results.push({
            storeName: obj.storename,
            sku: obj.sku,
            quantity: parseInt(obj.quantity) || 0
          });
        } else if (type === 'invoices') {
          results.push({
             storeName: obj.storename,
             brand: obj.brand || 'Unknown',
             amount: parseFloat(obj.amount) || 0,
             dueDate: obj.duedate || new Date().toISOString().split('T')[0]
          });
        }
      }

      setPreviewData(results);
    } catch (err: any) {
      setError(err.message);
      setPreviewData([]);
    }
  };

  const handleConfirm = () => {
    if (type === 'sales' && onImportSales) onImportSales(previewData);
    if (type === 'stores' && onImportStores) onImportStores(previewData);
    if (type === 'products' && onImportProducts) onImportProducts(previewData);
    if (type === 'inventory' && onImportInventory) onImportInventory(previewData);
    if (type === 'invoices' && onImportInvoices) onImportInvoices(previewData);
    
    onClose();
    setCsvContent('');
    setPreviewData([]);
  };

  const getTemplate = () => {
    switch(type) {
      case 'sales': return CSV_TEMPLATES.SALES;
      case 'stores': return CSV_TEMPLATES.STORES;
      case 'products': return CSV_TEMPLATES.PRODUCTS;
      case 'inventory': return CSV_TEMPLATES.INVENTORY;
      case 'invoices': return CSV_TEMPLATES.INVOICES;
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 uppercase text-sm tracking-wide">
            <Upload size={18} className="text-indigo-600" />
            Import {type}
          </h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 space-y-2">
            <p className="font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              CSV Format Required
            </p>
            <div className="bg-white p-3 rounded border border-blue-100 font-mono text-xs whitespace-pre overflow-x-auto">
              {getTemplate()}
            </div>
            {type === 'stores' && <p className="text-xs opacity-80">* Separate multiple brands with a pipe symbol (|).</p>}
            {type === 'products' && <p className="text-xs opacity-80">* Separate variants with a pipe symbol (|).</p>}
          </div>

          {!previewData.length ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Upload size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium mb-1">Click to Upload CSV</p>
              <p className="text-slate-400 text-xs mb-4">or drag and drop file here</p>
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-full mt-4" onClick={(e) => e.stopPropagation()}>
                 <textarea 
                   className="w-full h-24 p-3 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                   placeholder="Or paste CSV content here..."
                   value={csvContent}
                   onChange={(e) => { setCsvContent(e.target.value); if(e.target.value) parseCSV(e.target.value); }}
                 />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  Preview ({previewData.length} records)
                </h4>
                <button onClick={() => { setPreviewData([]); setCsvContent(''); }} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0">
                    <tr>
                      {Object.keys(previewData[0] || {}).filter(k => k !== 'id').map(key => (
                        <th key={key} className="px-4 py-2 capitalize">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        {Object.entries(row).filter(([k]) => k !== 'id').map(([k, v]: any) => (
                          <td key={k} className="px-4 py-2 text-slate-700">{Array.isArray(v) ? v.join(', ') : v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">Cancel</button>
          <button 
            onClick={handleConfirm}
            disabled={previewData.length === 0}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Records
          </button>
        </div>
      </div>
    </div>
  );
};
