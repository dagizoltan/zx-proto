import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createSchedulerService } from "./scheduler-service.js";
import { Ok, Err } from "../../../../../lib/trust/index.js";

Deno.test("Scheduler Service", async (t) => {
  const tenantId = "test-tenant";

  await t.step("should register handler and sync definitions", async () => {
    // Mocks
    const taskRepo = {
      queryByIndex: (tid, idx, val) => Promise.resolve(Ok({ items: [] })),
      save: (tid, task) => Promise.resolve(Ok(task)),
    };
    const executionRepo = {};
    const eventBus = {};

    const service = createSchedulerService({ taskRepo, executionRepo, eventBus });

    const handler = async () => {};
    service.registerHandler("job-1", handler);

    await service.syncDefinitions(tenantId, [{
        handlerKey: "job-1",
        name: "Job 1",
        description: "Test Job",
        defaultSchedule: "0 0 * * *"
    }]);

    // Verified via save calls in mocks usually, but here checking no errors thrown
  });

  await t.step("should execute task successfully", async () => {
    // Mocks
    const mockTask = {
        id: "task-1",
        handlerKey: "job-1",
        name: "Job 1",
        enabled: true,
        cronExpression: "* * * * *"
    };

    const taskRepo = {
      findById: () => Promise.resolve(Ok(mockTask)),
      save: () => Promise.resolve(Ok(mockTask)),
    };
    const executionRepo = {
      save: (tid, ex) => {
          if (ex.status === 'SUCCESS') {
              assertEquals(ex.logs.length > 1, true); // Has logs
          }
          return Promise.resolve(Ok(ex));
      },
    };
    const crm = {
        notifications: {
            notify: () => Promise.resolve()
        }
    };

    const service = createSchedulerService({ taskRepo, executionRepo, crm });

    let handlerCalled = false;
    service.registerHandler("job-1", async ({ log }) => {
        handlerCalled = true;
        log("Working...");
    });

    await service.executeTask(tenantId, "task-1");

    assert(handlerCalled);
  });

   await t.step("should handle failed task execution", async () => {
    // Mocks
    const mockTask = {
        id: "task-1",
        handlerKey: "job-fail",
        name: "Job Fail",
        enabled: true
    };

    const taskRepo = {
      findById: () => Promise.resolve(Ok(mockTask)),
      save: () => Promise.resolve(Ok(mockTask)),
    };
    const executionRepo = {
      save: (tid, ex) => {
          if (ex.status === 'FAILED') {
              assertEquals(ex.error, "Boom!");
          }
          return Promise.resolve(Ok(ex));
      },
    };
    const crm = {
        notifications: {
            notify: () => Promise.resolve()
        }
    };

    const service = createSchedulerService({ taskRepo, executionRepo, crm });

    service.registerHandler("job-fail", async () => {
        throw new Error("Boom!");
    });

    await service.executeTask(tenantId, "task-1");
  });

  await t.step("tick should run due tasks", async () => {
     // Mocks
     // cronExpression: Every minute. lastRunAt: Long ago.
     const mockTask = {
        id: "task-1",
        handlerKey: "job-tick",
        name: "Job Tick",
        enabled: true,
        cronExpression: "* * * * *",
        lastRunAt: "2000-01-01T00:00:00.000Z"
    };

    const taskRepo = {
      queryByIndex: (tid, idx, val) => {
          assertEquals(idx, "enabled");
          return Promise.resolve(Ok({ items: [mockTask] }));
      },
      findById: () => Promise.resolve(Ok(mockTask)),
      save: () => Promise.resolve(Ok(mockTask)),
    };
    const executionRepo = {
        save: () => Promise.resolve(Ok({})),
    };

    const service = createSchedulerService({ taskRepo, executionRepo });

    let handlerCalled = false;
    service.registerHandler("job-tick", async () => {
        handlerCalled = true;
    });

    await service.tick(tenantId);

    assert(handlerCalled);
  });
});
