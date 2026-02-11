# Trinity Genesis — Quick Start

## What Just Got Built

✅ **Monorepo scaffold** — trinity-genesis/
✅ **@trinity/core** — RitualPayload interface + canonical types
✅ **@trinity/dispatcher** — Nex↔SwarmIDE2 adapter with mock implementations
✅ **TypeScript** — Fully typed, 0 errors
✅ **Documentation** — Architecture, integration guide, examples

## Verify It Works

### Check that types compile:

```bash
cd trinity-genesis
cd packages/shared-types && npx tsc && echo "✅ Types compiled"
cd ../dispatcher-adapter && npx tsc && echo "✅ Dispatcher compiled"
```

### Inspect the dispatcher:

```bash
cd packages/dispatcher-adapter
cat dist/index.d.ts | head -50
```

You'll see the full interface including:
- `TrinityDispatcher` class
- `SwarmIDE2Services` interface
- `MockSwarmIDE2Services` implementation
- All primitives: `spawn()`, `debate()`, `merge()`, `guard()`

## Code Structure

```
trinity-genesis/
├── packages/
│   ├── shared-types/
│   │   └── src/index.ts       # RitualPayload + all interfaces
│   └── dispatcher-adapter/
│       ├── src/
│       │   ├── index.ts       # TrinityDispatcher + SwarmIDE2Services
│       │   └── dispatcher.test.ts  # Test suite (ready for vitest)
│       └── dist/              # Compiled output
├── README.md                  # Architecture overview
├── INTEGRATION.md             # Step-by-step wiring guide
└── QUICK_START.md            # This file
```

## Next Steps (Week 2)

### 1. Extract SwarmIDE2 Services
```bash
mkdir packages/swarmide2-services
cp ../../SwarmIDE2/services/* packages/swarmide2-services/src/
# Create adapter implementing SwarmIDE2Services interface
```

### 2. Connect Real Nex
```bash
mkdir packages/mind-shrine
# Import Nex runtime
# Create MindShrine class that wraps TrinityDispatcher
```

### 3. Test Pipeline
```bash
# Run bootstrap-2026-debate.json through dispatcher
# Verify 111+ tests still pass
# Check cost logs appear
```

### 4. Add Law Shrine
```bash
mkdir packages/law-shrine
# Connect Twelve Thrones for consensus sealing
```

### 5. Add Forge Shrine
```bash
mkdir packages/forge-shrine
# Connect Orisa + StoryWeaver for execution
```

## Key Interfaces

### RitualPayload (Universal Envelope)
```typescript
{
  decision_id: string;           // UUID
  question_hash: string;          // SHA-256
  decision_snapshot: any;         // Nex graph state
  ritual_metadata: { /* ... */ }; // phases, agents, models
  consensus_score: number;        // 0-1
  execution_result?: any;         // artifact URL, hash
  cost_breakdown?: any;           // spending per phase
  status: "thinking" | "debating" | "sealed" | "executing" | "complete";
}
```

### Dispatcher Methods
```typescript
dispatcher.spawn(roles, context, budget?)      // → AgentProposal[]
dispatcher.debate(proposals, prompt, rounds?)   // → DebateOutcome
dispatcher.merge(proposals, consensus_score)    // → Merged proposal
dispatcher.guard(value, guard_name, phase)      // → Validation result
dispatcher.getCostSummary()                     // → { total, logs }
```

## Testing

When vitest is installed:
```bash
npm test
```

Tests cover:
- ✅ Initialization
- ✅ Agent spawning
- ✅ Cost tracking
- ✅ Debate resolution
- ✅ Proposal merging
- ✅ Guard validation
- ✅ Fallback (mock) mode

## Cost Tracking Demo

```typescript
import { TrinityDispatcher, MockSwarmIDE2Services } from "@trinity/dispatcher";

const dispatcher = new TrinityDispatcher({
  use_swarmide2: true,
  enable_cost_tracking: true,
  enable_caching: false,
  max_parallel_agents: 5,
  conflict_resolution_strategy: "meta_reasoning",
});

await dispatcher.init(new MockSwarmIDE2Services());

const proposals = await dispatcher.spawn(["engineer", "qa", "devops"], { task: "design_api" });
const outcome = await dispatcher.debate(proposals, "What's the best API design?");

const { total, logs } = dispatcher.getCostSummary();
console.log(`Total cost: $${total.toFixed(4)}`);
console.log(logs);
// Output:
// [Cost] spawn: $0.1234
// [Cost] debate: $0.4567
// Total cost: $0.5801
// [{ operation: 'spawn', cost_usd: 0.1234, ... }, { operation: 'debate', cost_usd: 0.4567, ... }]
```

## Files to Review

1. **packages/shared-types/src/index.ts** — All type definitions
2. **packages/dispatcher-adapter/src/index.ts** — Dispatcher logic + SwarmIDE2 interface
3. **INTEGRATION.md** — Step-by-step wiring guide for real systems

## Status

| Component | Status | Notes |
|-----------|--------|-------|
| RitualPayload | ✅ Complete | Canonical interface defined |
| Dispatcher | ✅ Complete | Mock implementations ready |
| Tests | 📋 Ready | 8 test cases written (awaiting vitest) |
| Shared Types | ✅ Compiled | 0 TypeScript errors |
| Real Nex | 🔴 Next | Need to import and wire |
| Real SwarmIDE2 | 🔴 Next | Need to extract services |
| Mind Shrine | 🔴 Next | Wraps Nex + Dispatcher |
| Law Shrine | 🔴 Next | Thrones integration |
| Forge Shrine | 🔴 Next | Orisa + StoryWeaver integration |

---

**The anvil is forged. Ready for thunder?** ⚡🌀🗿
