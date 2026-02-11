# Integration Guide: Nex + SwarmIDE2 → Trinity Dispatcher

This document explains how to wire the real Nex runtime and SwarmIDE2 services into the Trinity dispatcher.

## Current State

- ✅ **@trinity/core** — RitualPayload interface defined
- ✅ **@trinity/dispatcher** — Adapter skeleton + mock implementations
- 🔴 **Real Nex** — Not yet connected
- 🔴 **Real SwarmIDE2** — Not yet connected

## Step 1: Extract SwarmIDE2 Services

Copy SwarmIDE2's business logic into a new package:

```bash
mkdir packages/swarmide2-services
# Copy from ../../SwarmIDE2/services/ into packages/swarmide2-services/src/
```

Key files to import:
- `conflictResolver.ts`
- `costCalculator.ts`
- `geminiService.ts`
- `multiModelSynthesis.ts`
- All LLM provider services

Wrap them in an adapter that implements `SwarmIDE2Services` interface:

```typescript
// packages/swarmide2-services/src/adapter.ts
import {
  resolveConflictingProposals,
  calculateTokenCost,
} from "./conflictResolver";
import { SwarmIDE2Services } from "@trinity/core";

export class RealSwarmIDE2Services implements SwarmIDE2Services {
  async spawnAgents(roles: string[], context: any) {
    // Call SwarmIDE2's agent recruitment logic
    return await recruiteAgents(roles, context);
  }

  async resolveConflict(proposals, strategy, prompt, max_rounds) {
    // Call SwarmIDE2's conflict resolver
    return await resolveConflictingProposals(proposals, strategy, prompt);
  }

  async estimateCost(proposals) {
    return await calculateTokenCost(proposals);
  }

  async validatePhase(value, guard_name, phase) {
    // Route through SwarmIDE2's phase validators
    return await validatePhase(value, phase);
  }
}
```

## Step 2: Connect Nex Runtime

Create a Mind Shrine that wraps Nex:

```bash
mkdir packages/mind-shrine
```

```typescript
// packages/mind-shrine/src/index.ts
import { nex_runtime } from "../../Nex"; // Import real Nex
import { TrinityDispatcher } from "@trinity/dispatcher";

export class MindShrine {
  private dispatcher: TrinityDispatcher;
  private nex: NexRuntime;

  constructor(dispatcher: TrinityDispatcher, nex: NexRuntime) {
    this.dispatcher = dispatcher;
    this.nex = nex;
  }

  /**
   * Execute a Nex graph through the dispatcher
   */
  async executeRitual(graph_json: any, question: string): Promise<RitualPayload> {
    const payload = this.dispatcher.getRitualPayload();
    payload.question_hash = sha256(question);
    payload.status = "thinking";

    // Feed graph to real Nex runtime
    const nex_result = await this.nex.execute(graph_json);

    // Extract proposals from Nex output
    const proposals = extractProposals(nex_result);

    // Route through dispatcher debate
    const debate_outcome = await this.dispatcher.debate(proposals, question);

    payload.decision_snapshot = nex_result;
    payload.consensus_score = debate_outcome.consensus_score;
    payload.status = "debating";

    return payload;
  }
}
```

## Step 3: Run Bootstrap Graph

Test the pipeline with the existing bootstrap debate:

```typescript
// test/bootstrap-ritual.test.ts
import { MindShrine } from "@trinity/mind-shrine";
import { TrinityDispatcher, RealSwarmIDE2Services } from "@trinity/dispatcher";
import * as fs from "fs";

const bootstrap_json = JSON.parse(
  fs.readFileSync("../../Nex/bootstrap-2026-debate.json", "utf-8")
);

it("should execute bootstrap debate through dispatcher", async () => {
  const dispatcher = new TrinityDispatcher({
    use_swarmide2: true,
    enable_cost_tracking: true,
    max_parallel_agents: 5,
    conflict_resolution_strategy: "meta_reasoning",
  });

  const swarmide2 = new RealSwarmIDE2Services();
  await dispatcher.init(swarmide2);

  const mind = new MindShrine(dispatcher, nex_runtime);
  const payload = await mind.executeRitual(bootstrap_json, "Should we integrate SwarmIDE2?");

  expect(payload.consensus_score).toBeGreaterThan(0.7);
  expect(payload.status).toBe("debating");

  const { total } = dispatcher.getCostSummary();
  console.log(`Total ritual cost: $${total.toFixed(4)}`);
});
```

