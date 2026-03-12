import { eq, and, desc, ne } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  journalEntries,
  moodCheckins,
  feedbackTickets,
  journeyProgress,
  pushSubscriptions,
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
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<Pick<User, "name" | "email" | "role" | "isPremium" | "isActive" | "premiumUntil" | "trialEndsAt" | "invitedBy" | "password">>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  getEntries(userId: string): Promise<JournalEntry[]>;
  getEntry(id: number): Promise<JournalEntry | undefined>;
  createEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateEntry(id: number, userId: string, text: string, tags: string[]): Promise<JournalEntry | undefined>;
  deleteEntry(id: number, userId: string): Promise<boolean>;
  getEntriesByTag(userId: string, tag: string): Promise<JournalEntry[]>;

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

  savePushSubscription(sub: InsertPushSubscription): Promise<PushSubscription>;
  deletePushSubscription(userId: string, endpoint: string): Promise<boolean>;
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<Pick<User, "name" | "email" | "role" | "isPremium" | "isActive" | "premiumUntil" | "trialEndsAt" | "invitedBy" | "password">>): Promise<User | undefined> {
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
    const [updated] = await db.update(journeyProgress)
      .set({
        completedDays: [...existing.completedDays, dayId],
        lastActivityAt: new Date(),
      })
      .where(and(eq(journeyProgress.userId, userId), eq(journeyProgress.journeyId, journeyId)))
      .returning();
    return updated;
  }

  async uncompleteJourneyDay(userId: string, journeyId: string, dayId: string): Promise<JourneyProgress | undefined> {
    const existing = await this.getJourneyProgressByJourney(userId, journeyId);
    if (!existing) return undefined;
    const [updated] = await db.update(journeyProgress)
      .set({
        completedDays: existing.completedDays.filter(d => d !== dayId),
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
}

export const storage = new DatabaseStorage();
