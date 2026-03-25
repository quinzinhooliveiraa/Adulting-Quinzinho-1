import { eq, and, desc, ne, gte, count, sql as drizzleSql } from "drizzle-orm";
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
  coupons,
  couponUses,
  userEvents,
  type UserEvent,
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
  autoNotificationConfigs,
  autoNotificationLogs,
  pushCampaigns,
  type AutoNotificationConfig,
  type InsertAutoNotificationConfig,
  type AutoNotificationLog,
  type PushCampaign,
  type Coupon,
  type InsertCoupon,
  type CouponUse,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByAppleId(appleId: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<Pick<User, "name" | "email" | "role" | "isPremium" | "isActive" | "premiumUntil" | "trialEndsAt" | "invitedBy" | "password" | "journeyOnboardingDone" | "journeyOrder" | "emailVerified" | "emailVerificationToken" | "passwordResetToken" | "passwordResetExpires" | "profilePhoto" | "googleId" | "appleId" | "stripeCustomerId" | "stripeSubscriptionId" | "lastActiveAt" | "pwaInstalled" | "trialBonusClaimed" | "birthYear" | "interests">>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  getEntries(userId: string): Promise<JournalEntry[]>;
  getEntry(id: number): Promise<JournalEntry | undefined>;
  getEntryBySlug(slug: string): Promise<(JournalEntry & { authorName: string }) | undefined>;
  createEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateEntry(id: number, userId: string, text: string, tags: string[]): Promise<JournalEntry | undefined>;
  setEntryShareSlug(id: number, userId: string, slug: string | null): Promise<JournalEntry | undefined>;
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

  getAutoNotificationConfigs(): Promise<AutoNotificationConfig[]>;
  getAutoNotificationConfig(type: string): Promise<AutoNotificationConfig | undefined>;
  upsertAutoNotificationConfig(data: InsertAutoNotificationConfig): Promise<AutoNotificationConfig>;
  updateAutoNotificationConfig(id: number, data: Partial<AutoNotificationConfig>): Promise<AutoNotificationConfig | undefined>;
  getAutoNotificationLog(userId: string, type: string, sinceHours: number): Promise<AutoNotificationLog | undefined>;
  createAutoNotificationLog(userId: string, type: string): Promise<void>;
  getAutoNotificationStats(): Promise<{ type: string; totalSent: number; lastSentAt: Date | null }[]>;

  createPushCampaign(data: { title: string; body: string; url: string; sentCount: number; failedCount: number }): Promise<PushCampaign>;
  getPushCampaigns(): Promise<PushCampaign[]>;
  incrementCampaignClicks(id: number): Promise<void>;
  updatePushCampaignCounts(id: number, sent: number, failed: number): Promise<void>;

  getCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getCouponById(id: number): Promise<Coupon | undefined>;
  createCoupon(data: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, data: Partial<Coupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: number): Promise<boolean>;
  hasCouponBeenUsedByUser(couponId: number, userId: string): Promise<boolean>;
  recordCouponUse(couponId: number, userId: string): Promise<void>;
  getCouponUseCount(couponId: number): Promise<number>;

  trackEvent(userId: string | null, event: string, metadata?: string): Promise<void>;
  getEventCounts(days?: number, excludeAdmins?: boolean): Promise<{ event: string; count: number }[]>;
  getDailyActiveUsers(days?: number, excludeAdmins?: boolean): Promise<{ date: string; count: number }[]>;
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

  async updateUser(id: string, data: Partial<Pick<User, "name" | "email" | "role" | "isPremium" | "isActive" | "premiumUntil" | "trialEndsAt" | "invitedBy" | "password" | "journeyOnboardingDone" | "journeyOrder" | "emailVerified" | "emailVerificationToken" | "passwordResetToken" | "passwordResetExpires" | "profilePhoto" | "googleId" | "appleId" | "stripeCustomerId" | "stripeSubscriptionId" | "lastActiveAt" | "pwaInstalled" | "birthYear" | "interests">>): Promise<User | undefined> {
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

  async getEntryBySlug(slug: string): Promise<(JournalEntry & { authorName: string }) | undefined> {
    const results = await db.select({
      entry: journalEntries,
      authorName: users.name,
    }).from(journalEntries)
      .innerJoin(users, eq(journalEntries.userId, users.id))
      .where(eq(journalEntries.shareSlug, slug));
    if (results.length === 0) return undefined;
    return { ...results[0].entry, authorName: results[0].authorName };
  }

  async setEntryShareSlug(id: number, userId: string, slug: string | null): Promise<JournalEntry | undefined> {
    const [updated] = await db.update(journalEntries)
      .set({ shareSlug: slug, updatedAt: new Date() })
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning();
    return updated;
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
    await db.delete(autoNotificationLogs).where(eq(autoNotificationLogs.userId, id));
    await db.delete(journeyReports).where(eq(journeyReports.userId, id));
    await db.delete(couponUses).where(eq(couponUses.userId, id));
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

  async getAutoNotificationConfigs(): Promise<AutoNotificationConfig[]> {
    return db.select().from(autoNotificationConfigs).orderBy(autoNotificationConfigs.type);
  }

  async getAutoNotificationConfig(type: string): Promise<AutoNotificationConfig | undefined> {
    const [config] = await db.select().from(autoNotificationConfigs).where(eq(autoNotificationConfigs.type, type));
    return config;
  }

  async upsertAutoNotificationConfig(data: InsertAutoNotificationConfig): Promise<AutoNotificationConfig> {
    const existing = await this.getAutoNotificationConfig(data.type);
    if (existing) {
      const [updated] = await db.update(autoNotificationConfigs).set(data).where(eq(autoNotificationConfigs.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(autoNotificationConfigs).values(data).returning();
    return created;
  }

  async updateAutoNotificationConfig(id: number, data: Partial<AutoNotificationConfig>): Promise<AutoNotificationConfig | undefined> {
    const [updated] = await db.update(autoNotificationConfigs).set(data).where(eq(autoNotificationConfigs.id, id)).returning();
    return updated;
  }

  async getAutoNotificationLog(userId: string, type: string, sinceHours: number): Promise<AutoNotificationLog | undefined> {
    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    const [log] = await db.select().from(autoNotificationLogs)
      .where(and(
        eq(autoNotificationLogs.userId, userId),
        eq(autoNotificationLogs.type, type),
        gte(autoNotificationLogs.sentAt, since)
      ))
      .orderBy(desc(autoNotificationLogs.sentAt))
      .limit(1);
    return log;
  }

  async createAutoNotificationLog(userId: string, type: string): Promise<void> {
    await db.insert(autoNotificationLogs).values({ userId, type });
  }

  async getAutoNotificationStats(): Promise<{ type: string; totalSent: number; lastSentAt: Date | null }[]> {
    const allConfigs = await this.getAutoNotificationConfigs();
    const stats = [];
    for (const config of allConfigs) {
      const [countResult] = await db.select({ value: count() }).from(autoNotificationLogs)
        .where(eq(autoNotificationLogs.type, config.type));
      const [lastLog] = await db.select().from(autoNotificationLogs)
        .where(eq(autoNotificationLogs.type, config.type))
        .orderBy(desc(autoNotificationLogs.sentAt))
        .limit(1);
      stats.push({
        type: config.type,
        totalSent: countResult?.value || 0,
        lastSentAt: lastLog?.sentAt || null,
      });
    }
    return stats;
  }

  async createPushCampaign(data: { title: string; body: string; url: string; sentCount: number; failedCount: number }): Promise<PushCampaign> {
    const [campaign] = await db.insert(pushCampaigns).values(data).returning();
    return campaign;
  }

  async getPushCampaigns(): Promise<PushCampaign[]> {
    return db.select().from(pushCampaigns).orderBy(desc(pushCampaigns.createdAt)).limit(50);
  }

  async incrementCampaignClicks(id: number): Promise<void> {
    const [campaign] = await db.select().from(pushCampaigns).where(eq(pushCampaigns.id, id));
    if (campaign) {
      await db.update(pushCampaigns).set({ clickedCount: campaign.clickedCount + 1 }).where(eq(pushCampaigns.id, id));
    }
  }

  async updatePushCampaignCounts(id: number, sent: number, failed: number): Promise<void> {
    await db.update(pushCampaigns).set({ sentCount: sent, failedCount: failed }).where(eq(pushCampaigns.id, id));
  }

  async getCoupons(): Promise<Coupon[]> {
    return db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase()));
    return coupon;
  }

  async getCouponById(id: number): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon;
  }

  async createCoupon(data: InsertCoupon): Promise<Coupon> {
    const [coupon] = await db.insert(coupons).values({ ...data, code: data.code.toUpperCase() }).returning();
    return coupon;
  }

  async updateCoupon(id: number, data: Partial<Coupon>): Promise<Coupon | undefined> {
    const [coupon] = await db.update(coupons).set(data).where(eq(coupons.id, id)).returning();
    return coupon;
  }

  async deleteCoupon(id: number): Promise<boolean> {
    const result = await db.delete(coupons).where(eq(coupons.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async hasCouponBeenUsedByUser(couponId: number, userId: string): Promise<boolean> {
    const [use] = await db.select().from(couponUses).where(and(eq(couponUses.couponId, couponId), eq(couponUses.userId, userId)));
    return !!use;
  }

  async recordCouponUse(couponId: number, userId: string): Promise<void> {
    await db.insert(couponUses).values({ couponId, userId });
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, couponId));
    if (coupon) {
      await db.update(coupons).set({ usedCount: coupon.usedCount + 1 }).where(eq(coupons.id, couponId));
    }
  }

  async getCouponUseCount(couponId: number): Promise<number> {
    const [result] = await db.select({ value: count() }).from(couponUses).where(eq(couponUses.couponId, couponId));
    return result?.value || 0;
  }

  async trackEvent(userId: string | null, event: string, metadata?: string): Promise<void> {
    await db.insert(userEvents).values({ userId: userId || null, event, metadata });
  }

  async getEventCounts(days: number = 30, excludeAdmins: boolean = false): Promise<{ event: string; count: number }[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    if (excludeAdmins) {
      const rows = await db.execute(drizzleSql`
        SELECT ue.event, COUNT(*) as count
        FROM user_events ue
        JOIN users u ON ue.user_id = u.id
        WHERE ue.created_at >= ${since} AND u.role != 'admin'
        GROUP BY ue.event
        ORDER BY count DESC
      `);
      return (rows.rows as any[]).map(r => ({ event: r.event, count: Number(r.count) }));
    }
    const rows = await db
      .select({ event: userEvents.event, count: count() })
      .from(userEvents)
      .where(gte(userEvents.createdAt, since))
      .groupBy(userEvents.event)
      .orderBy(desc(count()));
    return rows.map(r => ({ event: r.event, count: Number(r.count) }));
  }

  async getDailyActiveUsers(days: number = 30, excludeAdmins: boolean = false): Promise<{ date: string; count: number }[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const adminClause = excludeAdmins
      ? `AND ue.user_id IN (SELECT id FROM users WHERE role != 'admin')`
      : "";
    const rows = await db.execute(drizzleSql`
      SELECT TO_CHAR(ue.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as date,
             COUNT(DISTINCT ue.user_id) as count
      FROM user_events ue
      WHERE ue.created_at >= ${since} AND ue.user_id IS NOT NULL
      ${drizzleSql.raw(adminClause)}
      GROUP BY TO_CHAR(ue.created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
      ORDER BY date ASC
    `);
    const dataMap = new Map<string, number>(
      (rows.rows as any[]).map(r => [r.date as string, Number(r.count)])
    );
    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const brt = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      const dateStr = `${brt.getFullYear()}-${String(brt.getMonth() + 1).padStart(2, "0")}-${String(brt.getDate()).padStart(2, "0")}`;
      result.push({ date: dateStr, count: dataMap.get(dateStr) ?? 0 });
    }
    return result;
  }
}

export const storage = new DatabaseStorage();
