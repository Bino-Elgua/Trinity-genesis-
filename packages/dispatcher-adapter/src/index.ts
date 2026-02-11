/**
 * Dispatcher Adapter — Maps Nex Primitives → SwarmIDE2 Services
 * 
 * This layer sits between Nex's graph runtime and SwarmIDE2's agent orchestration.
 * It translates Nex operations (spawn, debate, merge, guard) into SwarmIDE2 phases.
 */

import {
  RitualPayload,
  AgentProposal,
  DebateOutcome,
  CostLog,
  SwarmIDE2Services,
  createRitualPayload,
  updatePayloadStatus,
} from "@trinity/core";

export interface DispatcherConfig {
  use_swarmide2: boolean;
  enable_cost_tracking: boolean;
  enable_caching: boolean;
  max_parallel_agents: number;
  conflict_resolution_strategy: "voting" | "hierarchical" | "meta_reasoning" | "user";
}

export interface DispatcherContext {
  config: DispatcherConfig;
  ritual_payload: RitualPayload;
  active_agents: Map<string, AgentProposal>;
  cost_logs: CostLog[];
}

// ============================================================================
// DISPATCHER — Main orchestration engine
// ============================================================================

export class TrinityDispatcher {
  private config: DispatcherConfig;
  private context: DispatcherContext;
  private swarmide2Services: SwarmIDE2Services | null = null;

  constructor(config: DispatcherConfig) {
    this.config = config;
    this.context = {
      config,
      ritual_payload: createRitualPayload("", "", {}),
      active_agents: new Map(),
      cost_logs: [],
    };
  }

  /**
   * Initialize dispatcher with optional SwarmIDE2 services
   */
  async init(swarmide2Services?: SwarmIDE2Services | null): Promise<void> {
    if (swarmide2Services) {
      this.swarmide2Services = swarmide2Services;
    }
    console.log("[Dispatcher] Initialized with config:", this.config);
  }

  /**
   * SPAWN primitive: Create new agents via SwarmIDE2
   */
  async spawn(
    agent_roles: string[],
    context_snapshot: Record<string, any>,
    budget_usd?: number
  ): Promise<AgentProposal[]> {
    const spawn_id = generateId();
    console.log(`[Dispatcher:Spawn] ${spawn_id} — Creating ${agent_roles.length} agents`);

    if (!this.swarmide2Services) {
      // Fallback: mock spawn
      return agent_roles.map((role) => ({
        agent_id: generateId(),
        agent_role: role as any,
        proposal: { role, context: context_snapshot },
        confidence: 0.8,
        reasoning: "[Mock] Agent proposal (SwarmIDE2 not initialized)",
      }));
    }

    // Route to SwarmIDE2
    const proposals = await this.swarmide2Services.spawnAgents(agent_roles, context_snapshot);
    const cost = await this.swarmide2Services.estimateCost(proposals);

    if (budget_usd && cost > budget_usd) {
      console.warn(`[Dispatcher:Spawn] Cost ${cost} exceeds budget ${budget_usd}`);
    }

    this.context.active_agents = new Map(proposals.map((p) => [p.agent_id, p]));
    this.logCost("spawn", "swarmide2", proposals.length, 0, cost);

    return proposals;
  }

  /**
   * DEBATE primitive: Conflict resolution via SwarmIDE2
   */
  async debate(
    proposals: AgentProposal[],
    original_prompt: string,
    max_rounds: number = 3
  ): Promise<DebateOutcome> {
    const debate_id = generateId();
    console.log(`[Dispatcher:Debate] ${debate_id} — Resolving ${proposals.length} proposals`);

    if (!this.swarmide2Services) {
      // Fallback: simple voting
      const winner = proposals.reduce((a, b) => (a.confidence > b.confidence ? a : b));
      return {
        winner_proposal: winner,
        all_proposals: proposals,
        resolution_method: "mock_voting",
        resolution_rationale: "[Mock] Picked highest confidence (SwarmIDE2 not initialized)",
        consensus_score: winner.confidence,
        total_cost_usd: 0,
      };
    }

    // Route to SwarmIDE2 conflict resolver
    const outcome = await this.swarmide2Services.resolveConflict(
      proposals,
      this.config.conflict_resolution_strategy,
      original_prompt,
      max_rounds
    );

    this.context.ritual_payload.consensus_score = outcome.consensus_score;
    this.logCost("debate", "swarmide2", proposals.length, 0, outcome.total_cost_usd);

    return outcome;
  }

