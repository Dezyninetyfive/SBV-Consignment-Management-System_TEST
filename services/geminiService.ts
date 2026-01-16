import { GoogleGenAI, Type } from "@google/genai";
import { SaleRecord, ForecastResponse, ForecastRecord } from '../types';
import { AI_MODEL_FORECAST } from '../constants';

export const generateForecast = async (
  history: SaleRecord[],
  targetYear: number,
  options: { useAI: boolean } = { useAI: true }
): Promise<ForecastResponse> => {
  
  const generateHeuristic = (): ForecastResponse => {
    const records: ForecastRecord[] = [];
    const brands = Array.from(new Set(history.map(r => r.brand)));
    const counters = Array.from(new Set(history.map(r => r.counter)));

    counters.forEach(counter => {
      brands.forEach(brand => {
        for (let m = 1; m <= 12; m++) {
          const pastSales = history.filter(r => 
            r.brand === brand && 
            r.counter === counter && 
            new Date(r.date).getMonth() === m - 1
          );
          const avg = pastSales.length > 0 
            ? pastSales.reduce((s, r) => s + r.amount, 0) / pastSales.length 
            : 3000 + Math.random() * 2000;
          
          records.push({
            month: `${targetYear}-${String(m).padStart(2, '0')}`,
            brand,
            counter,
            forecastAmount: Math.floor(avg * 1.05),
            rationale: "Projected based on store-specific historical moving averages."
          });
        }
      });
    });

    return { 
      forecasts: records, 
      summary: "Showing statistical projections based on historical averages. Connect Gemini API for intelligent trend analysis." 
    };
  };

  if (!options.useAI || !process.env.API_KEY) {
    return generateHeuristic();
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = history
      .slice(-300) // Reduced context further to avoid serialization issues
      .map(r => ({
        d: r.date,
        b: r.brand,
        c: r.counter,
        a: r.amount
      }));

    const prompt = `Based on this sales history, provide a monthly RM sales forecast for year ${targetYear} for every brand and consignment counter listed. Data: ${JSON.stringify(context)}`;

    const response = await ai.models.generateContent({
      model: AI_MODEL_FORECAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            forecasts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  counter: { type: Type.STRING },
                  forecastAmount: { type: Type.NUMBER },
                  rationale: { type: Type.STRING }
                },
                required: ["month", "brand", "counter", "forecastAmount"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["forecasts", "summary"]
        } as any,
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text) as ForecastResponse;
  } catch (error) {
    return generateHeuristic();
  }
};

export const askBusinessQuestion = async (query: string, contextData: any): Promise<string> => {
  if (!process.env.API_KEY) return "AI Assistant is currently offline (Missing API Key).";
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `You are Celestrion Intelligence. Answer the following user question based on the provided business context.\n\nBusiness Context: ${JSON.stringify(contextData)}\n\nQuestion: ${query}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 4000 } }
    });
    
    return response.text || "I was unable to generate a textual analysis.";
  } catch (error) {
    return "Error connecting to AI. Please try again later.";
  }
};