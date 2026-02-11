/**
 * @trinity/llm-adapter — Unified LLM interface for consensus voting
 *
 * Abstracts Claude (Anthropic), GPT-4o (OpenAI), Llama (Groq),
 * DeepSeek, Qwen, Kimi (Together.ai) behind a common interface
 * for parallel voting in Law Shrine.
 *
 * One question. Three shrines. Sealed forever.
 */

import { CostLog } from "@trinity/core";

// ============================================================================
// TYPES
// ============================================================================

export interface LLMProvider {
  name: string;
  model: string;
  provider: string; // "anthropic" | "openai" | "groq" | "together"
  apiKey: string;
}

export interface VoteRequest {
  throne_name: string;
  question: string;
  proposals: string[];
  consensus_context: string;
}

export interface VoteResponse {
  answer: "YES" | "NO" | "UNCERTAIN";
  confidence: number; // [0, 1]
  reasoning: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

export interface LLMAdapter {
  castVote(request: VoteRequest): Promise<VoteResponse>;
  getProvider(): LLMProvider;
}

// ============================================================================
// ANTHROPIC CLIENT (Claude 3.5 Sonnet)
// ============================================================================

export class AnthropicAdapter implements LLMAdapter {
  private client: any;
  private provider: LLMProvider;

  constructor() {
    try {
      const { Anthropic } = require("anthropic");
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      this.provider = {
        name: "Ọbàtálá (Claude 3.5 Sonnet)",
        model: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY || "",
      };
    } catch (e) {
      console.warn("[AnthropicAdapter] Anthropic SDK not available");
      this.provider = {
        name: "Ọbàtálá (Claude) [UNAVAILABLE]",
        model: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
        apiKey: "",
      };
      this.client = null;
    }
  }

