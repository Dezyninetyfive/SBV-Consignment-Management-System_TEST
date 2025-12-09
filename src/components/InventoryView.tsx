import React, { useState } from 'react';
import { InventoryItem, Product, StoreProfile, StockMovement, MovementType } from '../types';
import { ProductAnalytics } from './ProductAnalytics';
import { TransactionFormModal } from './TransactionFormModal';
import { ProductDetailModal } from './ProductDetailModal';
import { StoreStockModal } from './StoreStockModal';
import { ArrowRightLeft, Package, MapPin } from 'lucide-react';

interface Props {
  inventory: InventoryItem[];
  products: Product[];
  stores: StoreProfile[];
  movements: StockMovement[];
  onRecordTransaction: (data: { date: string, type: MovementType, storeId: string, productId: string, variant: string, quantity: number, reference: string }) => void;
}

export const InventoryView: React.FC<Props> = ({ inventory, products, stores, movements, onRecordTransaction }) => {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStoreStock, setSelectedStoreStock] = useState<{name: string, items: InventoryItem[]} | null>(null);

  const handleTransferSubmit = (data: { date: string, fromStoreId: string, toStoreId: string, productId: string, variant: string, quantity: number, reference: string }) => {
     // 1. Transfer Out
     onRecordTransaction({
        date: data.date,
        type: 'Transfer Out',
        storeId: data.fromStoreId,
        productId: data.productId,
        variant: data.variant,
        quantity: -data.quantity,
        reference: data.reference
     });
     // 2. Transfer In
     onRecordTransaction({
        date: data.date,
        type: 'Transfer In',
        storeId: data.toStoreId,
        productId: data.productId,
        variant: data.variant,
        quantity: data.quantity,
        reference: data.reference
     });
  };

  const openStoreStock = (storeId: string) => {
     const store = stores.find(s => s.id === storeId);
     const items = inventory.filter(i => i.storeId === storeId && i.quantity > 0);
     if (store) {
        setSelectedStoreStock({ name: store.name, items });
     }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-indigo-600" /> Inventory & Stock
             </h2>
             <p className="text-slate-500">Track stock levels, analyze movement, and manage transfers.</p>
          </div>
          <button 
             onClick={() => setIsTransactionModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors"
          >
             <ArrowRightLeft size={18} /> New Transfer / Adjustment
          </button>
       </div>

       <ProductAnalytics movements={movements} products={products} />

       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <MapPin className="text-emerald-600" /> Stock by Store
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {stores.map(store => {
                const itemCount = inventory.filter(i => i.storeId === store.id && i.quantity > 0).length;
                const totalQty = inventory.filter(i => i.storeId === store.id).reduce((acc, i) => acc + i.quantity, 0);
                
                return (
                   <div 
                      key={store.id} 
                      onClick={() => openStoreStock(store.id)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all bg-slate-50 hover:bg-white group"
                   >
                      <div className="flex justify-between items-start mb-2">
                         <h4 className="font-bold text-slate-700 line-clamp-1 group-hover:text-indigo-600">{store.name}</h4>
                         <span className="text-[10px] font-bold uppercase text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {store.group}
                         </span>
                      </div>
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-xs text-slate-500">Products</p>
                            <p className="font-mono font-bold text-slate-800">{itemCount}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs text-slate-500">Total Units</p>
                            <p className="font-mono font-bold text-emerald-600">{totalQty}</p>
                         </div>
                      </div>
                   </div>
                );
             })}
          </div>
       </div>

       {/* Modals */}
       <TransactionFormModal 
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          stores={stores}
          products={products}
          inventory={inventory}
          onSubmit={onRecordTransaction}
          onTransfer={handleTransferSubmit}
       />

       <ProductDetailModal 
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          inventory={inventory}
          onEdit={() => {}} // Placeholder
       />

       <StoreStockModal 
          isOpen={!!selectedStoreStock}
          onClose={() => setSelectedStoreStock(null)}
          storeName={selectedStoreStock?.name || null}
          items={selectedStoreStock?.items || []}
          products={products}
          onViewProduct={(sku) => {
             const p = products.find(prod => prod.sku === sku);
             if (p) setSelectedProduct(p);
          }}
       />
    </div>
  );
};