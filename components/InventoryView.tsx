


import React, { useState, useMemo } from 'react';
import { Product, InventoryItem, StoreProfile, StockMovement, MovementType } from '../types';
import { Search, Package, Tag, Filter, Grid, List, Layers, Plus, Edit, AlertTriangle, X, Download, Upload, Image as ImageIcon, ArrowUpDown, History, BarChart2 } from 'lucide-react';
import { formatCurrency } from '../utils/dataUtils';
import { SAMPLE_BRANDS, PRODUCT_CATEGORIES } from '../constants';
import { ProductForm } from './ProductForm';
import { ProductDetailModal } from './ProductDetailModal';
import { StoreStockModal } from './StoreStockModal';
import { ProductAnalytics } from './ProductAnalytics';
import { TransactionFormModal } from './TransactionFormModal';

interface Props {
  products: Product[];
  inventory: InventoryItem[];
  stores: StoreProfile[];
  movements: StockMovement[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onTransferStock: (fromStoreId: string, toStoreId: string, productId: string, variant: string, qty: number, reference: string, date: string) => void;
  onImportClick: (type: 'products' | 'inventory') => void;
  onRecordTransaction: (data: { date: string, type: MovementType, storeId: string, productId: string, variant: string, quantity: number, reference: string }) => void;
}

export const InventoryView: React.FC<Props> = ({ 
    products, inventory, stores, movements,
    onAddProduct, onUpdateProduct, onTransferStock, onImportClick, onRecordTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'stock' | 'analytics'>('catalog');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'gallery'>('grid');
  
  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'sku'>('name');

  // Modal States
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingStoreItems, setViewingStoreItems] = useState<{ name: string, items: InventoryItem[] } | null>(null);
  const [viewingProductDetail, setViewingProductDetail] = useState<Product | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  
  // --- Logic ---

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchBrand = selectedBrand === 'All' || p.brand === selectedBrand;
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchCategory && matchSearch;
    });

    return result.sort((a, b) => {
        if (sortBy === 'price') return b.price - a.price;
        if (sortBy === 'sku') return a.sku.localeCompare(b.sku);
        return a.name.localeCompare(b.name);
    });
  }, [products, selectedBrand, selectedCategory, searchTerm, sortBy]);

  // Stock Aggregation
  const stockByStore = useMemo(() => {
    const agg: Record<string, { storeId: string, storeName: string, count: number, value: number, items: InventoryItem[] }> = {};
    const productCostMap = new Map<string, number>(products.map(p => [p.id, p.cost] as [string, number]));

    inventory.forEach(item => {
      if (!agg[item.storeId]) agg[item.storeId] = { storeId: item.storeId, storeName: item.storeName, count: 0, value: 0, items: [] };
      const cost = productCostMap.get(item.productId) || 0;
      agg[item.storeId].count += item.quantity;
      agg[item.storeId].value += (item.quantity * cost);
      agg[item.storeId].items.push(item);
    });

    return Object.values(agg).sort((a, b) => b.value - a.value);
  }, [inventory, products]);

  const availableCategories = useMemo(() => {
      if (selectedBrand === 'All') {
          return Array.from(new Set(products.map(p => p.category))).sort();
      }
      return PRODUCT_CATEGORIES[selectedBrand as keyof typeof PRODUCT_CATEGORIES] || [];
  }, [selectedBrand, products]);

  // --- Handlers ---

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setIsProductFormOpen(true);
  };

  const handleViewProduct = (p: Product) => {
    setViewingProductDetail(p);
  };

  const handleViewProductBySKU = (sku: string) => {
     const p = products.find(prod => prod.sku === sku);
     if (p) setViewingProductDetail(p);
  };

  const handleTransferSubmit = (data: { date: string, fromStoreId: string, toStoreId: string, productId: string, variant: string, quantity: number, reference: string }) => {
    onTransferStock(data.fromStoreId, data.toStoreId, data.productId, data.variant, data.quantity, data.reference, data.date);
  };

  const handleExportProducts = () => {
    const header = "SKU,Name,Brand,Category,Cost,Price,Variants\n";
    const rows = products.map(p => `${p.sku},"${p.name}",${p.brand},${p.category},${p.cost},${p.price},"${p.variants.join('|')}"`).join("\n");
    downloadCSV(header + rows, "product_master_export.csv");
  };

  const handleExportInventory = () => {
      const header = "StoreName,SKU,ProductName,Brand,Quantity\n";
      const rows = inventory.map(i => `"${i.storeName}",${i.sku},"${i.productName}",${i.brand},${i.quantity}`).join("\n");
      downloadCSV(header + rows, "inventory_stock_export.csv");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-indigo-600" />
            Inventory Management
          </h2>
          <p className="text-slate-500 text-sm">Manage products catalog, stock levels, and movements across outlets</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button 
                onClick={() => { setEditingProduct(null); setIsProductFormOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
                <Plus size={16} /> Add Product
            </button>
             <button 
               onClick={activeTab === 'catalog' ? handleExportProducts : handleExportInventory}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
                <Download size={16} /> Export
            </button>
            <button 
               onClick={() => onImportClick(activeTab === 'catalog' ? 'products' : 'inventory')}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
                <Upload size={16} /> Import
            </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-10 px-4 -mx-4 sm:mx-0 sm:px-0 sm:static">
          <div className="flex gap-6 overflow-x-auto pb-1px">
             <button onClick={() => setActiveTab('catalog')} className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'catalog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Package size={16} /> Product Master
             </button>
             <button onClick={() => setActiveTab('stock')} className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'stock' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Layers size={16} /> Stock Position
             </button>
             <button onClick={() => setActiveTab('analytics')} className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <BarChart2 size={16} /> Product Analytics
             </button>
          </div>
      </div>

      {/* Toolbar - Only show for Catalog and Stock tabs for filtering logic re-use */}
      {(activeTab === 'catalog' || activeTab === 'stock') && (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center z-20">
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text"
                    placeholder={activeTab === 'catalog' ? "Search SKU, Name..." : "Search Store..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                />
            </div>
            
            {activeTab === 'catalog' && (
                <>
                    <div className="relative w-full sm:w-40">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={selectedBrand}
                            onChange={(e) => { setSelectedBrand(e.target.value); setSelectedCategory('All'); }}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm appearance-none"
                        >
                            <option value="All">All Brands</option>
                            {SAMPLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                     <div className="relative w-full sm:w-40">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm appearance-none"
                        >
                            <option value="All">All Categories</option>
                            {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </>
            )}
        </div>

        <div className="flex gap-2 w-full lg:w-auto justify-between lg:justify-end">
             {activeTab === 'catalog' && (
                <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                     <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                         <List size={18} />
                     </button>
                     <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                         <Grid size={18} />
                     </button>
                      <button onClick={() => setViewMode('gallery')} className={`p-1.5 rounded ${viewMode === 'gallery' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                         <ImageIcon size={18} />
                     </button>
                </div>
             )}
            
            {activeTab === 'catalog' && (
                <div className="flex items-center gap-2">
                     <span className="text-xs font-semibold text-slate-500 uppercase hidden sm:inline">Sort:</span>
                     <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                     >
                        <option value="name">Name</option>
                        <option value="price">Price (High-Low)</option>
                        <option value="sku">SKU</option>
                     </select>
                </div>
            )}
        </div>
      </div>
      )}

      {/* === VIEW: CATALOG === */}
      {activeTab === 'catalog' && (
        <>
            {/* LIST VIEW */}
            {viewMode === 'list' && (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">SKU / Product</th>
                                <th className="px-6 py-4">Brand</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Variants</th>
                                <th className="px-6 py-4 text-right">Cost</th>
                                <th className="px-6 py-4 text-right">Price</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewProduct(product)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-slate-100 flex-shrink-0 overflow-hidden">
                                                <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{product.name}</div>
                                                <div className="text-xs font-mono text-slate-500">{product.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{product.brand}</td>
                                    <td className="px-6 py-4">{product.category}</td>
                                    <td className="px-6 py-4">
                                         <div className="flex flex-wrap gap-1">
                                            {product.variants.slice(0, 3).map(v => (
                                                <span key={v} className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">{v}</span>
                                            ))}
                                            {product.variants.length > 3 && (
                                                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-500">+{product.variants.length - 3}</span>
                                            )}
                                         </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(product.cost)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(product.price)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }} 
                                            className="text-indigo-600 hover:underline text-xs font-bold"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                 </div>
            )}

            {/* GRID & GALLERY VIEW */}
            {viewMode !== 'list' && (
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${viewMode === 'gallery' ? 'lg:grid-cols-4 xl:grid-cols-5' : ''}`}>
                {filteredProducts.map(product => (
                    <div 
                        key={product.id} 
                        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col cursor-pointer"
                        onClick={() => handleViewProduct(product)}
                    >
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleEditProduct(product); }}
                            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm text-slate-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <Edit size={14} />
                        </button>
                        <div className={`${viewMode === 'gallery' ? 'aspect-square' : 'aspect-[3/4]'} bg-slate-100 relative overflow-hidden`}>
                            <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-slate-700 shadow-sm">
                            {product.sku}
                            </div>
                        </div>
                        <div className="p-4 space-y-2 flex-1 flex flex-col">
                            <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{product.brand}</span>
                                <h3 className="font-bold text-slate-800 text-sm leading-tight mt-0.5 line-clamp-2">{product.name}</h3>
                            </div>
                            {viewMode !== 'gallery' && (
                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2">{product.category}</span>
                            )}
                            </div>
                            
                            {viewMode !== 'gallery' && (
                                <div className="flex items-center gap-2 pt-2 flex-wrap">
                                {product.variants.slice(0, 4).map(v => (
                                    <span key={v} className="min-w-[1.5rem] h-6 px-1 flex items-center justify-center rounded border border-slate-200 text-xs text-slate-500 bg-slate-50">
                                    {v}
                                    </span>
                                ))}
                                {product.variants.length > 4 && <span className="text-xs text-slate-400">+{product.variants.length - 4}</span>}
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-3 border-t border-slate-50 mt-auto">
                            {viewMode !== 'gallery' && (
                                <div className="text-xs text-slate-500">
                                    Cost: <span className="font-medium text-slate-700">{formatCurrency(product.cost)}</span>
                                </div>
                            )}
                            <div className={`text-sm font-bold text-slate-900 ${viewMode === 'gallery' ? 'w-full text-right' : ''}`}>
                                {formatCurrency(product.price)}
                            </div>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            )}

            {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400">
                No products found matching filters.
                </div>
            )}
        </>
      )}

      {/* === VIEW: STOCK POSITION === */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Store Outlet</th>
                  <th className="px-6 py-4 text-right">Total Units</th>
                  <th className="px-6 py-4 text-right">Total Value (Cost)</th>
                  <th className="px-6 py-4 text-right">Avg Unit Cost</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockByStore
                  .filter(s => s.storeName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(store => (
                  <tr key={store.storeName} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                      <Layers size={16} className="text-indigo-600" />
                      {store.storeName}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {store.count.toLocaleString()} pcs
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-medium font-mono">
                      {formatCurrency(store.value)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">
                      {formatCurrency(store.value / (store.count || 1))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        type="button"
                        onClick={(e) => {
                             e.stopPropagation();
                             setViewingStoreItems({ name: store.storeName, items: store.items });
                        }}
                        className="text-indigo-600 hover:text-indigo-900 text-xs font-bold px-3 py-1 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stockByStore.length === 0 && (
             <div className="p-12 text-center text-slate-400">No inventory data available.</div>
          )}
        </div>
      )}

      {/* === VIEW: ANALYTICS === */}
      {activeTab === 'analytics' && (
         <ProductAnalytics movements={movements} products={products} />
      )}

      {/* Product Form Modal */}
      <ProductForm 
         isOpen={isProductFormOpen}
         onClose={() => setIsProductFormOpen(false)}
         onSave={editingProduct ? onUpdateProduct : onAddProduct}
         productToEdit={editingProduct}
         inventory={inventory} // PASSING INVENTORY
         stores={stores} // PASSING STORES
      />

      {/* Product Detail Modal */}
      <ProductDetailModal 
        isOpen={!!viewingProductDetail}
        product={viewingProductDetail}
        onClose={() => setViewingProductDetail(null)}
        inventory={inventory}
        onEdit={(p) => {
           setViewingProductDetail(null);
           handleEditProduct(p);
        }}
      />

      <StoreStockModal
        isOpen={!!viewingStoreItems}
        storeName={viewingStoreItems?.name || null}
        items={viewingStoreItems?.items || []}
        onClose={() => setViewingStoreItems(null)}
        onViewProduct={handleViewProductBySKU}
        products={products}
      />
      
      {/* Transaction Modal (Transfer) */}
      <TransactionFormModal 
         isOpen={isTransactionModalOpen}
         onClose={() => setIsTransactionModalOpen(false)}
         stores={stores}
         products={products}
         onSubmit={onRecordTransaction}
         onTransfer={handleTransferSubmit}
      />

    </div>
  );
};