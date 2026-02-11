/**
 * @trinity/core — Canonical types for ShrineNet
 * 
 * Universal payload envelope for all shrine operations.
 * Each ritual passes through this shape as it moves:
 * Mind Shrine → Law Shrine → Forge Shrine → Back
 */

// ============================================================================
// RITUAL PAYLOAD — The Universal Envelope
// ============================================================================

export interface RitualPayload {
  /** Unique identifier for this ritual execution */
  decision_id: string;

  /** SHA-256 hash of the original question/prompt */
  question_hash: string;

  /** The debate/decision state from Mind Shrine (Nex graph snapshot) */
  decision_snapshot: Record<string, any>;

  /** Metadata about the ritual (agents involved, phases, timestamps) */
  ritual_metadata: RitualMetadata;

  /** Weighted consensus score (0-1) from Law Shrine */
  consensus_score: number;

  /** Execution result from Forge Shrine (artifact URL, hash, etc) */
  execution_result?: ExecutionResult;

  /** Cost breakdown across all phases */
  cost_breakdown?: CostBreakdown;

  /** Optional note about Orisha participation (guards, merges, etc) */
  orisha_note?: string;

  /** Timestamp when ritual started */
  created_at: string;

  /** Timestamp when ritual completed */
  completed_at?: string;

  /** Current status in pipeline */
  status: "thinking" | "debating" | "sealed" | "executing" | "complete" | "failed";

  /** Error message if status === "failed" */
  error?: string;

  /** Archive location (Arweave, Sui ledger, etc) */
  archive_location?: string;

  /** If minted as NFT/NPC, store reference */
  witness_nft_id?: string;
}

// ============================================================================
// MIND SHRINE — Agent Reasoning & Debate
// ============================================================================

export interface AgentDebateInput {
  question: string;
  agent_count: number;
  debate_style: "pro_contra_critic" | "voting" | "hierarchical" | "meta_reasoning";
  max_iterations: number;
}

export interface AgentProposal {
  agent_id: string;
  agent_role: "engineer" | "devops" | "qa" | "architect" | "critic";
  proposal: Record<string, any>;
  confidence: number;
  reasoning: string;
}

export interface DebateOutcome {
  winner_proposal: AgentProposal;
  all_proposals: AgentProposal[];
  resolution_method: string;
  resolution_rationale: string;
  consensus_score: number;
  total_cost_usd: number;
}

export interface RitualMetadata {
  shrine: "mind" | "law" | "forge";
  phase: number;
  agents_spawned: number;
  debate_iterations: number;
  models_used: string[];
  start_time: number; // ms since epoch
  end_time?: number;
  execution_time_ms?: number;
}

// ============================================================================
// LAW SHRINE — Consensus & Verification
// ============================================================================

export interface ConsensusRequest {
  question_hash: string;
  proposals: AgentProposal[];
  ensemble_size: number; // 12 for Twelve Thrones
  consensus_threshold: number; // 0-1
}

export interface ConsensusResult {
  is_consensus_reached: boolean;
  consensus_score: number;
  winning_proposal: Record<string, any>;
  epistemic_frontier: string[]; // Areas of disagreement
  arweave_tx_id?: string;
  sui_ledger_entry?: string;
}

// ============================================================================
// FORGE SHRINE — Execution & Artifact Generation
// ============================================================================

export interface ExecutionRequest {
  ritual_payload: RitualPayload;
  execution_type: "video" | "book" | "npc_mint" | "data_process" | "custom";
  target_platform: "local" | "akash" | "aws" | "custom";
  timeout_seconds: number;
}

export interface ExecutionResult {
  execution_id: string;
  artifact_url: string;
  artifact_hash: string;
  artifact_type: string;
  execution_time_ms: number;
  success: boolean;
  metadata: Record<string, any>;
}

// ============================================================================
// COST TRACKING (SwarmIDE2 Integration)
// ============================================================================

export interface CostBreakdown {
  total_cost_usd: number;
  by_provider: Record<string, number>;
  by_operation: Record<string, number>;
  by_phase: Record<string, number>;
  timestamp: string;
}

export interface CostLog {
  ritual_id: string;
  operation: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  timestamp: string;
}

// ============================================================================
// SWARMIDE2 SERVICES INTERFACE
// ============================================================================

export interface SwarmIDE2Services {
  /**
   * Spawn agents of given roles
   */
  spawnAgents(roles: string[], context: Record<string, any>): Promise<AgentProposal[]>;

  /**
   * Estimate cost of proposals
   */
  estimateCost(proposals: AgentProposal[]): Promise<number>;

  /**
   * Resolve conflicting proposals
   */
  resolveConflict(
    proposals: AgentProposal[],
    strategy: string,
    prompt: string,
    max_rounds: number
  ): Promise<DebateOutcome>;

  /**
   * Validate value against guard rules (phases 1-7)
   */
  validatePhase(
    value: any,
    guard_name: string,
    phase: number
  ): Promise<{ valid: boolean; reason: string; cost?: number }>;
}

// ============================================================================
// DISPATCHER ADAPTER — Maps Nex→SwarmIDE2
// ============================================================================

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
// GUARD INTERFACE (Enhanced with SwarmIDE2 validation)
// ============================================================================

export interface Guard {
  name: string;
  validate(value: any, context?: Record<string, any>): Promise<boolean>;
  description?: string;
  phase?: number;
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

export function createRitualPayload(
  decision_id: string,
  question_hash: string,
  decision_snapshot: Record<string, any>
): RitualPayload {
  return {
    decision_id,
    question_hash,
    decision_snapshot,
    ritual_metadata: {
      shrine: "mind",
      phase: 1,
      agents_spawned: 0,
      debate_iterations: 0,
      models_used: [],
      start_time: Date.now(),
    },
    consensus_score: 0,
    status: "thinking",
    created_at: new Date().toISOString(),
  };
}

export function updatePayloadStatus(
  payload: RitualPayload,
  status: RitualPayload["status"],
  updates?: Partial<RitualPayload>
): RitualPayload {
  return {
    ...payload,
    status,
    completed_at: status === "complete" || status === "failed" ? new Date().toISOString() : payload.completed_at,
    ...updates,
  };
}
