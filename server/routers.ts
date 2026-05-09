import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ STUDENTS ============
  students: router({
    list: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return db.getAllStudents(input?.activeOnly ?? true);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getStudentById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ input }) => {
        return db.createStudent(input.name);
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), active: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateStudent(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStudent(input.id);
        return { success: true };
      }),
  }),

  // ============ MEETINGS ============
  meetings: router({
    list: protectedProcedure.query(async () => {
      return db.getAllMeetings();
    }),

    listWithAttendance: protectedProcedure.query(async () => {
      return db.getMeetingsWithAttendance();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMeetingById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({ date: z.string(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        return db.createMeeting(input.date, input.notes);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMeeting(input.id);
        return { success: true };
      }),
  }),

  // ============ ATTENDANCE ============
  attendance: router({
    getByMeeting: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        return db.getAttendanceByMeeting(input.meetingId);
      }),

    save: protectedProcedure
      .input(z.object({
        meetingId: z.number(),
        presentStudentIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        await db.saveAttendance(input.meetingId, input.presentStudentIds);
        return { success: true };
      }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
  }),

  // ============ REPORTS ============
  reports: router({
    studentReport: protectedProcedure.query(async () => {
      return db.getStudentReport();
    }),
  }),
});

export type AppRouter = typeof appRouter;