## Step 4: Add Law Shrine (Thrones)

Create a shrine for consensus sealing:

```typescript
// packages/law-shrine/src/index.ts
import { TwelveThrones } from "../../twelve-thrones-genesis";
import { RitualPayload } from "@trinity/core";

export class LawShrine {
  private thrones: TwelveThrones;

  async sealRitual(payload: RitualPayload): Promise<RitualPayload> {
    payload.status = "sealed";

    // Extract decision from Mind Shrine output
    const decision = payload.decision_snapshot;

    // Seal on blockchain via Thrones
    const consensus_result = await this.thrones.createRitual({
      question_hash: payload.question_hash,
      proposals: decision.proposals,
      ensemble_size: 12,
      consensus_threshold: 0.8,
    });

    payload.consensus_score = consensus_result.consensus_score;
    payload.archive_location = consensus_result.arweave_tx_id;

    return payload;
  }
}
```

## Step 5: Add Forge Shrine (Orisa)

Create a shrine for execution:

```typescript
// packages/forge-shrine/src/index.ts
import { OrosaLoom } from "../../eternal-orisa-loom-v8";
import { StoryWeaver } from "../../storyweaver";

export class ForgeShrine {
  private loom: OrosaLoom;
  private weaver: StoryWeaver;

  async execute(payload: RitualPayload, execution_type: string): Promise<RitualPayload> {
    payload.status = "executing";

    switch (execution_type) {
      case "video":
        const video_result = await this.loom.generateBeat(payload.decision_snapshot);
        payload.execution_result = video_result;
        break;

      case "book":
        const book_result = await this.weaver.generateBook(payload.decision_snapshot);
        payload.execution_result = book_result;
        break;
    }

    payload.status = "complete";
    return payload;
  }
}
```

## Step 6: End-to-End Test

Wire all three shrines together:

```typescript
// test/trinity-e2e.test.ts
import { MindShrine } from "@trinity/mind-shrine";
import { LawShrine } from "@trinity/law-shrine";
import { ForgeShrine } from "@trinity/forge-shrine";

it("should execute full ritual: Mind → Law → Forge", async () => {
  const dispatcher = new TrinityDispatcher(/* config */);
  const mind = new MindShrine(dispatcher);
  const law = new LawShrine();
  const forge = new ForgeShrine();

  // Phase 1: Think
  let payload = await mind.executeRitual(bootstrap_json, "A question");

  // Phase 2: Seal
  payload = await law.sealRitual(payload);

  // Phase 3: Forge
  payload = await forge.execute(payload, "video");

  expect(payload.status).toBe("complete");
  expect(payload.execution_result).toBeDefined();
  expect(payload.archive_location).toBeDefined();
});
```

## Checklist

- [ ] SwarmIDE2 services extracted → `packages/swarmide2-services`
- [ ] RealSwarmIDE2Services adapter written
- [ ] MindShrine wires Nex + dispatcher
- [ ] bootstrap-2026-debate.json runs through dispatcher
- [ ] Costs logged correctly (111+ tests pass + new cost logs)
- [ ] LawShrine implemented
- [ ] ForgeShrine implemented
- [ ] End-to-end ritual test passes
- [ ] Ritual outputs archived to Arweave
- [ ] Mythics NPCs can be minted from payload (Phase 2 prep)

---

**Timeline:** Week 1-2 for extraction, Week 2-3 for wiring, Week 3 for validation.
