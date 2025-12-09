



export const SAMPLE_BRANDS = ['Domino', 'OTTO', "O'Dear"];

// We will generate 170 store names programmatically in dataUtils, 
// but we keep a few named ones here for default UI states or fallbacks.
export const SAMPLE_COUNTERS = [
  'Central Dept Store',
  'MegaMart City',
  'Grand Plaza',
  'Airport Duty Free',
  'Westside Mall',
  'North Point Gallery',
  'Union Square Outlet'
];

export const CHART_COLORS = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
  '#84CC16', // Lime
];

export const AI_MODEL_FORECAST = 'gemini-3-pro-preview';

export const CSV_TEMPLATES = {
  SALES: `Date,Brand,Counter,Amount
2023-01-15,Domino,Central Plaza,15000
2023-01-16,OTTO,MegaMart,12500`,
  STORES: `Name,Group,City,Region,Brands
Central Plaza,Central Group,Bangkok,Central,Domino|OTTO
MegaMart,Aeon,Chiang Mai,North,O'Dear`,
  PRODUCTS: `SKU,Name,Brand,Category,Cost,Price,Variants
DOM-SH-001,Slim Cotton Shirt,Domino,Shirts,25.00,59.00,S|M|L
OTT-DR-005,Floral Summer Dress,OTTO,Dresses,35.00,89.00,S|M`,
  INVENTORY: `StoreName,SKU,Quantity
Central Plaza,DOM-SH-001,25
MegaMart,OTT-DR-005,10`,
  INVOICES: `StoreName,Brand,Amount,DueDate
Central Plaza,Domino,5000,2023-12-31
MegaMart,OTTO,1200,2023-11-30`,
  STOCK_MOVEMENTS: `Date,Type,StoreName,SKU,Variant,Quantity,Reference
2023-10-01,Restock,Central Plaza,DOM-SH-001,S,50,PO-1001
2023-10-05,Sale,Central Plaza,DOM-SH-001,S,-1,POS-123
2023-10-06,Transfer Out,Central Plaza,DOM-SH-001,S,-5,TR-To-MegaMart`
};

export const PRODUCT_CATEGORIES = {
  Domino: ['Shirts', 'Trousers', 'Jackets', 'Accessories'],
  OTTO: ['Dresses', 'Blouses', 'Skirts', 'Outerwear'],
  "O'Dear": ['Tops', 'Bottoms', 'Sets', 'Shoes']
};

export const CREDIT_TERMS = [30, 45, 60, 90];

export const PAYMENT_METHODS = ['Bank Transfer', 'Cheque', 'Credit Note', 'Cash'];