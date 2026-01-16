
import { SaleRecord, ForecastRecord, AggregatedData, StoreProfile, Product, InventoryItem, Invoice, StockMovement, Supplier, VendorBill, Expense } from '../types';
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

// Reduced STORE_COUNT to prevent QuotaExceededError
export const generateMockStores = (): StoreProfile[] => {
  const stores: StoreProfile[] = [];
  const STORE_COUNT = 45; // Reduced from 170
  const types = ['Department Store', 'Plaza', 'Mart', 'Gallery', 'Boutique', 'Outlet'];

  for (let i = 1; i <= STORE_COUNT; i++) {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const cities = CITIES_BY_REGION[region];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const group = RETAIL_GROUPS[Math.floor(Math.random() * RETAIL_GROUPS.length)];
    
    const assignedBrands: string[] = [];
    const shuffledBrands = [...SAMPLE_BRANDS].sort(() => Math.random() - 0.5);
    assignedBrands.push(shuffledBrands[0]);
    if (Math.random() > 0.4) assignedBrands.push(shuffledBrands[1]);
    
    const margins: Record<string, number> = {};
    assignedBrands.forEach(b => {
      margins[b] = 20 + Math.floor(Math.random() * 16); 
    });

    const term = CREDIT_TERMS[Math.floor(Math.random() * CREDIT_TERMS.length)];
    
    stores.push({
      id: `store-${i}`,
      name: `${group} ${city} ${type} #${i}`,
      group,
      region,
      city,
      state: region,
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

export const generateMockHistory = (stores: StoreProfile[]): SaleRecord[] => {
  const records: SaleRecord[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const startYear = currentYear - 2;

  stores.forEach(store => {
    store.carriedBrands.forEach(brand => {
      let baseVal = 4000 + Math.random() * 4000;
      if (brand === 'Domino') baseVal *= 1.2; 
      if (brand === "O'Dear") baseVal *= 0.8; 

      for (let y = startYear; y < currentYear; y++) {
        for (let m = 0; m < 12; m++) {
          const date = new Date(y, m, 1);
          let seasonality = 1.0;
          if (m === 11 || m === 10) seasonality = 1.4; 
          if (m === 0) seasonality = 0.9; 

          const randomFactor = 0.9 + Math.random() * 0.2; 
          records.push({
            id: `${brand}-${store.id}-${y}-${m}`,
            date: date.toISOString().split('T')[0],
            brand,
            counter: store.name, 
            amount: Math.floor(baseVal * seasonality * randomFactor)
          });
        }
      }
    });
  });

  return records;
};

export const generateMockSuppliers = (): Supplier[] => {
  const names = ['FabriCo Ltd', 'Textile Giants', 'Global Sourcing', 'Elite Garments'];
  return names.map((name, i) => ({
    id: `sup-${i + 1}`,
    name,
    contactPerson: `Manager ${String.fromCharCode(65 + i)}`,
    email: `contact@${name.replace(/ /g, '').toLowerCase()}.com`,
    phone: `+60 3-${Math.floor(Math.random() * 8999) + 1000}`,
    paymentTerms: [30, 45, 60][Math.floor(Math.random() * 3)],
    leadTime: [7, 14, 21][Math.floor(Math.random() * 3)],
    address: `Industrial Park Zone ${i + 1}, Kuala Lumpur`
  }));
};

export const generateMockBills = (suppliers: Supplier[]): VendorBill[] => {
  const bills: VendorBill[] = [];
  const today = new Date();
  suppliers.forEach(sup => {
    const count = 2;
    for(let i=0; i<count; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const billDate = new Date(today.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const dueDate = new Date(billDate);
      dueDate.setDate(dueDate.getDate() + sup.paymentTerms);
      const amount = 8000 + Math.floor(Math.random() * 10000);
      bills.push({
        id: `bill-${sup.id}-${i}`,
        supplierId: sup.id,
        supplierName: sup.name,
        billDate: billDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        amount,
        paidAmount: Math.random() > 0.5 ? amount : 0,
        status: Math.random() > 0.5 ? 'Paid' : 'Unpaid',
        reference: `INV-${sup.name.substring(0,3).toUpperCase()}-${1000+i}`,
        category: 'COGS'
      });
    }
  });
  return bills;
};

export const generateMockExpenses = (stores: StoreProfile[]): Expense[] => {
  const expenses: Expense[] = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const corpExpenses = [
    { cat: 'Salaries', amount: 50000, desc: 'HQ Payroll' },
    { cat: 'Rent', amount: 10000, desc: 'HQ Office' },
    { cat: 'Marketing', amount: 15000, desc: 'Social Ads' }
  ];
  for(let i=0; i<2; i++) {
    const d = new Date(currentYear, currentMonth - i, 1);
    corpExpenses.forEach((exp, idx) => {
      expenses.push({
        id: `exp-hq-${i}-${idx}`,
        date: d.toISOString().split('T')[0],
        category: exp.cat as any,
        description: exp.desc,
        amount: exp.amount,
        isRecurring: true
      });
    });
  }
  return expenses;
};

export const generateMockProducts = (suppliers: Supplier[] = []): Product[] => {
  const products: Product[] = [];
  let idCounter = 1;
  const COLORS = ['Red', 'Black', 'White', 'Navy'];
  const SIZES = ['S', 'M', 'L'];
  SAMPLE_BRANDS.forEach(brand => {
    const categories = PRODUCT_CATEGORIES[brand as keyof typeof PRODUCT_CATEGORIES] || [];
    categories.slice(0, 3).forEach(cat => {
      for (let i = 1; i <= 3; i++) {
        const cost = 20 + Math.random() * 40;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        products.push({
          id: `p-${idCounter}`,
          sku: `${brand.substring(0,3).toUpperCase()}-${cat.substring(0,3).toUpperCase()}-00${i}`,
          name: `${brand} ${cat} Style #${i}`,
          brand,
          category: cat,
          subCategory: 'General',
          cost: Math.floor(cost * 100) / 100,
          price: Math.floor(cost * 2.5 * 100) / 100,
          imageUrl: `https://placehold.co/400x500/f1f5f9/475569?text=${brand}+${cat}`,
          variants: SIZES.map(s => `${color}-${s}`),
          supplierId: suppliers[0]?.id,
          supplierName: suppliers[0]?.name,
          inventoryPlanning: { reorderPoint: 10, safetyStock: 5 }
        });
        idCounter++;
      }
    });
  });
  return products;
};

export const generateMockInventory = (stores: StoreProfile[], products: Product[]): InventoryItem[] => {
  const inventory: InventoryItem[] = [];
  stores.forEach(store => {
    store.carriedBrands.forEach(brand => {
      const brandProducts = products.filter(p => p.brand === brand);
      brandProducts.slice(0, 5).forEach(prod => {
        const totalQty = 10 + Math.floor(Math.random() * 30);
        inventory.push({
          id: `inv-${store.id}-${prod.id}`,
          storeId: store.id,
          storeName: store.name,
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          brand: prod.brand,
          quantity: totalQty,
          variantQuantities: { [prod.variants[0]]: totalQty }
        });
      });
    });
  });
  return inventory;
};

export const generateMockStockMovements = (inventory: InventoryItem[], products: Product[]): StockMovement[] => {
  const movements: StockMovement[] = [];
  inventory.slice(0, 50).forEach(inv => {
    movements.push({
       id: `mov-restock-${inv.id}`,
       date: '2023-11-01',
       type: 'Restock',
       storeId: inv.storeId,
       storeName: inv.storeName,
       productId: inv.productId,
       productName: inv.productName,
       sku: inv.sku,
       variant: 'Standard',
       quantity: inv.quantity,
       reference: 'PO-INITIAL'
    });
  });
  return movements;
};

export const generateMockInvoices = (stores: StoreProfile[]): Invoice[] => {
  const invoices: Invoice[] = [];
  const today = new Date();
  stores.slice(0, 20).forEach(store => {
      const brand = store.carriedBrands[0];
      const amount = 5000 + Math.floor(Math.random() * 5000);
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + store.creditTerm);
      invoices.push({
        id: `inv-${store.id}-1`,
        storeId: store.id,
        storeName: store.name,
        brand,
        amount,
        paidAmount: 0,
        issueDate: today.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'Unpaid',
        payments: []
      });
  });
  return invoices;
};

export const aggregateByTime = (data: (SaleRecord | ForecastRecord)[], segmentBy: 'brand' | 'counter') => {
  const agg: Record<string, AggregatedData> = {};
  data.forEach(d => {
    let timeKey: string;
    let amount: number;
    let segmentKey: string;
    if ('date' in d) {
      timeKey = d.date.substring(0, 7);
      amount = d.amount;
      segmentKey = segmentBy === 'brand' ? d.brand : d.counter;
    } else {
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
