import { eq, sql, desc, asc, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, students, meetings, attendance } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ STUDENTS ============

export async function getAllStudents(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  
  if (activeOnly) {
    return db.select().from(students).where(eq(students.active, true)).orderBy(asc(students.name));
  }
  return db.select().from(students).orderBy(asc(students.name));
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result[0];
}

export async function createStudent(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(students).values({ name });
  const result = await db.select().from(students).where(eq(students.name, name)).orderBy(desc(students.id)).limit(1);
  return result[0];
}

export async function updateStudent(id: number, data: { name?: string; active?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(students).set(data).where(eq(students.id, id));
  return getStudentById(id);
}

export async function deleteStudent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Soft delete - just deactivate
  await db.update(students).set({ active: false }).where(eq(students.id, id));
}

// ============ MEETINGS ============

export async function getAllMeetings() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(meetings).orderBy(sql`${meetings.date} DESC`);
}

export async function getMeetingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  return result[0];
}

export async function createMeeting(dateStr: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const dateVal = new Date(dateStr + 'T00:00:00');
  await db.insert(meetings).values({ date: dateVal, notes });
  const result = await db.select().from(meetings).where(sql`${meetings.date} = ${dateStr}`).orderBy(desc(meetings.id)).limit(1);
  return result[0];
}

export async function deleteMeeting(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete attendance records first
  await db.delete(attendance).where(eq(attendance.meetingId, id));
  await db.delete(meetings).where(eq(meetings.id, id));
}

// ============ ATTENDANCE ============

export async function getAttendanceByMeeting(meetingId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: attendance.id,
    meetingId: attendance.meetingId,
    studentId: attendance.studentId,
    present: attendance.present,
    studentName: students.name,
  })
  .from(attendance)
  .innerJoin(students, eq(attendance.studentId, students.id))
  .where(eq(attendance.meetingId, meetingId))
  .orderBy(asc(students.name));
}

export async function saveAttendance(meetingId: number, presentStudentIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete existing attendance for this meeting
  await db.delete(attendance).where(eq(attendance.meetingId, meetingId));
  
  // Insert new attendance records
  if (presentStudentIds.length > 0) {
    const values = presentStudentIds.map(studentId => ({
      meetingId,
      studentId,
      present: true,
    }));
    await db.insert(attendance).values(values);
  }
}

// ============ DASHBOARD STATS ============

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalMeetings: 0, avgAttendance: 0, topStudent: null, totalStudents: 0, topStudentMonth: null, nextMeeting: null };
  
  // Total meetings
  const meetingsResult = await db.select({ count: sql<number>`COUNT(*)` }).from(meetings);
  const totalMeetings = meetingsResult[0]?.count || 0;
  
  // Total active students
  const studentsResult = await db.select({ count: sql<number>`COUNT(*)` }).from(students).where(eq(students.active, true));
  const totalStudents = studentsResult[0]?.count || 0;
  
  // Average attendance per meeting
  const avgResult = await db.select({
    avg: sql<number>`AVG(cnt)`,
  }).from(
    sql`(SELECT meetingId, COUNT(*) as cnt FROM attendance WHERE present = true GROUP BY meetingId) as sub`
  );
  const avgAttendance = avgResult[0]?.avg || 0;
  
  // Top student overall (most presences)
  const topResult = await db.select({
    studentId: attendance.studentId,
    studentName: students.name,
    count: sql<number>`COUNT(*) as cnt`,
  })
  .from(attendance)
  .innerJoin(students, eq(attendance.studentId, students.id))
  .where(eq(attendance.present, true))
  .groupBy(attendance.studentId, students.name)
  .orderBy(sql`cnt DESC`)
  .limit(1);
  
  const topStudent = topResult[0] || null;

  // Top student of current month
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = now.getFullYear();
  const monthStart = `${currentYear}-${currentMonth}-01`;
  const monthEnd = `${currentYear}-${currentMonth}-31`;
  
  const topMonthResult = await db.select({
    studentId: attendance.studentId,
    studentName: students.name,
    count: sql<number>`COUNT(*) as cnt`,
  })
  .from(attendance)
  .innerJoin(students, eq(attendance.studentId, students.id))
  .innerJoin(meetings, eq(attendance.meetingId, meetings.id))
  .where(sql`${attendance.present} = true AND ${meetings.date} >= ${monthStart} AND ${meetings.date} <= ${monthEnd}`)
  .groupBy(attendance.studentId, students.name)
  .orderBy(sql`cnt DESC`)
  .limit(1);
  
  const topStudentMonth = topMonthResult[0] || null;

  // Next meeting (future date or null)
  const today = now.toISOString().split('T')[0];
  const nextMeetingResult = await db.select()
    .from(meetings)
    .where(sql`${meetings.date} > ${today}`)
    .orderBy(sql`${meetings.date} ASC`)
    .limit(1);
  
  const nextMeeting = nextMeetingResult[0] || null;
  
  return { totalMeetings, avgAttendance: Math.round(avgAttendance * 10) / 10, topStudent, totalStudents, topStudentMonth, nextMeeting };
}

// ============ REPORTS ============

export async function getStudentReport() {
  const db = await getDb();
  if (!db) return [];
  
  const totalMeetingsResult = await db.select({ count: sql<number>`COUNT(*)` }).from(meetings);
  const totalMeetings = totalMeetingsResult[0]?.count || 0;
  
  const report = await db.select({
    studentId: students.id,
    studentName: students.name,
    presences: sql<number>`COALESCE(SUM(CASE WHEN ${attendance.present} = true THEN 1 ELSE 0 END), 0)`,
  })
  .from(students)
  .leftJoin(attendance, eq(students.id, attendance.studentId))
  .where(eq(students.active, true))
  .groupBy(students.id, students.name)
  .orderBy(asc(students.name));
  
  return report.map(r => ({
    ...r,
    totalMeetings,
    absences: totalMeetings - (r.presences || 0),
    percentage: totalMeetings > 0 ? Math.round(((r.presences || 0) / totalMeetings) * 1000) / 10 : 0,
  }));
}

export async function getMeetingsWithAttendance() {
  const db = await getDb();
  if (!db) return [];
  
  const allMeetings = await db.select().from(meetings).orderBy(sql`${meetings.date} DESC`);
  
  const result = [];
  for (const meeting of allMeetings) {
    const attendanceRecords = await db.select({
      studentName: students.name,
    })
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .where(and(eq(attendance.meetingId, meeting.id), eq(attendance.present, true)))
    .orderBy(asc(students.name));
    
    result.push({
      ...meeting,
      presentCount: attendanceRecords.length,
      presentStudents: attendanceRecords.map(a => a.studentName),
    });
  }
  
  return result;
}
