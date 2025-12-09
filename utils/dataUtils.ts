
import { SaleRecord, ForecastRecord, AggregatedData, StoreProfile, Product, InventoryItem, Invoice, StockMovement, Supplier } from '../types';
import { SAMPLE_BRANDS, PRODUCT_CATEGORIES, CREDIT_TERMS } from '../constants';

const RETAIL_GROUPS = ['Central Group', 'The Mall Group', 'Aeon', 'Robinson', 'Siam Piwat', 'Independent'];
const REGIONS = ['North', 'North-East', 'Central', 'South', 'East'];
const CITIES_BY_REGION: Record<string, string[]> = {
  'North': ['Chiang Mai', 'Chiang Rai', 'Lampang'],
  'North-East': ['Khon Kaen', 'Udon Thani', 'Korat'],
  'Central': ['Bangkok', 'Ayutthaya', 'Nonthaburi', 'Samut Prakan'],
  'South': ['Phuket', 'Hat Yai', 'Surat Thani'],
  'East': ['Pattaya', 'Chonburi', 'Rayong']
};

// Generate 170 distinct stores with rich metadata
export const generateMockStores = (): StoreProfile[] => {
  const stores: StoreProfile[] = [];
  const STORE_COUNT = 170;
  const types = ['Department Store', 'Plaza', 'Mart', 'Gallery', 'Boutique', 'Outlet'];

  for (let i = 1; i <= STORE_COUNT; i++) {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const cities = CITIES_BY_REGION[region];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const group = RETAIL_GROUPS[Math.floor(Math.random() * RETAIL_GROUPS.length)];
    
    // Assign Brands (Logic: Some have 1, some 2, some 3)
    const assignedBrands: string[] = [];
    const shuffledBrands = [...SAMPLE_BRANDS].sort(() => Math.random() - 0.5);
    
    // Ensure at least one brand
    assignedBrands.push(shuffledBrands[0]);
    
    // Chance for 2nd brand (70%)
    if (Math.random() > 0.3) assignedBrands.push(shuffledBrands[1]);
    
    // Chance for 3rd brand (40% if already has 2)
    if (assignedBrands.length === 2 && Math.random() > 0.6) assignedBrands.push(shuffledBrands[2]);
    
    // Assign Margins
    const margins: Record<string, number> = {};
    assignedBrands.forEach(b => {
      // Random margin between 20% and 35%
      margins[b] = 20 + Math.floor(Math.random() * 16); 
    });

    // Credit Terms
    const term = CREDIT_TERMS[Math.floor(Math.random() * CREDIT_TERMS.length)];
    
    stores.push({
      id: `store-${i}`,
      name: `${group} ${city} ${type} #${i}`,
      group,
      region,
      city,
      state: region, // Simplifying state to match region for mock
      address: `${Math.floor(Math.random() * 999) + 1} Main Street, District ${Math.floor(Math.random() * 20) + 1}`,
      postalCode: `${Math.floor(10000 + Math.random() * 90000)}`,
      carriedBrands: assignedBrands.sort(),
      margins,
      creditTerm: term,
      riskStatus: Math.random() > 0.9 ? 'High' : (Math.random() > 0.7 ? 'Medium' : 'Low')
    });
  }
  return stores;
};

