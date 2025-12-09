

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SaleRecord, ForecastResponse, ForecastRecord } from '../types';
import { AI_MODEL_FORECAST } from '../constants';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// We ask the AI only for BRAND level forecasts to save tokens and improve reasoning quality
const brandForecastSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    brandForecasts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          brand: { type: Type.STRING },
          monthlyPredictions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.INTEGER, description: "1-12" },
                forecastAmount: { type: Type.NUMBER },
                rationale: { type: Type.STRING }
              },
              required: ["month", "forecastAmount"]
            }
          }
        },
        required: ["brand", "monthlyPredictions"]
      }
    },
    summary: {
      type: Type.STRING,
      description: "Executive summary of the yearly outlook across the 3 brands, identifying key growth drivers."
    }
  },
  required: ["brandForecasts", "summary"]
};

// Internal helper to calculate market share based on RECENT performance (Last 12 Months)
const calculateRecentShares = (history: SaleRecord[]) => {
  const shares: Record<string, Record<string, number>> = {};
  
  // 1. Determine Cutoff for "Recent" (Last 12 Months)
  const dates = history.map(r => new Date(r.date).getTime());
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
  
  const cutoffDate = new Date(maxDate);
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
  const cutoffString = cutoffDate.toISOString().split('T')[0];

  // 2. Filter for LTM (Last Twelve Months)
  const recentHistory = history.filter(r => r.date >= cutoffString);
  // Fallback: If no recent data (e.g. gap in records), use full history to avoid 0 forecast
  const dataToUse = recentHistory.length > 0 ? recentHistory : history;

  // 3. Aggregate Totals
  const brandTotals: Record<string, number> = {};
  const counterTotals: Record<string, Record<string, number>> = {}; 

  dataToUse.forEach(r => {
    brandTotals[r.brand] = (brandTotals[r.brand] || 0) + r.amount;
    if (!counterTotals[r.brand]) counterTotals[r.brand] = {};
    counterTotals[r.brand][r.counter] = (counterTotals[r.brand][r.counter] || 0) + r.amount;
  });

  // 4. Calculate Percentage Share
  Object.keys(counterTotals).forEach(brand => {
    shares[brand] = {};
    const total = brandTotals[brand];
    if (total > 0) {
      Object.keys(counterTotals[brand]).forEach(counter => {
        shares[brand][counter] = counterTotals[brand][counter] / total;
      });
    }
  });

  return shares;
};

// Local forecasting logic (Statistical fallback)
const generateLocalBrandForecasts = (history: SaleRecord[], targetYear: number) => {
  const brandSeasonality: Record<string, Record<number, number[]>> = {};

  // Group history by Brand and Month
  history.forEach(r => {
    const d = new Date(r.date);
    const m = d.getMonth(); // 0-11
    if (!brandSeasonality[r.brand]) brandSeasonality[r.brand] = {};
    if (!brandSeasonality[r.brand][m]) brandSeasonality[r.brand][m] = [];
    brandSeasonality[r.brand][m].push(r.amount);
  });

  const forecasts: any[] = [];
  
  // Calculate averages
  const brands = Array.from(new Set(history.map(r => r.brand)));
  brands.forEach(brand => {
    const monthlyPredictions: any[] = [];
    for(let m = 0; m < 12; m++) {
      const amounts = brandSeasonality[brand]?.[m] || [];
      let avg = 0;
      
      if (amounts.length > 0) {
        avg = amounts.reduce((a,b) => a+b, 0) / amounts.length;
      } else {
        // Simple fallback if no history for this month: Average of all available data for brand
        const allAmounts = Object.values(brandSeasonality[brand] || {}).flat();
        avg = allAmounts.length > 0 ? allAmounts.reduce((a,b) => a+b, 0) / allAmounts.length : 0;
      }

      // Apply simple 5% growth trend for manual forecast
      const forecastAmount = Math.floor(avg * 1.05);

      monthlyPredictions.push({
        month: m + 1,
        forecastAmount,
        rationale: "Statistical projection based on historical average + 5% growth."
      });
    }
    forecasts.push({ brand, monthlyPredictions });
  });

  return {
    brandForecasts: forecasts,
    summary: "Forecast generated using statistical analysis of historical averages (Manual Mode)."
  };
};

