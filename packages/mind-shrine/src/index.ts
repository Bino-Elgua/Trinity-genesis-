/**
 * Mind Shrine — Nex Agent Reasoning + SwarmIDE2 Orchestration
 * 
 * Wraps the Nex graph interpreter and feeds its output through
 * the dispatcher with SwarmIDE2 cost tracking and conflict resolution.
 */

import crypto from "crypto";
import {
  RitualPayload,
  AgentProposal,
  createRitualPayload,
  updatePayloadStatus,
} from "@trinity/core";
import { TrinityDispatcher, DispatcherConfig } from "@trinity/dispatcher";
import { RealSwarmIDE2Services } from "@trinity/swarmide2-services";

// ============================================================================
// NEX TYPES (from nex-runtime.ts)
// ============================================================================

export interface NexNode {
  id: string;
  kind:
    | "goal"
    | "agent"
    | "memory"
    | "tool"
    | "guard"
    | "rewrite"
    | "reflect"
    | "merge"
    | "parallel";
  data: Record<string, any> | string;
  orisha?: string;
  hermetic?: string;
  note?: string;
}

export interface NexLink {
  from: string;
  to: string;
  type: "sync" | "async" | "parallel" | "depend";
}

export interface NexGraph {
  nodes: NexNode[];
  links: NexLink[];
  entry: string;
  result?: any;
  meta?: Record<string, any>;
}

// ============================================================================
// MIND SHRINE
// ============================================================================

export class MindShrine {
  private dispatcher: TrinityDispatcher;
  private services: RealSwarmIDE2Services;
  private ritualsExecuted: Map<string, RitualPayload> = new Map();

  constructor(config?: DispatcherConfig) {
    const default_config: DispatcherConfig = {
      use_swarmide2: true,
      enable_cost_tracking: true,
      enable_caching: false,
      max_parallel_agents: 5,
      conflict_resolution_strategy: "meta_reasoning",
    };

    this.dispatcher = new TrinityDispatcher(config || default_config);
    this.services = new RealSwarmIDE2Services();
  }

  /**
   * Initialize the shrine and dispatcher
   */
  async init(): Promise<void> {
    await this.dispatcher.init(this.services);
    console.log("[MindShrine] Initialized with Nex runtime");
  }

