import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("students router", () => {
  it("list students returns an array", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.students.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("list students with activeOnly filter", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.students.list({ activeOnly: true });
    expect(Array.isArray(result)).toBe(true);
    // All returned students should be active
    for (const student of result) {
      expect(student.active).toBe(true);
    }
  });
});

describe("meetings router", () => {
  it("list meetings returns an array", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.meetings.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("listWithAttendance returns meetings with presentCount", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.meetings.listWithAttendance();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('presentCount');
      expect(result[0]).toHaveProperty('presentStudents');
    }
  });
});

describe("dashboard router", () => {
  it("stats returns expected shape", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.dashboard.stats();
    expect(result).toHaveProperty('totalMeetings');
    expect(result).toHaveProperty('avgAttendance');
    expect(result).toHaveProperty('topStudent');
    expect(result).toHaveProperty('totalStudents');
    expect(typeof result.totalMeetings).toBe('number');
    expect(typeof result.avgAttendance).toBe('number');
  });
});

describe("reports router", () => {
  it("studentReport returns array with expected fields", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.reports.studentReport();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('studentId');
      expect(result[0]).toHaveProperty('studentName');
      expect(result[0]).toHaveProperty('presences');
      expect(result[0]).toHaveProperty('absences');
      expect(result[0]).toHaveProperty('percentage');
      expect(result[0]).toHaveProperty('totalMeetings');
    }
  });
});

describe("auth router", () => {
  it("me returns user when authenticated", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User");
  });

  it("me returns null when not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});
