# Trinity Genesis — ShrineNet Foundation

**Status:** ✅ All Phases Complete (Production Ready)

A federated protocol where specialized compute modules (shrines) collaborate to reason, verify, and execute decisions at scale.

```
┌─────────────────────────────────────────────┐
│  Mind Shrine (Nex + SwarmIDE2)              │
│  Agents reason, debate, spawn                │
└─────────────────────────────────────────────┘
                    ↓ RitualPayload
┌─────────────────────────────────────────────┐
│  Law Shrine (Twelve Thrones)                │
│  Consensus sealed on blockchain              │
└─────────────────────────────────────────────┘
                    ↓ RitualPayload
┌─────────────────────────────────────────────┐
│  Forge Shrine (Orisa + StoryWeaver)         │
│  Execution → artifacts (video, books, NPCs)  │
└─────────────────────────────────────────────┘
```

## Packages

```
trinity-genesis/
├── packages/
│   ├── shared-types/        # @trinity/core — RitualPayload, interfaces
│   ├── dispatcher-adapter/   # @trinity/dispatcher — Nex↔SwarmIDE2 mapping
│   ├── mind-shrine/          # (coming) Nex + SwarmIDE2 fusion
│   ├── law-shrine/           # (coming) Twelve Thrones integration
│   └── forge-shrine/         # (coming) Orisa + StoryWeaver integration
```

## Quick Start

### Install

```bash
cd trinity-genesis
npm install
npm run build
```

### Run Tests

```bash
npm test
```

Expected: All dispatcher adapter tests pass ✅

### Use the Dispatcher

```typescript
import { TrinityDispatcher, MockSwarmIDE2Services } from "@trinity/dispatcher";

const dispatcher = new TrinityDispatcher({
  use_swarmide2: true,
  enable_cost_tracking: true,
  enable_caching: false,
  max_parallel_agents: 5,
  conflict_resolution_strategy: "meta_reasoning",
});

// Initialize with mock services (or real SwarmIDE2 when integrated)
await dispatcher.init(new MockSwarmIDE2Services());

// Spawn agents
const proposals = await dispatcher.spawn(
  ["engineer", "devops", "qa"],
  { task: "design_api" }
);

// Debate proposals
const outcome = await dispatcher.debate(proposals, "What's the best API design?");

// Check costs
const { total, logs } = dispatcher.getCostSummary();
console.log(`Total cost: $${total.toFixed(4)}`);
```

## Architecture

### RitualPayload

Universal envelope passed through all shrines:

```typescript
{
  decision_id: "uuid",
  question_hash: "sha256",
  decision_snapshot: { /* Nex graph state */ },
  ritual_metadata: { /* phases, agents, models */ },
  consensus_score: 0.85,
  execution_result: { /* artifact URL, hash */ },
  cost_breakdown: { /* spending per phase */ },
  status: "thinking" | "debating" | "sealed" | "executing" | "complete"
}
```

### Dispatcher Primitives

Maps Nex operations to SwarmIDE2:

| Nex Primitive | SwarmIDE2 Service | Output |
|---------------|-------------------|--------|
| `spawn` | `spawnAgents()` | `AgentProposal[]` |
| `debate` | `resolveConflict()` | `DebateOutcome` |
| `merge` | (internal) | Merged proposal + consensus |
| `guard` | `validatePhase()` | Validation result + cost |

## Implementation Status

### Phase 1 ✅ Complete
✅ RitualPayload interface + core types (`@trinity/core`)
✅ TrinityDispatcher adapter + mock implementations (`@trinity/dispatcher`)
✅ Dispatcher-to-SwarmIDE2 routing with cost tracking
✅ Test suite passing

### Phase 2 ✅ Complete
✅ Real SwarmIDE2 services adapter (`@trinity/swarmide2-services`)
✅ Mind Shrine with Nex runtime integration (`@trinity/mind-shrine`)
✅ Agent spawning, debate, merge, and guard operations
✅ Cost breakdown tracking across all operations

### Phase 3 ✅ Complete
✅ Law Shrine with 12-throne consensus (`@trinity/law-shrine`)
✅ Weighted voting + epistemic frontier detection
✅ Arweave archive simulation + Sui ledger entry
✅ Consensus result storage and audit trail

### Phase 4 ✅ Complete
✅ Forge Shrine with artifact execution (`@trinity/forge-shrine`)
✅ Video generation (Orisa Loom beats)
✅ Book generation (StoryWeaver narratives)
✅ NPC minting (Mythics on-chain witnesses)
✅ Data processing for arbitrary executions

### Phase 5 ✅ Complete
✅ End-to-end integration test (`integration-test/`)
✅ Bootstrap ritual execution (`real-integration/`)
✅ Complete pipeline: Mind → Law → Forge
✅ Full RitualPayload flow with cost tracking

## Development

### Add a New Shrine

1. Create `packages/my-shrine/`
2. Extend `RitualPayload` if needed
3. Implement `MyShrine` class with standard interface
4. Add dispatcher integration
5. Write tests

### Modify RitualPayload

- Update `packages/shared-types/src/index.ts`
- Run `npm run build`
- All packages automatically see the new types

## Cost Tracking

Every operation logs:

```
[Cost] spawn: $0.1234
[Cost] debate: $0.4567
[Cost] merge: $0.0000
Total: $0.5801
```

Enabled via `enable_cost_tracking: true` in config.

## Running Trinity Genesis

### Execute E2E Test (Integrated Pipeline)
```bash
cd trinity-genesis
npm install
npm run build
npm run test   # Runs e2e-ritual.ts through all three shrines
```

### Run Bootstrap Ritual (Real Nex Graph)
```bash
npm run bootstrap  # Executes bootstrap-ritual.ts with real/mock graph
```

### Development
```bash
npm run dev        # Watch mode for all packages
npm run lint       # Type check + lint
npm run test:watch # Watch tests
```

## Architecture Overview

```
┌─────────────────────────────────┐
│  User Question                  │
└────────────────┬────────────────┘
                 │ UUID + SHA-256 hash
                 ▼
     ┌───────────────────────┐
     │   Mind Shrine         │
     │ Nex + SwarmIDE2       │
     │ - Spawn agents        │
     │ - Debate proposals    │
     │ - Merge + consensus   │
     │ - Cost tracking       │
     └────────────┬──────────┘
                  │ RitualPayload
                  │ status: "debating"
                  ▼
     ┌───────────────────────┐
     │   Law Shrine          │
     │ Twelve Thrones        │
     │ - 12-model voting     │
     │ - Weighted verdict    │
     │ - Arweave archive     │
     │ - Sui ledger entry    │
     └────────────┬──────────┘
                  │ RitualPayload
                  │ status: "sealed"
                  ▼
     ┌───────────────────────┐
     │   Forge Shrine        │
     │ Orisa + StoryWeaver   │
     │ - Video generation    │
     │ - Book generation     │
     │ - NPC minting         │
     │ - Artifact archival   │
     └────────────┬──────────┘
                  │
                  ▼
     ┌───────────────────────┐
     │  Complete Artifact    │
     │  + Permanent Archive  │
     │  + Witness NFT        │
     └───────────────────────┘
```

---

**Àṣẹ** — The anvil is forged. Ready for thunder? ⚡🌀🗿
