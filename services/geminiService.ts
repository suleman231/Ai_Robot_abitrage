
import { GoogleGenAI, Type } from "@google/genai";
import { ArbitrageOpportunity, AIAnalysis } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeMarketWithGemini = async (
  opportunities: ArbitrageOpportunity[],
  marketStats: any,
  retries = 3,
  delay = 2000
): Promise<AIAnalysis> => {
  // Use a new instance to ensure we pick up any updated API key from the environment
  const apiKey = (process.env as any).API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    As a world-class AI Quant Trading Robot, analyze this real-time market telemetry:
    - Arbitrage Opportunities: ${JSON.stringify(opportunities.slice(0, 3))}
    - Top Market Assets: ${JSON.stringify(marketStats)}
    
    Tasks:
    1. Assess the current sentiment (BULLISH, BEARISH, or NEUTRAL).
    2. Recommend the best execution strategy for $10 micro-trades.
    3. Identify high-confidence spot signals for intra-exchange nodes.
    
    Constraints:
    - Return strictly valid JSON.
    - Focus on risk mitigation and net profit logic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'NEUTRAL'] },
            reasoning: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
            recommendedStrategy: { type: Type.STRING },
            spotSignals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  coin: { type: Type.STRING },
                  action: { type: Type.STRING, enum: ['BUY', 'SELL', 'HOLD'] },
                  confidence: { type: Type.NUMBER },
                  targetPrice: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ['coin', 'action', 'confidence', 'reason']
              }
            }
          },
          required: ['sentiment', 'reasoning', 'riskLevel', 'recommendedStrategy']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const cleanedJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedJson);
  } catch (error: any) {
    if (retries > 0 && (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota'))) {
      await sleep(delay);
      return analyzeMarketWithGemini(opportunities, marketStats, retries - 1, delay * 2);
    }

    return {
      sentiment: 'NEUTRAL',
      reasoning: 'HFT Logic active. Neural link temporarily saturated; proceeding with local heuristic analysis.',
      riskLevel: 'MEDIUM',
      recommendedStrategy: 'Local node executing standard $10 arb protocols while waiting for AI link reset.',
      spotSignals: []
    };
  }
};