  async castVote(request: VoteRequest): Promise<VoteResponse> {
    if (!this.client || !process.env.ANTHROPIC_API_KEY) {
      return {
        answer: "UNCERTAIN",
        confidence: 0.5,
        reasoning: "Claude API not configured (ANTHROPIC_API_KEY missing)",
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
      };
    }

    const prompt = `
You are ${request.throne_name}, a wisdom keeper in the Twelve Thrones.

Question: ${request.question}

Proposals under consideration:
${request.proposals.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Context: ${request.consensus_context}

Respond ONLY with valid JSON (no markdown, no code fence):
{
  "answer": "YES" | "NO" | "UNCERTAIN",
  "confidence": 0.XX,
  "reasoning": "Your reasoning in 1-2 sentences"
}
    `.trim();

    try {
      const response = await this.client.messages.create({
        model: this.provider.model,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      const parsed = JSON.parse(text);

      const input_tokens = response.usage?.input_tokens || 150;
      const output_tokens = response.usage?.output_tokens || 50;

      // Anthropic pricing: input $0.003/1M, output $0.015/1M
      const cost_usd =
        (input_tokens / 1_000_000) * 0.003 +
        (output_tokens / 1_000_000) * 0.015;

      return {
        answer: parsed.answer || "UNCERTAIN",
        confidence: Math.min(Math.max(parseFloat(parsed.confidence) || 0.5, 0), 1),
        reasoning: parsed.reasoning || "Claude vote",
        input_tokens,
        output_tokens,
        cost_usd,
      };
    } catch (error) {
      console.error(`[Claude] Error: ${error}`);
      return {
        answer: "UNCERTAIN",
        confidence: 0.5,
        reasoning: "Claude API call failed",
        input_tokens: 150,
        output_tokens: 50,
        cost_usd: 0.0005,
      };
    }
  }

  getProvider(): LLMProvider {
    return this.provider;
  }
}

// ============================================================================
// OPENAI CLIENT (GPT-4o)
// ============================================================================

export class OpenAIAdapter implements LLMAdapter {
  private client: any;
  private provider: LLMProvider;

  constructor() {
    try {
      const { OpenAI } = require("openai");
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.provider = {
        name: "Èṣù (GPT-4o)",
        model: "gpt-4o",
        provider: "openai",
        apiKey: process.env.OPENAI_API_KEY || "",
      };
    } catch (e) {
      console.warn("[OpenAIAdapter] OpenAI SDK not available");
      this.provider = {
        name: "Èṣù (GPT-4o) [UNAVAILABLE]",
        model: "gpt-4o",
        provider: "openai",
        apiKey: "",
      };
      this.client = null;
    }
  }

  async castVote(request: VoteRequest): Promise<VoteResponse> {
    if (!this.client || !process.env.OPENAI_API_KEY) {
      return {
        answer: "UNCERTAIN",
        confidence: 0.5,
        reasoning: "GPT-4o API not configured (OPENAI_API_KEY missing)",
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
      };
    }

    const prompt = `
You are ${request.throne_name}, a wisdom keeper in the Twelve Thrones.

Question: ${request.question}

Proposals: ${request.proposals.join(" | ")}

Context: ${request.consensus_context}

Respond ONLY with JSON:
{"answer": "YES"|"NO"|"UNCERTAIN", "confidence": 0.XX, "reasoning": "..."}
    `.trim();

    try {
      const response = await this.client.chat.completions.create({
        model: this.provider.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });

      const text = response.choices[0].message.content || "";
      const parsed = JSON.parse(text);

      const input_tokens = response.usage?.prompt_tokens || 150;
      const output_tokens = response.usage?.completion_tokens || 50;

      // GPT-4o pricing: input $0.005/1M, output $0.015/1M
      const cost_usd =
        (input_tokens / 1_000_000) * 0.005 +
        (output_tokens / 1_000_000) * 0.015;

      return {
        answer: parsed.answer || "UNCERTAIN",
        confidence: Math.min(Math.max(parseFloat(parsed.confidence) || 0.5, 0), 1),
        reasoning: parsed.reasoning || "GPT vote",
        input_tokens,
        output_tokens,
        cost_usd,
      };
    } catch (error) {
      console.error(`[GPT-4o] Error: ${error}`);
      return {
        answer: "UNCERTAIN",
        confidence: 0.5,
        reasoning: "GPT-4o API call failed",
        input_tokens: 150,
        output_tokens: 50,
        cost_usd: 0.001,
      };
    }
  }

  getProvider(): LLMProvider {
    return this.provider;
  }
}

// ============================================================================
// GROQ CLIENT (Llama 3.3 70B)
// ============================================================================

export class GroqAdapter implements LLMAdapter {
  private client: any;
  private provider: LLMProvider;

  constructor() {
    try {
      const { Groq } = require("groq-sdk");
      this.client = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      this.provider = {
        name: "Ọ̀ṣun (Llama 3.3 70B)",
        model: "llama-3.3-70b-versatile",
        provider: "groq",
        apiKey: process.env.GROQ_API_KEY || "",
      };
    } catch (e) {
      console.warn("[GroqAdapter] Groq SDK not available");
      this.provider = {
        name: "Ọ̀ṣun (Llama) [UNAVAILABLE]",
        model: "llama-3.3-70b-versatile",
        provider: "groq",
        apiKey: "",
      };
      this.client = null;
    }
  }

  async castVote(request: VoteRequest): Promise<VoteResponse> {
    if (!this.client || !process.env.GROQ_API_KEY) {
      return {
        answer: "UNCERTAIN",
        confidence: 0.5,
        reasoning: "Groq API not configured (GROQ_API_KEY missing)",
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
      };
    }

    const prompt = `
${request.throne_name}: Question: ${request.question}
Proposals: ${request.proposals.join(", ")}
Respond JSON: {"answer": "YES"|"NO"|"UNCERTAIN", "confidence": 0.XX, "reasoning": "..."}
    `.trim();

    try {
      const response = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.provider.model,
        temperature: 0.7,
        max_tokens: 300,
      });

      const text = response.choices[0].message.content || "";
      const parsed = JSON.parse(text);

      // Groq is very fast and cheap
      const cost_usd = 0.0001; // Groq ~$0.0001 per 1k tokens

      return {
        answer: parsed.answer || "UNCERTAIN",
        confidence: Math.min(Math.max(parseFloat(parsed.confidence) || 0.5, 0), 1),
        reasoning: parsed.reasoning || "Llama vote",
        input_tokens: 150,
        output_tokens: 50,
        cost_usd,
      };
    } catch (error) {
      console.error(`[Groq] Error: ${error}`);
      return {
        answer: "UNCERTAIN",
        confidence: 0.5,
        reasoning: "Groq API call failed",
        input_tokens: 150,
        output_tokens: 50,
        cost_usd: 0,
      };
    }
  }

