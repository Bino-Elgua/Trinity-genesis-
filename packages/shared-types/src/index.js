/**
 * @trinity/core — Canonical types for ShrineNet
 *
 * Universal payload envelope for all shrine operations.
 * Each ritual passes through this shape as it moves:
 * Mind Shrine → Law Shrine → Forge Shrine → Back
 */
// ============================================================================
// UTILITY HELPERS
// ============================================================================
export function createRitualPayload(decision_id, question_hash, decision_snapshot) {
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
export function updatePayloadStatus(payload, status, updates) {
    return {
        ...payload,
        status,
        completed_at: status === "complete" || status === "failed" ? new Date().toISOString() : payload.completed_at,
        ...updates,
    };
}