export const generateForecast = async (
  history: SaleRecord[],
  targetYear: number,
  options: { useAI: boolean; adjustments?: Record<string, number> } = { useAI: true }
): Promise<ForecastResponse> => {
  
  let result: any;

  // 1. Generate Brand-Level Forecasts (AI or Local)
  if (options.useAI && apiKey) {
    // Aggregation Step for AI Prompt
    const aggregatedHistory: Record<string, Record<string, number>> = {};
    const uniqueCounters = new Set<string>();
    
    history.forEach(r => {
      uniqueCounters.add(r.counter);
      const monthKey = r.date.substring(0, 7); // YYYY-MM
      if (!aggregatedHistory[r.brand]) aggregatedHistory[r.brand] = {};
      aggregatedHistory[r.brand][monthKey] = (aggregatedHistory[r.brand][monthKey] || 0) + r.amount;
    });

    let csvData = "Brand,Month,TotalAmount\n";
    Object.entries(aggregatedHistory).forEach(([brand, months]) => {
      Object.entries(months).sort().forEach(([month, amount]) => {
        csvData += `${brand},${month},${amount}\n`;
      });
    });

    const prompt = `
      You are an expert fashion retail planner.
      
      Historical monthly sales data by Brand:
      ---
      ${csvData}
      ---
      
      Context:
      - Brands: Domino (Menswear), OTTO (Womenswear), O'Dear (Kidswear).
      - We have approx ${uniqueCounters.size} active counters.
      
      Task:
      1. Analyze seasonality for each brand.
      2. Forecast the TOTAL monthly sales for the year ${targetYear} for each BRAND.
      3. Return a JSON with monthly predictions.
      4. Provide a rationale that explains key drivers.
    `;

    try {
      const response = await ai.models.generateContent({
        model: AI_MODEL_FORECAST,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: brandForecastSchema,
          temperature: 0.2, 
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini.");
      result = JSON.parse(text);

    } catch (error) {
      console.error("AI Forecast failed, falling back to local:", error);
      // Fallback to local if AI fails
      result = generateLocalBrandForecasts(history, targetYear);
      result.summary = "AI generation failed. Switched to statistical backup.";
    }
  } else {
    // Manual/Local Mode requested
    console.log("Using local statistical forecast (AI bypassed).");
    result = generateLocalBrandForecasts(history, targetYear);
  }

  // 2. Top-Down Distribution Step
  // Distribute Brand Total -> Individual Counters based on market share
  const counterShares = calculateRecentShares(history);
  const finalForecasts: ForecastRecord[] = [];
  const brandForecasts = result.brandForecasts || [];

  brandForecasts.forEach((bf: any) => {
    const brand = bf.brand;
    const predictions = bf.monthlyPredictions || [];
    const shares = counterShares[brand] || {};

    predictions.forEach((pred: any) => {
      const monthStr = `${targetYear}-${String(pred.month).padStart(2, '0')}`;
      const totalAmount = pred.forecastAmount;

      // Distribute to counters
      Object.entries(shares).forEach(([counter, sharePct]) => {
        const key = `${monthStr}|${brand}|${counter}`;
        let amount = Math.floor(totalAmount * sharePct);
        let rationale = pred.rationale;

        // Apply adjustments override if present
        if (options.adjustments && options.adjustments[key] !== undefined) {
          amount = options.adjustments[key];
          rationale = `${rationale} (Manual Override)`;
        }

        finalForecasts.push({
          month: monthStr,
          brand: brand,
          counter: counter,
          forecastAmount: amount,
          rationale: rationale
        });
      });
    });
  });

  return {
    forecasts: finalForecasts,
    summary: result.summary
  };
};

// NEW: Chat with the ERP System
export const askBusinessQuestion = async (
  query: string, 
  contextData: any
): Promise<string> => {
  if (!apiKey) return "API Key not configured. Please enable AI features.";

  // Create a condensed context string to stay within token limits (though Gemini has large context)
  // We summarize lists instead of sending raw arrays of thousands of items
  const summary = `
    Business Context:
    - Brands: Domino (Mens), OTTO (Womens), O'Dear (Kids)
    - Total Stores: ${contextData.storeCount}
    - Total Sales YTD: $${contextData.totalSales}
    - Total Inventory Value: $${contextData.totalInventoryValue}
    - Total Overdue AR: $${contextData.totalOverdue}

    Top 5 Stores by Sales:
    ${JSON.stringify(contextData.topStores)}

    High Risk Stores (Overdue > 60 days):
    ${JSON.stringify(contextData.highRiskStores)}

    Underperforming Stores (Bottom 5):
    ${JSON.stringify(contextData.bottomStores)}

    Available Data Structure in ERP:
    - Sales Records (Date, Brand, Store, Amount)
    - Inventory (Store, Product SKU, Quantity)
    - Invoices (Store, Amount, Due Date, Status, Paid Amount, Payment History)
    - Products (SKU, Cost, Price, Variants)
  `;

  const prompt = `
    You are the AI Brain of a Consignment Fashion ERP system called SalesCast.
    You have access to the following business snapshot:
    ${summary}

    User Query: "${query}"

    Task:
    Answer the user's question analytically. 
    If they ask for specific numbers not in the summary, explain that you are analyzing based on the high-level summary provided.
    Provide actionable advice for consignment operations (e.g. suggesting stock transfers, debt collection).
    Keep the tone professional, helpful, and concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Force use of Pro model for complex reasoning
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 } // Use Thinking Mode for complex business reasoning
      }
    });
    return response.text || "I couldn't generate an answer at this time.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Sorry, I'm having trouble connecting to the brain right now.";
  }
};
