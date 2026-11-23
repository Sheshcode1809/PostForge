import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY || "dummy-key",
  baseURL: process.env.AI_GATEWAY_BASE_URL || undefined,
});