  getProvider(): LLMProvider {
    return this.provider;
  }
}

// ============================================================================
// TOGETHER.AI CLIENT (DeepSeek-R1 / Qwen3 / Kimi)
// ============================================================================

export class TogetherAdapter implements LLMAdapter {
  private client: any;
  private provider: LLMProvider;
  private model: string;

  constructor(model: "deepseek" | "qwen" | "kimi") {
    this.model = model;

    const modelMap: Record<string, { name: string; model: string }> = {
      deepseek: {
        name: "Yemọja (DeepSeek-R1 / Together.ai)",
        model: "deepseek-ai/deepseek-r1",
      },
      qwen: {
        name: "Òṛíṣà (Qwen3-235B / Together.ai)",
        model: "Qwen/Qwen3-235B",
      },
      kimi: {
        name: "Àálu (Kimi-K2.5 / Together.ai)",
        model: "Kimi/Kimi-K2.5-Vision",
      },
    };

    const selected = modelMap[model] || modelMap.deepseek;

    this.provider = {
      name: selected.name,
      model: selected.model,
      provider: "together",
      apiKey: process.env.TOGETHER_API_KEY || "",
    };

    if (!process.env.TOGETHER_API_KEY) {
      console.warn(`[TogetherAdapter] Together.ai API key not set`);
    }
  }

  async castVote(request: VoteRequest): Promise<VoteResponse> {
    if (!process.env.TOGETHER_API_KEY) {
      return {
        answer: "UNCERTAIN",
        confidence: 0.5,
        reasoning: `${this.provider.name} API not configured (TOGETHER_API_KEY missing)`,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
      };
    }

    const prompt = `
You are ${request.throne_name}, evaluating proposals.

Question: ${request.question}

Proposals:
${request.proposals.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Respond with JSON: {"answer": "YES"|"NO"|"UNCERTAIN", "confidence": 0.0-1.0, "reasoning": "..."}
    `.trim();

    try {
      const response = await fetch("https://api.together.xyz/inference", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.provider.model,
          prompt,
          max_tokens: 300,
          temperature: 0.7,
          stop: ["\n\n"],
        }),
      });

      if (!response.ok) {
        throw new Error(`Together.ai API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const text = data.output?.choices?.[0]?.text || "";
      const parsed = JSON.parse(text);

      // Together.ai pricing varies by model, roughly $0.02-0.05 per 1M tokens
      const cost_usd = 0.0002;

      return {
        answer: parsed.answer || "UNCERTAIN",
        confidence: Math.min(Math.max(parseFloat(parsed.confidence) || 0.5, 0), 1),
        reasoning: parsed.reasoning || `${this.provider.name} vote`,
        input_tokens: 150,
        output_tokens: 50,
        cost_usd,
      };
    } catch (error) {
      console.error(`[Together.ai] Error: ${error}`);
      return {
        answer: "UNCERTAIN",
        confidence: 0.5,
        reasoning: `${this.provider.name} API call failed`,
        input_tokens: 150,
        output_tokens: 50,
        cost_usd: 0,
      };
    }
  }

  getProvider(): LLMProvider {
    return this.provider;
  }
}

// ============================================================================
// FACTORY & UTILITIES
// ============================================================================

export function createAdapter(provider: string): LLMAdapter {
  switch (provider.toLowerCase()) {
    case "anthropic":
    case "claude":
      return new AnthropicAdapter();
    case "openai":
    case "gpt":
      return new OpenAIAdapter();
    case "groq":
    case "llama":
      return new GroqAdapter();
    case "deepseek":
      return new TogetherAdapter("deepseek");
    case "qwen":
      return new TogetherAdapter("qwen");
    case "kimi":
      return new TogetherAdapter("kimi");
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

export function getAllAdapters(): LLMAdapter[] {
  return [
    new AnthropicAdapter(),
    new OpenAIAdapter(),
    new GroqAdapter(),
    new TogetherAdapter("deepseek"),
    new TogetherAdapter("qwen"),
    new TogetherAdapter("kimi"),
  ];
}

export function getAvailableAdapters(): LLMAdapter[] {
  const all = getAllAdapters();
  return all.filter((adapter) => {
    const provider = adapter.getProvider();
    return provider.apiKey !== "";
  });
}
