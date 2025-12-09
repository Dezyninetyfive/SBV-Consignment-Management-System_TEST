
export interface StoreProfile {
  id: string;
  name: string;
  group: string; // e.g., "Central Group", "Aeon"
  address: string;
  city: string;
  state: string;
  region: string;
  postalCode: string;
  carriedBrands: string[]; // List of brands this store carries
  margins: Record<string, number>; // NEW: Commission % per brand (e.g. {'Domino': 25})
  creditTerm: number; // days, e.g. 30, 45, 60
  riskStatus: 'Low' | 'Medium' | 'High';
}

export interface SaleRecord {
  id: string;
  date: string; // YYYY-MM-DD
  brand: string;
  counter: string; // This corresponds to StoreProfile.name
  amount: number;
}

export interface ForecastRecord {
  month: string; // YYYY-MM
  brand: string;
  counter: string;
  forecastAmount: number;
  rationale?: string;
}

export interface ForecastResponse {
  forecasts: ForecastRecord[];
  summary: string;
}

export type AggregatedData = {
  name: string; // Date or Category
  [key: string]: number | string;
};

export interface PlanningConfig {
  targets: Record<string, number>; // Key: "YYYY-MM|Brand|Counter" -> Amount
  margins: Record<string, number>; // Key: "Brand" -> Percentage (0-100)
  targetStockCover: Record<string, number>; // Key: "Brand|Counter" -> Months of cover
}

// --- NEW ENTITIES FOR ERP ---

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentTerms: number; // days
  leadTime: number; // days
  address: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  cost: number;
  price: number;
  imageUrl: string;
  variants: string[]; // e.g. ["S", "M", "L"] or ["Red", "Blue"]
  // New Extended Attributes
  supplierId?: string;
  supplierName?: string;
  attributes?: {
    fabric?: string;
    neckline?: string;
    fit?: string;
    sleeve?: string;
    gender?: 'Men' | 'Women' | 'Kids' | 'Unisex';
    season?: string;
  };
  inventoryPlanning?: {
    reorderPoint: number;
    safetyStock: number;
    markdownPrice?: number;
  };
}

export interface InventoryItem {
  id: string;
  storeId: string;
  storeName: string;
  productId: string;
  sku: string;
  productName: string;
  brand: string;
  quantity: number;
  variantQuantities: Record<string, number>; // NEW: Track specific quantity per variant
}

export type MovementType = 'Sale' | 'Restock' | 'Transfer In' | 'Transfer Out' | 'Adjustment' | 'Return';

export interface StockMovement {
  id: string;
  date: string;
  type: MovementType;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  sku: string;
  variant: string; // "Standard" or "Red-S"
  quantity: number; // Positive (In) or Negative (Out)
  reference?: string;
  linkedInvoiceId?: string; // Link to credit note if return or invoice if sale
  linkedSaleId?: string;    // Link to Sales Record if sale
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: string; // 'Bank Transfer', 'Cheque', 'Cash'
  reference: string;
}

export interface Invoice {
  id: string;
  type?: 'Invoice' | 'Credit Note'; // Support for Returns
  storeId: string;
  storeName: string;
  brand: string; // NEW: Split AR by brand
  amount: number; // Negative for Credit Notes
  paidAmount: number; 
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Partial';
  payments: PaymentRecord[]; 
  linkedReference?: string; // Link to Stock Movement Ref
}

export interface StockTransfer {
  id: string;
  date: string;
  fromStoreId: string;
  toStoreId: string;
  productId: string;
  quantity: number;
  status: 'Completed' | 'Pending';
}

export interface StockPlanning {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  totalStock: number;
  avgMonthlySales: number;
  safetyStock: number;
  reorderPoint: number;
  suggestedOrder: number;
  status: 'OK' | 'Reorder' | 'Overstock' | 'Critical';
}