  /**
   * MERGE primitive: Combine proposals with consensus
   */
  async merge(
    proposals: AgentProposal[],
    consensus_score: number
  ): Promise<Record<string, any>> {
    console.log(`[Dispatcher:Merge] Merging ${proposals.length} proposals (consensus: ${consensus_score})`);

    const merged = {
      consensus_score,
      timestamp: new Date().toISOString(),
      proposals_merged: proposals.length,
      merged_proposal: proposals
        .reduce((acc, p, i) => {
          const weight = p.confidence;
          return { ...acc, [`proposal_${i}`]: p.proposal, [`weight_${i}`]: weight };
        }, {}),
    };

    this.logCost("merge", "swarmide2", proposals.length, 0, 0);
    return merged;
  }

  /**
   * GUARD primitive: Validation via SwarmIDE2 phases
   */
  async guard(
    value: any,
    guard_name: string,
    phase: number
  ): Promise<{ valid: boolean; reason: string }> {
    console.log(`[Dispatcher:Guard] ${guard_name} (phase ${phase})`);

    if (!this.swarmide2Services) {
      return { valid: true, reason: "[Mock] Guard passed (SwarmIDE2 not initialized)" };
    }

    const result = await this.swarmide2Services.validatePhase(value, guard_name, phase);
    this.logCost("guard", "swarmide2", 1, 0, result.cost || 0);

    return result;
  }

  /**
   * Get current ritual payload
   */
  getRitualPayload(): RitualPayload {
    return this.context.ritual_payload;
  }

  /**
   * Get cost summary
   */
  getCostSummary(): { total: number; logs: CostLog[] } {
    const total = this.context.cost_logs.reduce((sum, log) => sum + log.cost_usd, 0);
    return { total, logs: this.context.cost_logs };
  }

  /**
   * Internal: Log cost of operation
   */
  private logCost(
    operation: string,
    provider: string,
    input_tokens: number,
    output_tokens: number,
    cost_usd: number
  ): void {
    const log: CostLog = {
      ritual_id: this.context.ritual_payload.decision_id,
      operation,
      provider,
      input_tokens,
      output_tokens,
      cost_usd,
      timestamp: new Date().toISOString(),
    };
    this.context.cost_logs.push(log);
    console.log(`[Cost] ${operation}: $${cost_usd.toFixed(4)}`);
  }
}



// ============================================================================
// MOCK IMPLEMENTATION for testing
// ============================================================================

export class MockSwarmIDE2Services implements SwarmIDE2Services {
  async spawnAgents(roles: string[]): Promise<AgentProposal[]> {
    return roles.map((role) => ({
      agent_id: generateId(),
      agent_role: role as any,
      proposal: { role, timestamp: Date.now() },
      confidence: Math.random() * 0.3 + 0.7,
      reasoning: `Mock agent with role: ${role}`,
    }));
  }

  async estimateCost(): Promise<number> {
    return Math.random() * 0.50 + 0.10;
  }

  async resolveConflict(proposals: AgentProposal[]): Promise<DebateOutcome> {
    const winner = proposals.reduce((a, b) => (a.confidence > b.confidence ? a : b));
    return {
      winner_proposal: winner,
      all_proposals: proposals,
      resolution_method: "mock_voting",
      resolution_rationale: "Mock resolution selected highest confidence",
      consensus_score: winner.confidence,
      total_cost_usd: 0.25,
    };
  }

  async validatePhase(value: any, guard_name: string): Promise<{
    valid: boolean;
    reason: string;
    cost?: number;
  }> {
    return {
      valid: !!value,
      reason: `Mock validation for ${guard_name}`,
      cost: 0.05,
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export { generateId };
