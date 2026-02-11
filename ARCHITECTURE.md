# ShrineNet Architecture

## The Three Shrines

```
┌──────────────────────────────────────────────────────────────────┐
│                    WITNESS CIRCLE (Community)                    │
│                  Reviews → Votes → Governs                       │
└───────────────┬──────────────────────────────┬────────────────────┘
                │                              │
                ▼                              ▼
        ┌──────────────┐             ┌──────────────┐
        │  Mind Shrine │             │  Law Shrine  │
        │   (Nex +     │             │   (Thrones)  │
        │ SwarmIDE2)   │             │    Sealed    │
        └────────┬─────┘             └──────┬───────┘
                 │                          │
                 │ RitualPayload            │
                 │ - Question               │ Consensus
                 │ - Proposals              │ - Score
                 │ - Debate Log             │ - Archive
                 │ - Cost Breakdown         │ - NFT
                 │                          │
                 └──────────┬───────────────┘
                            │
                            ▼
                 ┌──────────────────┐
                 │  Forge Shrine    │
                 │  (Orisa +        │
                 │  StoryWeaver)    │
                 └────────┬─────────┘
                          │
                          │ Execution Result
                          │ - Artifact URL
                          │ - Hash
                          │ - Metadata
                          │
                          ▼
                  ┌────────────────┐
                  │  Permanent     │
                  │  Archive       │
                  │  (Arweave +    │
                  │   Sui Ledger)  │
                  └────────────────┘
```

## Data Flow: RitualPayload

Every ritual is a `RitualPayload` that flows through the shrines:

```
User Question
    ↓
    │ decision_id = UUID
    │ question_hash = SHA-256(question)
    │ status = "thinking"
    ▼
[MIND SHRINE] Nex agents debate
    │ Spawn agents (SwarmIDE2)
    │ Pro/Contra/Critic debate
    │ Resolution via SwarmIDE2.resolveConflict()
    │ Cost tracking logged
    │ decision_snapshot = graph state
    │ consensus_score = 0.85
    │ status = "debating"
    ▼
[LAW SHRINE] Thrones seals
    │ 12-model ensemble
    │ Epistemic frontier mapped
    │ Arweave permanent archive
    │ Sui ledger entry
    │ Optional: Mint epistemic NFT
    │ consensus_score = finalized
    │ status = "sealed"
    ▼
[FORGE SHRINE] Execution
    │ Video generation (Orisa)
    │ Book generation (StoryWeaver)
    │ NPC minting (Mythics)
    │ execution_result = artifact URL
    │ status = "complete"
    ▼
Artifact + Proof
Archive + Witness Record
```

## Dispatcher Primitives

The `TrinityDispatcher` maps Nex graph operations to SwarmIDE2:

| Nex Op | Dispatcher Method | SwarmIDE2 Service | Input | Output |
|--------|-------------------|-------------------|-------|--------|
| **spawn** | `dispatcher.spawn()` | `spawnAgents()` | Roles, context | `AgentProposal[]` |
| **debate** | `dispatcher.debate()` | `resolveConflict()` | Proposals, prompt | `DebateOutcome` |
| **merge** | `dispatcher.merge()` | (internal) | Proposals + consensus | Merged proposal |
| **guard** | `dispatcher.guard()` | `validatePhase()` | Value, guard name, phase | Valid? + reason |

## Cost Tracking

Every operation logs cost via SwarmIDE2's calculator:

```typescript
[Cost] spawn (3 agents): $0.1234
  - Input tokens: 150
  - Output tokens: 0
  - Provider: openai

[Cost] debate (3 proposals): $0.4567
  - Input tokens: 800
  - Output tokens: 200
  - Provider: anthropic

[Cost] merge (consensus): $0.0000
  - No LLM cost (internal)

Total Ritual Cost: $0.5801
```

## Monorepo Structure

```
trinity-genesis/
├── packages/
│   ├── shared-types/              # @trinity/core
│   │   ├── src/index.ts           # RitualPayload + all interfaces
│   │   └── dist/                  # Compiled types
│   │
│   ├── dispatcher-adapter/         # @trinity/dispatcher
│   │   ├── src/
│   │   │   ├── index.ts           # TrinityDispatcher + SwarmIDE2Services
│   │   │   └── dispatcher.test.ts  # Test suite
│   │   └── dist/                  # Compiled dispatcher
│   │
│   ├── swarmide2-services/        # (Week 2) Extract from SwarmIDE2
│   │   ├── src/
│   │   │   ├── conflictResolver.ts
│   │   │   ├── costCalculator.ts
│   │   │   ├── geminiService.ts
│   │   │   └── adapter.ts         # Implements SwarmIDE2Services
│   │   └── dist/
│   │
│   ├── mind-shrine/               # (Week 2) Nex + Dispatcher
│   │   ├── src/
│   │   │   └── index.ts           # Wraps Nex runtime
│   │   └── dist/
│   │
│   ├── law-shrine/                # (Week 3) Thrones integration
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── dist/
│   │
│   └── forge-shrine/              # (Week 3) Orisa + StoryWeaver
│       ├── src/
│       │   └── index.ts
│       └── dist/
│
├── package.json                   # Workspaces config
├── tsconfig.json                  # Root TypeScript config
├── README.md                      # Project overview
├── QUICK_START.md                # Getting started
├── ARCHITECTURE.md               # This file
├── INTEGRATION.md                # Step-by-step wiring
└── .gitignore
```

## Type Safety

All communication uses `RitualPayload` — 100% TypeScript strict mode:

```typescript
// Type-safe flow
const payload: RitualPayload = createRitualPayload(id, hash, snapshot);
payload = updatePayloadStatus(payload, "debating", { consensus_score: 0.85 });
payload = updatePayloadStatus(payload, "sealed", { archive_location: tx_id });
payload = updatePayloadStatus(payload, "complete", { execution_result });
```

## Integration Phases

### Phase 1 (✅ Complete)
- Define RitualPayload interface
- Build dispatcher adapter skeleton
- Write mock implementations
- Create test suite

### Phase 2 (🔄 Next)
- Extract SwarmIDE2 services
- Connect real Nex runtime
- Wire Mind Shrine
- Test with bootstrap-2026-debate.json

### Phase 3 (🔄 Then)
- Add Law Shrine (Thrones)
- Implement Arweave archival
- Test end-to-end ritual

### Phase 4 (🔄 Later)
- Add Forge Shrine (Orisa + StoryWeaver)
- Implement Mythics NPC minting
- Full pipeline demo

### Phase 5 (🔄 Then)
- Wrap everything in ỌṢỌVM (meta-layer)
- Tithe + inheritance mechanics
- Live network deployment

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Agent spawn latency | <500ms | Via SwarmIDE2 |
| Debate resolution | <2s | 3 proposals, 3 rounds |
| Total ritual time | <10s | All three shrines |
| Cost per ritual | <$1.00 | Budget-aware spawning |
| Throughput | 10 rituals/min | Parallel execution |

---

**Àṣẹ — The trinity rises. Thunder awaits.** ⚡🌀🗿