// Generate Sales History BASED ON the generated stores
export const generateMockHistory = (stores: StoreProfile[]): SaleRecord[] => {
  const records: SaleRecord[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const startYear = currentYear - 2;

  stores.forEach(store => {
    store.carriedBrands.forEach(brand => {
      // Base monthly average logic
      let baseVal = 3000 + Math.random() * 5000;
      
      if (brand === 'Domino') baseVal *= 1.2; 
      if (brand === "O'Dear") baseVal *= 0.8; 

      for (let y = startYear; y < currentYear; y++) {
        for (let m = 0; m < 12; m++) {
          const date = new Date(y, m, 1);
          
          let seasonality = 1.0;
          if (m === 11 || m === 10) seasonality = 1.5; 
          if (m === 0) seasonality = 0.9; 
          if (brand === "O'Dear" && (m === 7 || m === 8)) seasonality *= 1.3; 

          const randomFactor = 0.85 + Math.random() * 0.3; 
          const amount = Math.floor(baseVal * seasonality * randomFactor);
          
          records.push({
            id: `${brand}-${store.id}-${y}-${m}`,
            date: date.toISOString().split('T')[0],
            brand,
            counter: store.name, 
            amount
          });
        }
      }
    });
  });

  return records;
};

// NEW: Generate Suppliers
export const generateMockSuppliers = (): Supplier[] => {
  const names = ['FabriCo Ltd', 'Textile Giants', 'Global Sourcing Partners', 'Elite Garments', 'Local Threads Inc', 'Vogue Manufacturing'];
  return names.map((name, i) => ({
    id: `sup-${i + 1}`,
    name,
    contactPerson: `Manager ${String.fromCharCode(65 + i)}`,
    email: `contact@${name.replace(/ /g, '').toLowerCase()}.com`,
    phone: `+60 3-${Math.floor(Math.random() * 8999) + 1000}`,
    paymentTerms: [30, 45, 60][Math.floor(Math.random() * 3)],
    leadTime: [7, 14, 21, 30][Math.floor(Math.random() * 4)],
    address: `Industrial Park Zone ${i + 1}, Kuala Lumpur`
  }));
};

// NEW: Generate Product Catalog with Attributes
export const generateMockProducts = (suppliers: Supplier[] = []): Product[] => {
  const products: Product[] = [];
  let idCounter = 1;

  const COLORS = ['Red', 'Blue', 'Black', 'White', 'Beige', 'Navy', 'Olive'];
  const SIZES = ['S', 'M', 'L', 'XL'];
  const FABRICS = ['Cotton', 'Polyester', 'Linen', 'Denim', 'Silk Blend'];
  const NECKLINES = ['Crew', 'V-Neck', 'Collared', 'Boat'];
  const FITS = ['Slim', 'Regular', 'Oversized'];

  SAMPLE_BRANDS.forEach(brand => {
    const categories = PRODUCT_CATEGORIES[brand as keyof typeof PRODUCT_CATEGORIES] || [];
    categories.forEach(cat => {
      // Generate 5 products per category
      for (let i = 1; i <= 5; i++) {
        const cost = 20 + Math.random() * 80;
        const price = cost * (2 + Math.random());
        
        // Generate Variants (Color + Size combinations)
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const variants = SIZES.map(s => `${color}-${s}`);
        
        const supplier = suppliers.length > 0 ? suppliers[Math.floor(Math.random() * suppliers.length)] : undefined;

        products.push({
          id: `p-${idCounter}`,
          sku: `${brand.substring(0,3).toUpperCase()}-${cat.substring(0,3).toUpperCase()}-00${i}`,
          name: `${brand} ${cat} Style #${i} (${color})`,
          brand,
          category: cat,
          subCategory: 'General',
          cost: Math.floor(cost * 100) / 100,
          price: Math.floor(price * 100) / 100,
          imageUrl: `https://placehold.co/400x500/f1f5f9/475569?text=${brand}+${cat}+${i}`,
          variants: variants,
          supplierId: supplier?.id,
          supplierName: supplier?.name,
          attributes: {
            fabric: FABRICS[Math.floor(Math.random() * FABRICS.length)],
            neckline: NECKLINES[Math.floor(Math.random() * NECKLINES.length)],
            fit: FITS[Math.floor(Math.random() * FITS.length)],
            gender: brand === 'Domino' ? 'Men' : brand === 'OTTO' ? 'Women' : 'Kids',
            season: Math.random() > 0.5 ? 'SS24' : 'FW24'
          },
          inventoryPlanning: {
            reorderPoint: Math.floor(Math.random() * 20) + 5,
            safetyStock: Math.floor(Math.random() * 10) + 2
          }
        });
        idCounter++;
      }
    });
  });
  return products;
};

// NEW: Generate Inventory Levels for Stores
export const generateMockInventory = (stores: StoreProfile[], products: Product[]): InventoryItem[] => {
  const inventory: InventoryItem[] = [];
  
  stores.forEach(store => {
    store.carriedBrands.forEach(brand => {
      // Find products for this brand
      const brandProducts = products.filter(p => p.brand === brand);
      
      // Randomly select some products to be in stock (80% of catalog)
      brandProducts.forEach(prod => {
        if (Math.random() > 0.2) {
          const totalQty = Math.floor(Math.random() * 50); // 0 to 50 units
          
          // Distribute quantity across variants
          const variantQuantities: Record<string, number> = {};
          if (totalQty > 0 && prod.variants.length > 0) {
            let remaining = totalQty;
            prod.variants.forEach((v, index) => {
              if (index === prod.variants.length - 1) {
                variantQuantities[v] = remaining;
              } else {
                const qty = Math.floor(Math.random() * (remaining + 1));
                variantQuantities[v] = qty;
                remaining -= qty;
              }
            });
          } else if (totalQty > 0) {
             variantQuantities['Standard'] = totalQty;
          }

          inventory.push({
            id: `inv-${store.id}-${prod.id}`,
            storeId: store.id,
            storeName: store.name,
            productId: prod.id,
            sku: prod.sku,
            productName: prod.name,
            brand: prod.brand,
            quantity: totalQty,
            variantQuantities
          });
        }
      });
    });
  });
  return inventory;
};

// NEW: Generate Stock Movement Log
export const generateMockStockMovements = (inventory: InventoryItem[], products: Product[]): StockMovement[] => {
  const movements: StockMovement[] = [];
  const today = new Date();

  // Create random movements for the last 30 days
  inventory.forEach(inv => {
    // 1. Initial Restock (30 days ago)
    movements.push({
       id: `mov-restock-${inv.id}`,
       date: new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
       type: 'Restock',
       storeId: inv.storeId,
       storeName: inv.storeName,
       productId: inv.productId,
       productName: inv.productName,
       sku: inv.sku,
       variant: 'Multiple',
       quantity: inv.quantity + Math.floor(Math.random() * 10), // Was slightly higher before sales
       reference: 'PO-BATCH-01'
    });

    // 2. Simulate random sales transactions over the last month
    const salesCount = Math.floor(Math.random() * 5);
    for(let i=0; i<salesCount; i++) {
       const daysAgo = Math.floor(Math.random() * 25);
       const qtySold = Math.floor(Math.random() * 2) + 1;
       const variant = Object.keys(inv.variantQuantities)[0] || 'Standard'; // Simplified

       movements.push({
         id: `mov-sale-${inv.id}-${i}`,
         date: new Date(today.getTime() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
         type: 'Sale',
         storeId: inv.storeId,
         storeName: inv.storeName,
         productId: inv.productId,
         productName: inv.productName,
         sku: inv.sku,
         variant: variant,
         quantity: -qtySold,
         reference: `POS-${Math.floor(Math.random() * 10000)}`
       });
    }

    // 3. Occasional Transfer Out (5% chance)
    if(Math.random() > 0.95) {
       movements.push({
         id: `mov-transfer-${inv.id}`,
         date: new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
         type: 'Transfer Out',
         storeId: inv.storeId,
         storeName: inv.storeName,
         productId: inv.productId,
         productName: inv.productName,
         sku: inv.sku,
         variant: 'Standard',
         quantity: -5,
         reference: 'TR-AUTO'
       });
    }
  });

  return movements.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate AR Invoices from Stores
export const generateMockInvoices = (stores: StoreProfile[]): Invoice[] => {
  const invoices: Invoice[] = [];
  const today = new Date();

  stores.forEach(store => {
    // Generate 1-3 open invoices per store
    const count = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 60) + 10;
      const issueDate = new Date(today.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + store.creditTerm);
      
      const brand = store.carriedBrands[i % store.carriedBrands.length];
      const amount = 5000 + Math.floor(Math.random() * 15000);
      
      // Random payment status
      const paid = Math.random() > 0.5 ? 0 : amount * (Math.random() * 0.8);
      const status = paid >= amount ? 'Paid' : paid > 0 ? 'Partial' : (dueDate < today ? 'Overdue' : 'Unpaid');

      if (status !== 'Paid') {
        invoices.push({
          id: `inv-${store.id}-${i}`,
          storeId: store.id,
          storeName: store.name,
          brand,
          amount,
          paidAmount: paid,
          issueDate: issueDate.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          status,
          payments: paid > 0 ? [{
             id: `pay-${store.id}-${i}`,
             date: new Date(issueDate.getTime() + (10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
             amount: paid,
             method: 'Bank Transfer',
             reference: 'TRX-999'
          }] : []
        });
      }
    }
  });
  return invoices;
};

// Basic aggregation
export const aggregateByTime = (data: (SaleRecord | ForecastRecord)[], segmentBy: 'brand' | 'counter') => {
  const agg: Record<string, AggregatedData> = {};
  
  data.forEach(d => {
    let timeKey: string;
    let amount: number;
    let segmentKey: string;

    if ('date' in d) {
      // SaleRecord
      timeKey = d.date.substring(0, 7); // YYYY-MM
      amount = d.amount;
      segmentKey = segmentBy === 'brand' ? d.brand : d.counter;
    } else {
      // ForecastRecord
      timeKey = d.month;
      amount = d.forecastAmount;
      segmentKey = segmentBy === 'brand' ? d.brand : d.counter;
    }

    if (!agg[timeKey]) agg[timeKey] = { name: timeKey };
    agg[timeKey][segmentKey] = ((agg[timeKey][segmentKey] as number) || 0) + amount;
  });

  return Object.values(agg).sort((a, b) => a.name.localeCompare(b.name));
};

export const getMonthlyHistory = (history: SaleRecord[], brand: string, counter: string, year: number, month: number) => {
  return history
    .filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && 
             d.getMonth() + 1 === month && 
             (brand === 'All' || r.brand === brand) && 
             (counter === 'All' || r.counter === counter);
    })
    .reduce((sum, r) => sum + r.amount, 0);
};

export const aggregateSalesByDimension = (history: SaleRecord[], stores: StoreProfile[], dimension: 'region' | 'group') => {
  const storeMap = new Map<string, StoreProfile>(stores.map(s => [s.name, s] as [string, StoreProfile]));
  const agg: Record<string, number> = {};

  history.forEach(r => {
    const store = storeMap.get(r.counter);
    if (store) {
      const key = store[dimension];
      agg[key] = (agg[key] || 0) + r.amount;
    }
  });

  return Object.entries(agg)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
