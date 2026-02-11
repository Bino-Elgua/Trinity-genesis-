# Trinity Genesis — ShrineNet Foundation

**Status:** Phase 1 Scaffold (Dispatcher + Core Types Ready)

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

## Integration Path

### Week 1 (Current)
✅ Define RitualPayload + core types
✅ Build dispatcher adapter scaffold
✅ Write fallback (mock) implementations
✅ Get tests passing

### Week 2
- [ ] Connect real Nex runtime to dispatcher
- [ ] Import SwarmIDE2 services
- [ ] Replace mock implementations
- [ ] Run bootstrap-2026-debate.json through pipeline

### Week 3
- [ ] Add Twelve Thrones consensus validation
- [ ] Implement Arweave archival
- [ ] Test end-to-end ritual (Nex → Thrones → Orisa)

### Week 4
- [ ] Mythics NPC minting on ritual completion
- [ ] StoryWeaver book generation from debate outputs
- [ ] Dashboard visualization of ritual pipeline

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

## Next Steps

1. **Wire Nex Runtime** — Replace mock spawn/debate with real Nex agents
2. **Integrate SwarmIDE2** — Add `services/` from SwarmIDE2 repo
3. **Test Bootstrap Graph** — Run existing Nex debate through dispatcher
4. **Seal with Thrones** — Push ritual outcomes to Twelve Thrones

---

**Àṣẹ** — The anvil is forged. Ready for thunder? ⚡🌀🗿
