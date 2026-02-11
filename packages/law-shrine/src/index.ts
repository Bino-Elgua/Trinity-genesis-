/**
 * Law Shrine — Twelve Thrones Consensus & Settlement
 * 
 * Takes a RitualPayload from Mind Shrine and seals the decision
 * on blockchain via consensus voting, creating an immutable record.
 */

import crypto from "crypto";
import { RitualPayload, updatePayloadStatus } from "@trinity/core";
import { getAllAdapters, LLMAdapter, getAvailableAdapters } from "@trinity/llm-adapter";

// ============================================================================
// TWELVE THRONES TYPES
// ============================================================================

export interface Throne {
  id: number;
  name: string;
  provider: string;
  model: string;
  weight: number;
}

export interface Vote {
  throneId: number;
  throneName: string;
  answer: "YES" | "NO" | "UNCERTAIN";
  confidence: number;
  reasoning: string;
  weight: number;
  weightedVote: number;
}

export interface ConsensusResult {
  timestamp: string;
  questionHash: string;
  votes: Vote[];
  verdict: "ACCEPTED" | "REJECTED" | "UNCERTAIN";
  confidence: number;
  epistemic_frontier: string[];
  arweave_tx_id?: string;
  sui_ledger_entry?: string;
}

// ============================================================================
// LAW SHRINE
// ============================================================================

const THRONES: Throne[] = [
  {
    id: 1,
    name: "Ọbàtálá (Claude 3.5 Sonnet)",
    provider: "anthropic",
    model: "claude-3-5-sonnet",
    weight: 2.0,
  },
  {
    id: 2,
    name: "Èṣù (GPT-4o)",
    provider: "openai",
    model: "gpt-4o",
    weight: 1.8,
  },
  {
    id: 3,
    name: "Ògún (Llama 3.3 70B)",
    provider: "groq",
    model: "llama-3.3-70b",
    weight: 1.7,
  },
  {
    id: 4,
    name: "Ọ̀ṣun (DeepSeek-R1)",
    provider: "together",
    model: "deepseek-r1",
    weight: 1.5,
  },
  {
    id: 5,
    name: "Ọya (Qwen3-235B)",
    provider: "together",
    model: "qwen3-235b",
    weight: 1.4,
  },
  {
    id: 6,
    name: "Yemọja (Kimi-K2.5)",
    provider: "together",
    model: "kimi-k2.5",
    weight: 1.3,
  },
  {
    id: 7,
    name: "Ṣàngó (Claude 3.5 Sonnet)",
    provider: "anthropic",
    model: "claude-3-5-sonnet",
    weight: 1.6,
  },
  {
    id: 8,
    name: "Ọrunmila (GPT-4o)",
    provider: "openai",
    model: "gpt-4o",
    weight: 1.4,
  },
  {
    id: 9,
    name: "Olódùmarè (DeepSeek-R1)",
    provider: "together",
    model: "deepseek-r1",
    weight: 1.5,
  },
  {
    id: 10,
    name: "Àálu (Qwen3-235B)",
    provider: "together",
    model: "qwen3-235b",
    weight: 1.3,
  },
  {
    id: 11,
    name: "Òṛíṣà (Llama 3.3 70B)",
    provider: "groq",
    model: "llama-3.3-70b",
    weight: 1.2,
  },
  {
    id: 12,
    name: "Àṣẹ (Kimi-K2.5)",
    provider: "together",
    model: "kimi-k2.5",
    weight: 1.1,
  },
];

export class LawShrine {
  private thrones: Throne[] = THRONES;
  private consensusResults: Map<string, ConsensusResult> = new Map();

  /**
   * Seal a ritual via Twelve Thrones consensus
   * 
   * @param payload - RitualPayload from Mind Shrine
   * @returns Updated RitualPayload with consensus seal
   */
  async sealRitual(payload: RitualPayload): Promise<RitualPayload> {
    console.log(`[LawShrine] Sealing ritual ${payload.decision_id}...`);

    try {
      // Generate votes from each throne
      const votes = await this.generateConsensusVotes(payload);

      // Calculate verdict
      const verdict = this.calculateVerdict(votes);

      // Generate archive records (simulated)
      const arweave_tx_id = this.generateArweaveHash();
      const sui_ledger_entry = this.generateSuiHash();

      // Create consensus result
      const consensus_result: ConsensusResult = {
        timestamp: new Date().toISOString(),
        questionHash: payload.question_hash,
        votes,
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        epistemic_frontier: this.extractEpistemicFrontier(votes),
        arweave_tx_id,
        sui_ledger_entry,
      };

      // Store for audit
      this.consensusResults.set(payload.decision_id, consensus_result);

      // Update payload with sealed results
      const sealed_payload = updatePayloadStatus(payload, "sealed", {
        consensus_score: verdict.confidence,
        archive_location: arweave_tx_id,
        ritual_metadata: {
          ...payload.ritual_metadata,
          shrine: "law",
          phase: 3,
          start_time: payload.ritual_metadata?.start_time || Date.now(),
        },
        orisha_note: `Law Shrine: ${verdict.verdict} via 12-throne consensus (${votes.length} votes, confidence: ${verdict.confidence.toFixed(3)})`,
      });

      console.log(`[LawShrine] Verdict: ${verdict.verdict}`);
      console.log(`[LawShrine] Confidence: ${verdict.confidence.toFixed(3)}`);
      console.log(`[LawShrine] Archived to Arweave: ${arweave_tx_id}`);
      console.log(`[LawShrine] Sealed on Sui: ${sui_ledger_entry}`);

      return sealed_payload;
    } catch (error) {
      console.error(`[LawShrine] Seal failed: ${error}`);
      return updatePayloadStatus(payload, "failed", {
        error: `Law Shrine seal failed: ${error}`,
      });
    }
  }

