
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
  storeId: string;
  storeName: string;
  brand: string; // NEW: Split AR by brand
  amount: number;
  paidAmount: number; 
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Partial';
  payments: PaymentRecord[]; 
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
