import { eq, and, desc, ne, gte, count } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  journalEntries,
  moodCheckins,
  feedbackTickets,
  journeyProgress,
  pushSubscriptions,
  scheduledNotifications,
  journeyReports,
  type User,
  type InsertUser,
  type JournalEntry,
  type InsertJournalEntry,
  type MoodCheckin,
  type InsertMoodCheckin,
  type FeedbackTicket,
  type InsertFeedbackTicket,
  type JourneyProgress,
  type InsertJourneyProgress,
  type PushSubscription,
  type InsertPushSubscription,
  type ScheduledNotification,
  type InsertScheduledNotification,
  type JourneyReport as JourneyReportType,
  type InsertJourneyReport,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByAppleId(appleId: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<Pick<User, "name" | "email" | "role" | "isPremium" | "isActive" | "premiumUntil" | "trialEndsAt" | "invitedBy" | "password" | "journeyOnboardingDone" | "journeyOrder" | "emailVerified" | "emailVerificationToken" | "googleId" | "appleId" | "stripeCustomerId" | "stripeSubscriptionId">>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  getEntries(userId: string): Promise<JournalEntry[]>;
  getEntry(id: number): Promise<JournalEntry | undefined>;
  createEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateEntry(id: number, userId: string, text: string, tags: string[]): Promise<JournalEntry | undefined>;
  deleteEntry(id: number, userId: string): Promise<boolean>;
  getEntriesByTag(userId: string, tag: string): Promise<JournalEntry[]>;
  getMonthlyEntryCount(userId: string): Promise<number>;

  getCheckins(userId: string): Promise<MoodCheckin[]>;
  getLatestCheckin(userId: string): Promise<MoodCheckin | undefined>;
  createCheckin(checkin: InsertMoodCheckin): Promise<MoodCheckin>;

  createFeedback(ticket: InsertFeedbackTicket): Promise<FeedbackTicket>;
  getFeedbackByUser(userId: string): Promise<FeedbackTicket[]>;
  getAllFeedback(): Promise<(FeedbackTicket & { userName?: string; userEmail?: string })[]>;
  updateFeedbackStatus(id: number, status: string, adminNote?: string): Promise<FeedbackTicket | undefined>;

  getJourneyProgress(userId: string): Promise<JourneyProgress[]>;
  getJourneyProgressByJourney(userId: string, journeyId: string): Promise<JourneyProgress | undefined>;
  startJourney(data: InsertJourneyProgress): Promise<JourneyProgress>;
  completeJourneyDay(userId: string, journeyId: string, dayId: string): Promise<JourneyProgress | undefined>;
  uncompleteJourneyDay(userId: string, journeyId: string, dayId: string): Promise<JourneyProgress | undefined>;
  restartJourney(userId: string, journeyId: string): Promise<JourneyProgress | undefined>;

  savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(userId: string, endpoint: string): Promise<boolean>;
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;

  getScheduledNotifications(): Promise<ScheduledNotification[]>;
  createScheduledNotification(data: InsertScheduledNotification): Promise<ScheduledNotification>;
  updateScheduledNotification(id: number, data: Partial<ScheduledNotification>): Promise<ScheduledNotification | undefined>;
  deleteScheduledNotification(id: number): Promise<boolean>;
  getDueNotifications(): Promise<ScheduledNotification[]>;
  markNotificationSent(id: number): Promise<void>;

  saveJourneyReport(data: InsertJourneyReport): Promise<JourneyReportType>;
  getJourneyReports(userId: string): Promise<JourneyReportType[]>;
  getJourneyReport(id: number, userId: string): Promise<JourneyReportType | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.appleId, appleId));
    return user;
  }

  async updateUser(id: string, data: Partial<Pick<User, "name" | "email" | "role" | "isPremium" | "isActive" | "premiumUntil" | "trialEndsAt" | "invitedBy" | "password" | "emailVerified" | "emailVerificationToken" | "googleId" | "appleId" | "stripeCustomerId" | "stripeSubscriptionId">>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getEntries(userId: string): Promise<JournalEntry[]> {
    return db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
  }

  async getEntry(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries).where(eq(journalEntries.id, id));
    return entry;
  }

  async createEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [created] = await db.insert(journalEntries).values(entry).returning();
    return created;
  }

  async updateEntry(id: number, userId: string, text: string, tags: string[]): Promise<JournalEntry | undefined> {
    const [updated] = await db.update(journalEntries)
      .set({ text, tags, updatedAt: new Date() })
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning();
    return updated;
  }

  async deleteEntry(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getMonthlyEntryCount(userId: string): Promise<number> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [result] = await db.select({ value: count() }).from(journalEntries)
      .where(and(eq(journalEntries.userId, userId), gte(journalEntries.createdAt, monthStart)));
    return result?.value || 0;
  }

  async getEntriesByTag(userId: string, tag: string): Promise<JournalEntry[]> {
    const allEntries = await this.getEntries(userId);
    return allEntries.filter(e => e.tags.includes(tag));
  }

  async getCheckins(userId: string): Promise<MoodCheckin[]> {
    return db.select().from(moodCheckins)
      .where(eq(moodCheckins.userId, userId))
      .orderBy(desc(moodCheckins.createdAt));
  }

  async getLatestCheckin(userId: string): Promise<MoodCheckin | undefined> {
    const [checkin] = await db.select().from(moodCheckins)
      .where(eq(moodCheckins.userId, userId))
      .orderBy(desc(moodCheckins.createdAt))
      .limit(1);
    return checkin;
  }

  async createCheckin(checkin: InsertMoodCheckin): Promise<MoodCheckin> {
    const [created] = await db.insert(moodCheckins).values(checkin).returning();
    return created;
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, id));
    await db.delete(journeyProgress).where(eq(journeyProgress.userId, id));
    await db.delete(feedbackTickets).where(eq(feedbackTickets.userId, id));
    await db.delete(moodCheckins).where(eq(moodCheckins.userId, id));
    await db.delete(journalEntries).where(eq(journalEntries.userId, id));
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async createFeedback(ticket: InsertFeedbackTicket): Promise<FeedbackTicket> {
    const [created] = await db.insert(feedbackTickets).values(ticket).returning();
    return created;
  }

  async getFeedbackByUser(userId: string): Promise<FeedbackTicket[]> {
    return db.select().from(feedbackTickets)
      .where(eq(feedbackTickets.userId, userId))
      .orderBy(desc(feedbackTickets.createdAt));
  }

  async getAllFeedback(): Promise<(FeedbackTicket & { userName?: string; userEmail?: string })[]> {
    const allTickets = await db.select().from(feedbackTickets).orderBy(desc(feedbackTickets.createdAt));
    const result = [];
    for (const ticket of allTickets) {
      const user = await this.getUser(ticket.userId);
      result.push({
        ...ticket,
        userName: user?.name,
        userEmail: user?.email,
      });
    }
    return result;
  }

  async updateFeedbackStatus(id: number, status: string, adminNote?: string): Promise<FeedbackTicket | undefined> {
    const updateData: any = { status };
    if (adminNote !== undefined) updateData.adminNote = adminNote;
    const [updated] = await db.update(feedbackTickets).set(updateData).where(eq(feedbackTickets.id, id)).returning();
    return updated;
  }

  async getJourneyProgress(userId: string): Promise<JourneyProgress[]> {
    return db.select().from(journeyProgress)
      .where(eq(journeyProgress.userId, userId))
      .orderBy(desc(journeyProgress.startedAt));
  }

  async getJourneyProgressByJourney(userId: string, journeyId: string): Promise<JourneyProgress | undefined> {
    const [progress] = await db.select().from(journeyProgress)
      .where(and(eq(journeyProgress.userId, userId), eq(journeyProgress.journeyId, journeyId)));
    return progress;
  }

  async startJourney(data: InsertJourneyProgress): Promise<JourneyProgress> {
    const [created] = await db.insert(journeyProgress).values(data).returning();
    return created;
  }

  async completeJourneyDay(userId: string, journeyId: string, dayId: string): Promise<JourneyProgress | undefined> {
    const existing = await this.getJourneyProgressByJourney(userId, journeyId);
    if (!existing) return undefined;
    if (existing.completedDays.includes(dayId)) return existing;
    const timestamps: Record<string, string> = JSON.parse(existing.completedTimestamps || "{}");
    timestamps[dayId] = new Date().toISOString();
    const [updated] = await db.update(journeyProgress)
      .set({
        completedDays: [...existing.completedDays, dayId],
        completedTimestamps: JSON.stringify(timestamps),
        lastActivityAt: new Date(),
      })
      .where(and(eq(journeyProgress.userId, userId), eq(journeyProgress.journeyId, journeyId)))
      .returning();
    return updated;
  }

  async uncompleteJourneyDay(userId: string, journeyId: string, dayId: string): Promise<JourneyProgress | undefined> {
    const existing = await this.getJourneyProgressByJourney(userId, journeyId);
    if (!existing) return undefined;
    const timestamps: Record<string, string> = JSON.parse(existing.completedTimestamps || "{}");
    delete timestamps[dayId];
    const [updated] = await db.update(journeyProgress)
      .set({
        completedDays: existing.completedDays.filter(d => d !== dayId),
        completedTimestamps: JSON.stringify(timestamps),
        lastActivityAt: new Date(),
      })
      .where(and(eq(journeyProgress.userId, userId), eq(journeyProgress.journeyId, journeyId)))
      .returning();
    return updated;
  }

  async restartJourney(userId: string, journeyId: string): Promise<JourneyProgress | undefined> {
    const [updated] = await db.update(journeyProgress)
      .set({
        completedDays: [],
        completedTimestamps: "{}",
        startedAt: new Date(),
        lastActivityAt: new Date(),
      })
      .where(and(eq(journeyProgress.userId, userId), eq(journeyProgress.journeyId, journeyId)))
      .returning();
    return updated;
  }
  async savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription> {
    const existing = await db.select().from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, sub.userId), eq(pushSubscriptions.endpoint, sub.endpoint)));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(pushSubscriptions).values(sub).returning();
    return created;
  }

  async deletePushSubscription(userId: string, endpoint: string): Promise<boolean> {
    const result = await db.delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))
      .returning();
    return result.length > 0;
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions);
  }

  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    return db.select().from(scheduledNotifications).orderBy(desc(scheduledNotifications.createdAt));
  }

  async createScheduledNotification(data: InsertScheduledNotification): Promise<ScheduledNotification> {
    const [created] = await db.insert(scheduledNotifications).values(data).returning();
    return created;
  }

  async updateScheduledNotification(id: number, data: Partial<ScheduledNotification>): Promise<ScheduledNotification | undefined> {
    const [updated] = await db.update(scheduledNotifications).set(data).where(eq(scheduledNotifications.id, id)).returning();
    return updated;
  }

  async deleteScheduledNotification(id: number): Promise<boolean> {
    const result = await db.delete(scheduledNotifications).where(eq(scheduledNotifications.id, id)).returning();
    return result.length > 0;
  }

  async getDueNotifications(): Promise<ScheduledNotification[]> {
    const all = await db.select().from(scheduledNotifications).where(eq(scheduledNotifications.isActive, true));
    const now = new Date();
    return all.filter((n) => {
      if (!n.lastSentAt) return true;
      const diffMs = now.getTime() - new Date(n.lastSentAt).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours >= n.intervalHours;
    });
  }

  async markNotificationSent(id: number): Promise<void> {
    await db.update(scheduledNotifications).set({ lastSentAt: new Date() }).where(eq(scheduledNotifications.id, id));
  }

  async saveJourneyReport(data: InsertJourneyReport): Promise<JourneyReportType> {
    const [report] = await db.insert(journeyReports).values(data).returning();
    return report;
  }

  async getJourneyReports(userId: string): Promise<JourneyReportType[]> {
    return db.select().from(journeyReports)
      .where(eq(journeyReports.userId, userId))
      .orderBy(desc(journeyReports.createdAt));
  }

  async getJourneyReport(id: number, userId: string): Promise<JourneyReportType | undefined> {
    const [report] = await db.select().from(journeyReports)
      .where(and(eq(journeyReports.id, id), eq(journeyReports.userId, userId)));
    return report;
  }
}

export const storage = new DatabaseStorage();