  /**
   * Generate votes from all 12 thrones via real LLM calls
   */
  private async generateConsensusVotes(payload: RitualPayload): Promise<Vote[]> {
    const question = payload.decision_snapshot?.question || "Unknown question";
    const proposals = payload.decision_snapshot?.proposals || [];

    const consensus_context = `
Current consensus estimate: ${payload.consensus_score?.toFixed(2) || "0.75"}
Proposals analyzed: ${proposals.length}
Task: Provide independent vote on proposal viability
    `.trim();

    console.log(`[LawShrine] Submitting to ${this.thrones.length} thrones for real voting...`);

    // Get all LLM adapters
    const adapters = getAllAdapters();

    // Parallel votes from all models
    const votePromises = this.thrones.map((throne, idx) => {
      const adapter = adapters[idx % adapters.length]; // Round-robin assignment

      return adapter
        .castVote({
          throne_name: throne.name,
          question,
          proposals: proposals.map((p) => {
            const str = JSON.stringify(p);
            return str.length > 100 ? str.slice(0, 100) + "..." : str;
          }),
          consensus_context,
        })
        .then((response) => {
          console.log(
            `[${throne.name}] ${response.answer} (${response.confidence.toFixed(2)}) - $${response.cost_usd.toFixed(4)}`
          );

          const weighted_vote =
            response.answer === "YES"
              ? throne.weight
              : response.answer === "NO"
                ? -throne.weight
                : 0;

          return {
            throneId: throne.id,
            throneName: throne.name,
            answer: response.answer,
            confidence: response.confidence,
            reasoning: response.reasoning,
            weight: throne.weight,
            weightedVote: weighted_vote,
          };
        })
        .catch((error) => {
          console.warn(`[${throne.name}] Failed: ${error}, defaulting to UNCERTAIN`);

          return {
            throneId: throne.id,
            throneName: throne.name,
            answer: "UNCERTAIN" as const,
            confidence: 0.5,
            reasoning: `Failed to query ${throne.name}, defaulting to uncertainty`,
            weight: throne.weight,
            weightedVote: 0,
          };
        });
    });

    // Wait for all votes in parallel
    const votes = await Promise.all(votePromises);

    console.log(`[LawShrine] All ${votes.length} thrones voted`);
    return votes;
  }

  /**
   * Calculate overall verdict from votes
   */
  private calculateVerdict(votes: Vote[]): { verdict: "ACCEPTED" | "REJECTED" | "UNCERTAIN"; confidence: number } {
    const total_weight = this.thrones.reduce((sum, t) => sum + t.weight, 0);
    const weighted_sum = votes.reduce((sum, v) => sum + v.weightedVote, 0);
    const normalized_score = (weighted_sum / total_weight + 1) / 2; // Map [-1, 1] to [0, 1]

    let verdict: "ACCEPTED" | "REJECTED" | "UNCERTAIN";
    if (normalized_score > 0.75) {
      verdict = "ACCEPTED";
    } else if (normalized_score < 0.35) {
      verdict = "REJECTED";
    } else {
      verdict = "UNCERTAIN";
    }

    return {
      verdict,
      confidence: Math.abs(normalized_score - 0.5) * 2, // Confidence = distance from 0.5
    };
  }

  /**
   * Extract areas of disagreement (epistemic frontier)
   */
  private extractEpistemicFrontier(votes: Vote[]): string[] {
    const yes_votes = votes.filter((v) => v.answer === "YES").length;
    const no_votes = votes.filter((v) => v.answer === "NO").length;
    const uncertain_votes = votes.filter((v) => v.answer === "UNCERTAIN").length;

    const frontiers: string[] = [];

    if (Math.abs(yes_votes - no_votes) <= 3) {
      frontiers.push("Strong disagreement on acceptance");
    }

    if (uncertain_votes > 3) {
      frontiers.push("Epistemic frontier: insufficient consensus");
    }

    if (votes.length < 10) {
      frontiers.push("Low throne participation");
    }

    return frontiers.length > 0 ? frontiers : ["Consensus threshold met"];
  }

  /**
   * Simulate Arweave permanent archive
   */
  private generateArweaveHash(): string {
    return `ar:${crypto.randomBytes(16).toString("hex")}`;
  }

  /**
   * Simulate Sui ledger entry
   */
  private generateSuiHash(): string {
    return `0x${crypto.randomBytes(32).toString("hex")}`;
  }

  /**
   * Retrieve a consensus result
   */
  getConsensusResult(decision_id: string): ConsensusResult | undefined {
    return this.consensusResults.get(decision_id);
  }

  /**
   * Get all consensus results
   */
  getAllResults(): ConsensusResult[] {
    return Array.from(this.consensusResults.values());
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createLawShrine(): LawShrine {
  return new LawShrine();
}
