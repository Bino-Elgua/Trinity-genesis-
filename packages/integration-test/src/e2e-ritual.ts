/**
 * End-to-End Trinity Genesis Ritual Test
 * 
 * Executes a complete ritual pipeline:
 * User Question → Mind Shrine (debate) → Law Shrine (seal) → Forge Shrine (execute)
 * 
 * Run with: npm run test:e2e
 */

import { createMindShrine, NexGraph } from "@trinity/mind-shrine";
import { createLawShrine } from "@trinity/law-shrine";
import { createForgeShrine } from "@trinity/forge-shrine";

// ============================================================================
// SAMPLE NEX GRAPH
// ============================================================================

const SAMPLE_NEX_GRAPH: NexGraph = {
  nodes: [
    {
      id: "entry",
      kind: "goal",
      data: "What is the best approach to distributed AI consensus?",
      orisha: "Ọbàtálá",
    },
    {
      id: "pro_agent",
      kind: "agent",
      data: { role: "engineer", expertise: "distributed systems" },
    },
    {
      id: "contra_agent",
      kind: "agent",
      data: { role: "devops", expertise: "operational concerns" },
    },
    {
      id: "critic_agent",
      kind: "agent",
      data: { role: "critic", expertise: "system critique" },
    },
    {
      id: "debate",
      kind: "merge",
      data: { strategy: "weighted_consensus" },
    },
    {
      id: "guard",
      kind: "guard",
      data: {
        condition: "consensus_score > 0.7",
        consequence: "allow",
      },
    },
    {
      id: "final_merge",
      kind: "merge",
      data: { strategy: "synthesize" },
    },
  ],
  links: [
    { from: "entry", to: "pro_agent", type: "sync" },
    { from: "entry", to: "contra_agent", type: "sync" },
    { from: "entry", to: "critic_agent", type: "sync" },
    { from: "pro_agent", to: "debate", type: "sync" },
    { from: "contra_agent", to: "debate", type: "sync" },
    { from: "critic_agent", to: "debate", type: "sync" },
    { from: "debate", to: "guard", type: "sync" },
    { from: "guard", to: "final_merge", type: "sync" },
  ],
  entry: "entry",
};

// ============================================================================
// MAIN E2E TEST
// ============================================================================

async function runE2ETest(): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║     TRINITY GENESIS — END-TO-END RITUAL TEST          ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  try {
    // =====================================================================
    // STEP 1: USER SUBMITS QUESTION
    // =====================================================================
    const question =
      "What is the best architecture for distributed AI consensus systems?";

    console.log("📖 STEP 1: User Submits Question");
    console.log("─".repeat(56));
    console.log(`Question: ${question}\n`);

    // =====================================================================
    // STEP 2: MIND SHRINE (Debate via Nex + SwarmIDE2)
    // =====================================================================
    console.log("\n🧠 STEP 2: MIND SHRINE (Agent Reasoning & Debate)");
    console.log("─".repeat(56));

    const mind = await createMindShrine({
      use_swarmide2: true,
      enable_cost_tracking: true,
      enable_caching: false,
      max_parallel_agents: 5,
      conflict_resolution_strategy: "meta_reasoning",
    });

    const mind_payload = await mind.executeRitual(SAMPLE_NEX_GRAPH, question);

    console.log("\n✅ Mind Shrine Output:");
    console.log(`   Decision ID: ${mind_payload.decision_id}`);
    console.log(`   Status: ${mind_payload.status}`);
    console.log(`   Consensus Score: ${mind_payload.consensus_score || 0.75}`);
    console.log(
      `   Cost: $${mind_payload.cost_breakdown?.total_cost_usd?.toFixed(4) || 0.0}`
    );

    // =====================================================================
    // STEP 3: LAW SHRINE (Consensus Seal via Twelve Thrones)
    // =====================================================================
    console.log("\n⚖️  STEP 3: LAW SHRINE (Consensus Seal)");
    console.log("─".repeat(56));

    const law = createLawShrine();
    const law_payload = await law.sealRitual(mind_payload);

    console.log("\n✅ Law Shrine Output:");
    console.log(`   Status: ${law_payload.status}`);
    console.log(`   Consensus Score: ${law_payload.consensus_score}`);
    console.log(`   Archive (Arweave): ${law_payload.archive_location?.slice(0, 20)}...`);
    console.log(`   Orisha Note: ${law_payload.orisha_note}`);

    // =====================================================================
    // STEP 4: FORGE SHRINE (Execution via Orisa + StoryWeaver)
    // =====================================================================
    console.log("\n⚡ STEP 4: FORGE SHRINE (Artifact Generation)");
    console.log("─".repeat(56));

    const forge = createForgeShrine();
    const final_payload = await forge.executeRitual(law_payload, [
      "video",
      "book",
      "npc",
    ]);

    console.log("\n✅ Forge Shrine Output:");
    console.log(`   Status: ${final_payload.status}`);
    if (final_payload.execution_result) {
      console.log(
        `   Artifact: ${final_payload.execution_result.artifact_type}`
      );
      console.log(
        `   URL: ${final_payload.execution_result.artifact_url.slice(0, 40)}...`
      );
      console.log(
        `   Hash: ${final_payload.execution_result.artifact_hash.slice(0, 20)}...`
      );
      console.log(
        `   Time: ${final_payload.execution_result.execution_time_ms}ms`
      );
    }

    // =====================================================================
    // STEP 5: COMPLETE RITUAL SUMMARY
    // =====================================================================
    console.log("\n📊 COMPLETE RITUAL SUMMARY");
    console.log("═".repeat(56));

    console.log(`\nDecision ID:        ${final_payload.decision_id}`);
    console.log(`Question Hash:      ${final_payload.question_hash.slice(0, 16)}...`);
    console.log(`Final Status:       ${final_payload.status}`);
    console.log(
      `Consensus Score:    ${final_payload.consensus_score?.toFixed(3)}`
    );
    console.log(`Archive Location:   ${final_payload.archive_location}`);
    console.log(`Witness NFT:        ${final_payload.witness_nft_id || "pending"}`);

    if (final_payload.cost_breakdown) {
      console.log(`\nCost Breakdown:`);
      console.log(
        `  Total:              $${final_payload.cost_breakdown.total_cost_usd?.toFixed(4)}`
      );
      if (final_payload.cost_breakdown.by_operation) {
        for (const [op, cost] of Object.entries(
          final_payload.cost_breakdown.by_operation
        )) {
          if (cost > 0) {
            console.log(`    ${op}:            $${(cost as number).toFixed(4)}`);
          }
        }
      }
    }

    console.log(`\nOrisha Notes:`);
    console.log(`  ${final_payload.orisha_note}`);

    // =====================================================================
    // STEP 6: VERIFICATION
    // =====================================================================
    console.log("\n✅ RITUAL COMPLETE");
    console.log("═".repeat(56));

    const success =
      final_payload.status === "complete" && final_payload.consensus_score! > 0;

    if (success) {
      console.log("\n✅ All shrines executed successfully!");
      console.log("   ✓ Mind Shrine: Debate complete");
      console.log("   ✓ Law Shrine: Consensus sealed");
      console.log("   ✓ Forge Shrine: Artifacts generated");
      console.log("\n   Àṣẹ — The ritual manifests. ⚡🌀🗿\n");
    } else {
      console.log("\n❌ Ritual encountered issues");
      console.log(`   Final status: ${final_payload.status}`);
    }

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("\n❌ FATAL ERROR:");
    console.error(error);
    process.exit(1);
  }
}

// Run test
runE2ETest();
