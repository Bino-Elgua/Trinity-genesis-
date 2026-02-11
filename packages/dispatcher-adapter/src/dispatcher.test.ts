import { describe, it, expect, beforeEach } from "vitest";
import {
  TrinityDispatcher,
  MockSwarmIDE2Services,
  type DispatcherConfig,
} from "./index";

describe("TrinityDispatcher", () => {
  let dispatcher: TrinityDispatcher;
  let config: DispatcherConfig;

  beforeEach(() => {
    config = {
      use_swarmide2: true,
      enable_cost_tracking: true,
      enable_caching: false,
      max_parallel_agents: 5,
      conflict_resolution_strategy: "meta_reasoning",
    };
    dispatcher = new TrinityDispatcher(config);
  });

  it("should initialize with config", async () => {
    await dispatcher.init();
    const payload = dispatcher.getRitualPayload();
    expect(payload.status).toBe("thinking");
  });

  it("should spawn agents", async () => {
    const mockServices = new MockSwarmIDE2Services();
    await dispatcher.init(mockServices);

    const proposals = await dispatcher.spawn(
      ["engineer", "devops", "qa"],
      { task: "test" },
      1.0
    );

    expect(proposals).toHaveLength(3);
    expect(proposals[0].agent_id).toBeDefined();
    expect(proposals[0].confidence).toBeGreaterThan(0);
  });

  it("should track costs", async () => {
    const mockServices = new MockSwarmIDE2Services();
    await dispatcher.init(mockServices);

    await dispatcher.spawn(["engineer"], { task: "test" });
    const costs = dispatcher.getCostSummary();

    expect(costs.total).toBeGreaterThan(0);
    expect(costs.logs).toHaveLength(1);
    expect(costs.logs[0].operation).toBe("spawn");
  });

  it("should resolve debates", async () => {
    const mockServices = new MockSwarmIDE2Services();
    await dispatcher.init(mockServices);

    const proposals = await dispatcher.spawn(["engineer", "qa"], { task: "test" });
    const outcome = await dispatcher.debate(proposals, "What's the best approach?");

    expect(outcome.winner_proposal).toBeDefined();
    expect(outcome.consensus_score).toBeGreaterThan(0);
  });

  it("should merge proposals", async () => {
    const mockServices = new MockSwarmIDE2Services();
    await dispatcher.init(mockServices);

    const proposals = await dispatcher.spawn(["engineer"], { task: "test" });
    const merged = await dispatcher.merge(proposals, 0.85);

    expect(merged.consensus_score).toBe(0.85);
    expect(merged.proposals_merged).toBe(1);
  });

  it("should validate guards", async () => {
    const mockServices = new MockSwarmIDE2Services();
    await dispatcher.init(mockServices);

    const result = await dispatcher.guard("test_value", "safety_guard", 1);

    expect(result.valid).toBeDefined();
    expect(result.reason).toBeDefined();
  });

  it("should work without SwarmIDE2 services (fallback mode)", async () => {
    await dispatcher.init(); // No mock services

    const proposals = await dispatcher.spawn(["engineer"], { task: "test" });
    expect(proposals).toHaveLength(1);
    expect(proposals[0].agent_id).toBeDefined();
  });
});