  /**
   * Execute a Nex graph through the ritual pipeline
   * 
   * @param graph - Nex graph to execute
   * @param question - The question/prompt driving this ritual
   * @returns RitualPayload with debate results
   */
  async executeRitual(graph: NexGraph, question: string): Promise<RitualPayload> {
    // Generate decision ID and question hash
    const decision_id = `ritual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const question_hash = crypto.createHash("sha256").update(question).digest("hex");

    console.log(`[MindShrine] Starting ritual ${decision_id}`);
    console.log(`[MindShrine] Question: ${question}`);

    // Create initial payload
    let payload = createRitualPayload(decision_id, question_hash, {
      graph_entry: graph.entry,
      graph_nodes: graph.nodes.length,
      graph_links: graph.links.length,
    });

    try {
      payload = updatePayloadStatus(payload, "thinking", {
        ritual_metadata: {
          shrine: "mind",
          phase: 1,
          agents_spawned: 0,
          debate_iterations: 0,
          models_used: ["gemini-3-flash", "gpt-4o", "claude-3-5-sonnet"],
          start_time: Date.now(),
        },
      });

      // =====================================================================
      // STEP 1: Analyze question → determine agent roles
      // =====================================================================
      console.log("[MindShrine] Analyzing question to determine agent roles...");

      const agent_roles = this.extractAgentRoles(question, graph);
      console.log(`[MindShrine] Determined roles: ${agent_roles.join(", ")}`);

      // =====================================================================
      // STEP 2: Spawn agents via dispatcher (routes to SwarmIDE2)
      // =====================================================================
      console.log("[MindShrine] Spawning agents...");

      const proposals = await this.dispatcher.spawn(
        agent_roles,
        {
          question,
          graph_nodes: graph.nodes,
          graph_entry: graph.entry,
        },
        5.0 // $5 budget
      );

      console.log(`[MindShrine] Spawned ${proposals.length} agent proposals`);

      payload = updatePayloadStatus(payload, "debating", {
        ritual_metadata: {
          shrine: "mind",
          phase: 2,
          agents_spawned: proposals.length,
          debate_iterations: 1,
          models_used: ["gemini-3-flash", "gpt-4o", "claude-3-5-sonnet"],
          start_time: payload.ritual_metadata?.start_time || Date.now(),
        },
      });

      // =====================================================================
      // STEP 3: Debate via dispatcher (routes to SwarmIDE2 conflict resolver)
      // =====================================================================
      console.log("[MindShrine] Running debate...");

      const debate_outcome = await this.dispatcher.debate(proposals, question, 3);

      console.log(`[MindShrine] Debate complete. Consensus score: ${debate_outcome.consensus_score}`);
      console.log(`[MindShrine] Winner proposal: ${debate_outcome.winner_proposal.agent_role}`);

      // =====================================================================
      // STEP 4: Merge proposals with consensus
      // =====================================================================
      console.log("[MindShrine] Merging proposals...");

      const merged = await this.dispatcher.merge(proposals, debate_outcome.consensus_score);

      // =====================================================================
      // STEP 5: Apply guard validation
      // =====================================================================
      console.log("[MindShrine] Applying guards...");

      const guard_result = await this.dispatcher.guard(merged, "truth_density", 1);
      if (!guard_result.valid) {
        console.warn(`[MindShrine] Guard warning: ${guard_result.reason}`);
      }

      // =====================================================================
      // STEP 6: Capture costs
      // =====================================================================
      const { total: total_cost, logs: cost_logs } = this.dispatcher.getCostSummary();

      console.log(`[MindShrine] Total ritual cost: $${total_cost.toFixed(4)}`);

      // =====================================================================
      // STEP 7: Update payload with results
      // =====================================================================
      payload = updatePayloadStatus(payload, "sealed", {
        decision_snapshot: {
          graph,
          proposals: proposals.map((p) => ({
            agent_id: p.agent_id,
            agent_role: p.agent_role,
            confidence: p.confidence,
            proposal: p.proposal,
          })),
          winner: debate_outcome.winner_proposal,
          consensus_score: debate_outcome.consensus_score,
          merged_output: merged,
          guard_check: guard_result,
        },
        consensus_score: debate_outcome.consensus_score,
        cost_breakdown: {
          total_cost_usd: total_cost,
          by_provider: {
            "gemini-3-flash": cost_logs
              .filter((l) => l.provider === "gemini-3-flash")
              .reduce((sum, l) => sum + l.cost_usd, 0),
            "gpt-4o": cost_logs
              .filter((l) => l.provider === "gpt-4o")
              .reduce((sum, l) => sum + l.cost_usd, 0),
            "claude-3-5-sonnet": cost_logs
              .filter((l) => l.provider === "claude-3-5-sonnet")
              .reduce((sum, l) => sum + l.cost_usd, 0),
          },
          by_operation: {
            spawn: cost_logs
              .filter((l) => l.operation === "spawn")
              .reduce((sum, l) => sum + l.cost_usd, 0),
            debate: cost_logs
              .filter((l) => l.operation === "debate")
              .reduce((sum, l) => sum + l.cost_usd, 0),
            merge: cost_logs
              .filter((l) => l.operation === "merge")
              .reduce((sum, l) => sum + l.cost_usd, 0),
            guard: cost_logs
              .filter((l) => l.operation === "guard")
              .reduce((sum, l) => sum + l.cost_usd, 0),
          },
          by_phase: {
            "mind": cost_logs.reduce((sum, l) => sum + l.cost_usd, 0),
          },
          timestamp: new Date().toISOString(),
        },
        orisha_note: "Mind Shrine: Nex debate sealed by consensus",
      });

      // Store for retrieval
      this.ritualsExecuted.set(decision_id, payload);

      console.log(`[MindShrine] Ritual ${decision_id} complete ✅`);
      return payload;
    } catch (error) {
      console.error(`[MindShrine] Ritual failed: ${error}`);
      payload = updatePayloadStatus(payload, "failed", {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Extract agent roles from question (heuristic)
   */
  private extractAgentRoles(question: string, graph: NexGraph): string[] {
    const roles = ["engineer", "devops", "qa"];

    // Bias based on question content
    if (question.toLowerCase().includes("architecture")) {
      roles.unshift("architect");
    }
    if (question.toLowerCase().includes("safety")) {
      roles.push("critic");
    }
    if (question.toLowerCase().includes("data")) {
      roles.push("data-engineer");
    }

    // Also check graph for hints
    const agent_nodes = graph.nodes.filter((n) => n.kind === "agent");
    agent_nodes.forEach((n) => {
      const node_role = (n.data as any)?.role;
      if (node_role && !roles.includes(node_role)) {
        roles.push(node_role);
      }
    });

    return [...new Set(roles)].slice(0, 5); // Max 5 agents
  }

  /**
   * Retrieve a past ritual
   */
  getRitual(decision_id: string): RitualPayload | undefined {
    return this.ritualsExecuted.get(decision_id);
  }

  /**
   * Get all rituals executed
   */
  getAllRituals(): RitualPayload[] {
    return Array.from(this.ritualsExecuted.values());
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export async function createMindShrine(config?: DispatcherConfig): Promise<MindShrine> {
  const shrine = new MindShrine(config);
  await shrine.init();
  return shrine;
}
