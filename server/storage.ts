import { eq, and, desc, ne, gte, count, sql as drizzleSql } from "drizzle-orm";
import { db } from "./db";
import { encryptField, decryptField, hashEmail } from "./encryption";
import {
  users,
  referrals,
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
  bookChapters,
  bookPurchases,
  bookHighlights,
  appSettings,
  subscriptionPlans,
  type BookChapter,
  type InsertBookChapter,
  type BookPurchase,
  type BookHighlight,
  type InsertBookHighlight,
  type AppSetting,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
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
  getEventCounts(days?: number, excludeAdmins?: boolean, startDate?: string, endDate?: string): Promise<{ event: string; count: number }[]>;
  getDailyActiveUsers(days?: number, excludeAdmins?: boolean, startDate?: string, endDate?: string): Promise<{ date: string; count: number }[]>;
  getTopActiveUsers(days?: number, excludeAdmins?: boolean, startDate?: string, endDate?: string, limit?: number): Promise<{ userId: string; name: string; email: string; avatarUrl: string | null; count: number }[]>;
  getHourlyActiveUsers(date: string, excludeAdmins?: boolean): Promise<{ hour: number; count: number }[]>;
  getHourlyPattern(days?: number, excludeAdmins?: boolean, startDate?: string, endDate?: string): Promise<{ hour: number; count: number }[]>;
  getWeekdayPattern(days?: number, excludeAdmins?: boolean, startDate?: string, endDate?: string): Promise<{ weekday: number; name: string; count: number }[]>;
  getAgeGroupActivity(days?: number, excludeAdmins?: boolean, startDate?: string, endDate?: string): Promise<{ range: string; eventCount: number; userCount: number }[]>;
  getAvgSessionTime(excludeAdmins?: boolean): Promise<{ period: string; days: number; avgSeconds: number; totalSessions: number; uniqueUsers: number }[]>;

  getBookChapters(): Promise<Omit<BookChapter, "content">[]>;
  searchBookChapters(query: string, hasPurchased: boolean): Promise<{ chapterId: number; order: number; title: string; pageType: string; isPreview: boolean; before: string; match: string; after: string }[]>;
  getBookChapter(id: number): Promise<BookChapter | undefined>;
  createBookChapter(data: InsertBookChapter): Promise<BookChapter>;
  updateBookChapter(id: number, data: Partial<InsertBookChapter>): Promise<BookChapter | undefined>;
  deleteBookChapter(id: number): Promise<boolean>;
  getUserBookPurchase(userId: string): Promise<BookPurchase | undefined>;
  createBookPurchase(userId: string, paymentIntentId: string, amountCents: number): Promise<BookPurchase>;
  getBookPurchases(): Promise<{ userId: string; name: string; email: string; amountCents: number; createdAt: Date }[]>;
  getAllBookPurchaseUserIds(): Promise<Set<string>>;
  revokeBookAccess(userId: string): Promise<void>;

  getBookHighlights(userId: string): Promise<BookHighlight[]>;
  createBookHighlight(data: InsertBookHighlight): Promise<BookHighlight>;
  deleteBookHighlight(id: number, userId: string): Promise<boolean>;
  getAppSetting(key: string): Promise<string | null>;
  setAppSetting(key: string, value: string): Promise<void>;
  getAllAppSettings(): Promise<Record<string, string>>;

  getSubscriptionPlans(includeInactive?: boolean): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(data: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: number): Promise<boolean>;

  getOrCreateReferralCode(userId: string): Promise<string>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createReferral(referrerId: string, referredId: string): Promise<void>;
  getReferralStats(userId: string): Promise<{ invited: number; converted: number }>;
  rewardReferrer(referredId: string): Promise<string | null>;
}

function decryptUser<T extends User | undefined>(user: T): T {
  if (!user) return user;
  return { ...user, email: decryptField(user.email) } as T;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return decryptUser(user);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return decryptUser(user);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalized = email.trim().toLowerCase();
    const hash = hashEmail(normalized);

    // Primary lookup: by current-key HMAC hash
    let [user] = await db.select().from(users).where(eq(users.emailHash, hash));
    if (user) return decryptUser(user);

    // Fallback: users registered when ENC_KEY was null had emailHash = normalized email
    [user] = await db.select().from(users).where(eq(users.emailHash, normalized));
    if (user) return decryptUser(user);

    return undefined;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return decryptUser(user);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const dbData: any = { ...insertUser };
    if (dbData.email) {
      dbData.emailHash = hashEmail(dbData.email);
      dbData.email = encryptField(dbData.email);
    }
    const [user] = await db.insert(users).values(dbData).returning();
    return decryptUser(user);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return decryptUser(user);
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.appleId, appleId));
    return decryptUser(user);
  }

  async updateUser(id: string, data: Partial<Pick<User, "name" | "email" | "role" | "isPremium" | "isActive" | "premiumUntil" | "trialEndsAt" | "invitedBy" | "password" | "journeyOnboardingDone" | "journeyOrder" | "emailVerified" | "emailVerificationToken" | "passwordResetToken" | "passwordResetExpires" | "profilePhoto" | "googleId" | "appleId" | "stripeCustomerId" | "stripeSubscriptionId" | "lastActiveAt" | "pwaInstalled" | "birthYear" | "interests">>): Promise<User | undefined> {
    const dbData: any = { ...data };
    if (dbData.email) {
      dbData.emailHash = hashEmail(dbData.email);
      dbData.email = encryptField(dbData.email);
    }
    const [updated] = await db.update(users).set(dbData).where(eq(users.id, id)).returning();
    return decryptUser(updated);
  }

  async getAllUsers(): Promise<User[]> {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return rows.map(decryptUser);
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

  async getEventCounts(days: number = 30, excludeAdmins: boolean = false, startDate?: string, endDate?: string): Promise<{ event: string; count: number }[]> {
    const since = startDate ? new Date(startDate + "T00:00:00-03:00") : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const until = endDate ? new Date(endDate + "T23:59:59-03:00") : new Date();
    const adminClause = excludeAdmins
      ? `AND ue.user_id IN (SELECT id FROM users WHERE role != 'admin')`
      : "";
    const rows = await db.execute(drizzleSql`
      SELECT ue.event, COUNT(*) as count
      FROM user_events ue
      WHERE ue.created_at >= ${since} AND ue.created_at <= ${until}
      ${drizzleSql.raw(adminClause)}
      GROUP BY ue.event
      ORDER BY count DESC
    `);
    return (rows.rows as any[]).map(r => ({ event: r.event, count: Number(r.count) }));
  }

  async getDailyActiveUsers(days: number = 30, excludeAdmins: boolean = false, startDate?: string, endDate?: string): Promise<{ date: string; count: number }[]> {
    const since = startDate ? new Date(startDate + "T00:00:00-03:00") : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const until = endDate ? new Date(endDate + "T23:59:59-03:00") : new Date();
    const adminUserClause = excludeAdmins
      ? `AND user_id NOT IN (SELECT id FROM users WHERE role = 'admin')`
      : "";
    const rows = await db.execute(drizzleSql`
      SELECT TO_CHAR((activity_time AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as date,
             COUNT(DISTINCT user_id) as count
      FROM (
        SELECT user_id, created_at as activity_time FROM journal_entries
        WHERE created_at >= ${since} AND created_at <= ${until}
        UNION ALL
        SELECT user_id, created_at as activity_time FROM mood_checkins
        WHERE created_at >= ${since} AND created_at <= ${until}
        UNION ALL
        SELECT user_id, created_at as activity_time FROM user_events
        WHERE created_at >= ${since} AND created_at <= ${until} AND user_id IS NOT NULL
      ) all_activity
      WHERE 1=1
      ${drizzleSql.raw(adminUserClause)}
      GROUP BY TO_CHAR((activity_time AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
      ORDER BY date ASC
    `);
    const dataMap = new Map<string, number>(
      (rows.rows as any[]).map(r => [r.date as string, Number(r.count)])
    );
    const result: { date: string; count: number }[] = [];
    let cursor = new Date(since);
    while (cursor <= until) {
      const brt = new Date(cursor.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      const dateStr = `${brt.getFullYear()}-${String(brt.getMonth() + 1).padStart(2, "0")}-${String(brt.getDate()).padStart(2, "0")}`;
      result.push({ date: dateStr, count: dataMap.get(dateStr) ?? 0 });
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
    return result;
  }

  async getTopActiveUsers(days: number = 30, excludeAdmins: boolean = false, startDate?: string, endDate?: string, limit: number = 10): Promise<{ userId: string; name: string; email: string; avatarUrl: string | null; count: number }[]> {
    const since = startDate ? new Date(startDate + "T00:00:00-03:00") : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const until = endDate ? new Date(endDate + "T23:59:59-03:00") : new Date();
    const adminClause = excludeAdmins ? `AND u.role != 'admin'` : "";
    const rows = await db.execute(drizzleSql`
      SELECT u.id as user_id, u.name, u.email, u.profile_photo, SUM(activity_count) as count
      FROM (
        SELECT user_id, COUNT(*) as activity_count
        FROM journal_entries
        WHERE created_at >= ${since} AND created_at <= ${until}
        GROUP BY user_id
        UNION ALL
        SELECT user_id, COUNT(*) as activity_count
        FROM mood_checkins
        WHERE created_at >= ${since} AND created_at <= ${until}
        GROUP BY user_id
        UNION ALL
        SELECT user_id, COUNT(*) as activity_count
        FROM user_events
        WHERE created_at >= ${since} AND created_at <= ${until} AND user_id IS NOT NULL
        GROUP BY user_id
      ) activity
      JOIN users u ON activity.user_id = u.id
      WHERE 1=1
      ${drizzleSql.raw(adminClause)}
      GROUP BY u.id, u.name, u.email, u.profile_photo
      ORDER BY count DESC
      LIMIT ${drizzleSql.raw(String(limit))}
    `);
    return (rows.rows as any[]).map(r => ({
      userId: r.user_id,
      name: r.name || "Sem nome",
      email: decryptField(r.email || ""),
      avatarUrl: r.profile_photo || null,
      count: Number(r.count),
    }));
  }

  async getHourlyActiveUsers(date: string, excludeAdmins: boolean = false): Promise<{ hour: number; count: number }[]> {
    const adminClause = excludeAdmins ? `AND ue.user_id IN (SELECT id FROM users WHERE role != 'admin')` : "";
    const rows = await db.execute(drizzleSql`
      SELECT EXTRACT(HOUR FROM (ue.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::int AS hour,
             COUNT(DISTINCT ue.user_id) as count
      FROM user_events ue
      WHERE DATE((ue.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo') = ${date}
        AND ue.user_id IS NOT NULL
      ${drizzleSql.raw(adminClause)}
      GROUP BY EXTRACT(HOUR FROM (ue.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY hour ASC
    `);
    const dataMap = new Map<number, number>(
      (rows.rows as any[]).map(r => [Number(r.hour), Number(r.count)])
    );
    return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: dataMap.get(h) ?? 0 }));
  }

  async getHourlyPattern(days: number = 30, excludeAdmins: boolean = false, startDate?: string, endDate?: string): Promise<{ hour: number; count: number }[]> {
    const since = startDate ? new Date(startDate + "T00:00:00-03:00") : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const until = endDate ? new Date(endDate + "T23:59:59-03:00") : new Date();
    const adminClause = excludeAdmins ? `AND ue.user_id IN (SELECT id FROM users WHERE role != 'admin')` : "";
    const rows = await db.execute(drizzleSql`
      SELECT EXTRACT(HOUR FROM (ue.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::int AS hour,
             COUNT(*) as count
      FROM user_events ue
      WHERE ue.created_at >= ${since} AND ue.created_at <= ${until}
        AND ue.user_id IS NOT NULL
      ${drizzleSql.raw(adminClause)}
      GROUP BY EXTRACT(HOUR FROM (ue.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY hour ASC
    `);
    const dataMap = new Map<number, number>((rows.rows as any[]).map(r => [Number(r.hour), Number(r.count)]));
    return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: dataMap.get(h) ?? 0 }));
  }

  async getWeekdayPattern(days: number = 30, excludeAdmins: boolean = false, startDate?: string, endDate?: string): Promise<{ weekday: number; name: string; count: number }[]> {
    const since = startDate ? new Date(startDate + "T00:00:00-03:00") : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const until = endDate ? new Date(endDate + "T23:59:59-03:00") : new Date();
    const adminClause = excludeAdmins ? `AND user_id IN (SELECT id FROM users WHERE role != 'admin')` : "";
    const rows = await db.execute(drizzleSql`
      SELECT EXTRACT(DOW FROM (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')::int AS weekday,
             COUNT(*) as count
      FROM user_events
      WHERE created_at >= ${since} AND created_at <= ${until}
        AND user_id IS NOT NULL
      ${drizzleSql.raw(adminClause)}
      GROUP BY EXTRACT(DOW FROM (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY weekday ASC
    `);
    const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dataMap = new Map<number, number>((rows.rows as any[]).map(r => [Number(r.weekday), Number(r.count)]));
    return Array.from({ length: 7 }, (_, i) => ({ weekday: i, name: names[i], count: dataMap.get(i) ?? 0 }));
  }

  async getAgeGroupActivity(days: number = 30, excludeAdmins: boolean = false, startDate?: string, endDate?: string): Promise<{ range: string; eventCount: number; userCount: number }[]> {
    const since = startDate ? new Date(startDate + "T00:00:00-03:00") : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const until = endDate ? new Date(endDate + "T23:59:59-03:00") : new Date();
    const adminClause = excludeAdmins ? `AND u.role != 'admin'` : "";
    const rows = await db.execute(drizzleSql`
      SELECT u.birth_year, COUNT(ue.id) as event_count, COUNT(DISTINCT ue.user_id) as user_count
      FROM user_events ue
      JOIN users u ON ue.user_id = u.id
      WHERE ue.created_at >= ${since} AND ue.created_at <= ${until}
        AND u.birth_year IS NOT NULL
      ${drizzleSql.raw(adminClause)}
      GROUP BY u.birth_year
    `);
    const now = new Date().getFullYear();
    const ranges = [
      { range: "15–19", min: 15, max: 19 },
      { range: "20–22", min: 20, max: 22 },
      { range: "23–25", min: 23, max: 25 },
      { range: "26–29", min: 26, max: 29 },
      { range: "30–35", min: 30, max: 35 },
      { range: "36+",   min: 36, max: 999 },
    ];
    const buckets = new Map<string, { eventCount: number; userCount: number }>(
      ranges.map(r => [r.range, { eventCount: 0, userCount: 0 }])
    );
    for (const row of rows.rows as any[]) {
      const age = now - Number(row.birth_year);
      const bucket = ranges.find(r => age >= r.min && age <= r.max);
      if (bucket) {
        const b = buckets.get(bucket.range)!;
        b.eventCount += Number(row.event_count);
        b.userCount += Number(row.user_count);
      }
    }
    return ranges.map(r => ({ range: r.range, ...buckets.get(r.range)! }));
  }

  async getAvgSessionTime(excludeAdmins: boolean = false): Promise<{ period: string; days: number; avgSeconds: number; totalSessions: number; uniqueUsers: number }[]> {
    const periods = [
      { label: "Hoje", days: 1 },
      { label: "7 dias", days: 7 },
      { label: "30 dias", days: 30 },
      { label: "90 dias", days: 90 },
      { label: "Tudo", days: 3650 },
    ];
    const adminClause = excludeAdmins ? `AND user_id NOT IN (SELECT id FROM users WHERE role = 'admin')` : "";
    const results = await Promise.all(periods.map(async ({ label, days }) => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const rows = await db.execute(drizzleSql`
        WITH ordered_events AS (
          SELECT user_id, created_at,
            LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_at
          FROM user_events
          WHERE created_at >= ${since} AND user_id IS NOT NULL
          ${drizzleSql.raw(adminClause)}
        ),
        session_marks AS (
          SELECT user_id, created_at,
            CASE
              WHEN prev_at IS NULL OR EXTRACT(EPOCH FROM (created_at - prev_at)) > 1800
              THEN 1 ELSE 0
            END AS is_new_session
          FROM ordered_events
        ),
        sessions AS (
          SELECT user_id, created_at,
            SUM(is_new_session) OVER (
              PARTITION BY user_id ORDER BY created_at
              ROWS UNBOUNDED PRECEDING
            ) AS session_num
          FROM session_marks
        ),
        session_durations AS (
          SELECT user_id, session_num,
            GREATEST(
              EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))),
              60
            ) AS duration_secs
          FROM sessions
          GROUP BY user_id, session_num
        )
        SELECT
          ROUND(AVG(duration_secs))::int AS avg_seconds,
          COUNT(*)::int AS total_sessions,
          COUNT(DISTINCT user_id)::int AS unique_users
        FROM session_durations
      `);
      const r = (rows.rows as any[])[0];
      return {
        period: label,
        days,
        avgSeconds: r ? Number(r.avg_seconds) || 0 : 0,
        totalSessions: r ? Number(r.total_sessions) || 0 : 0,
        uniqueUsers: r ? Number(r.unique_users) || 0 : 0,
      };
    }));
    return results;
  }

  async getBookChapters(): Promise<Omit<BookChapter, "content">[]> {
    const rows = await db
      .select({ id: bookChapters.id, order: bookChapters.order, title: bookChapters.title, tag: bookChapters.tag, excerpt: bookChapters.excerpt, isPreview: bookChapters.isPreview, pageType: bookChapters.pageType, pdfPage: bookChapters.pdfPage, createdAt: bookChapters.createdAt })
      .from(bookChapters)
      .orderBy(bookChapters.order);
    return rows;
  }

  async searchBookChapters(query: string, hasPurchased: boolean): Promise<{ chapterId: number; order: number; title: string; pageType: string; isPreview: boolean; before: string; match: string; after: string }[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const allChapters = await db.select().from(bookChapters).orderBy(bookChapters.order);
    const results: { chapterId: number; order: number; title: string; pageType: string; isPreview: boolean; before: string; match: string; after: string }[] = [];

    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const stripMd = (s: string) => s.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1").replace(/^- /gm, "").replace(/^#+\s*/gm, "");
    const normalQ = normalize(q);

    for (const ch of allChapters) {
      if (!hasPurchased && !ch.isPreview) continue;
      const plain = stripMd(ch.content ?? "");
      const normalPlain = normalize(plain);
      let searchFrom = 0;
      let chapterHits = 0;
      while (results.length < 60 && chapterHits < 3) {
        const pos = normalPlain.indexOf(normalQ, searchFrom);
        if (pos === -1) break;
        searchFrom = pos + normalQ.length;
        const snipStart = Math.max(0, pos - 60);
        const snipEnd = Math.min(plain.length, pos + q.length + 60);
        results.push({
          chapterId: ch.id,
          order: ch.order,
          title: ch.title,
          pageType: ch.pageType ?? "chapter",
          isPreview: ch.isPreview ?? false,
          before: (snipStart > 0 ? "…" : "") + plain.slice(snipStart, pos),
          match: plain.slice(pos, pos + q.length),
          after: plain.slice(pos + q.length, snipEnd) + (snipEnd < plain.length ? "…" : ""),
        });
        chapterHits++;
      }
      if (results.length >= 60) break;
    }
    return results;
  }

  async getBookChapter(id: number): Promise<BookChapter | undefined> {
    const [row] = await db.select().from(bookChapters).where(eq(bookChapters.id, id));
    return row;
  }

  async createBookChapter(data: InsertBookChapter): Promise<BookChapter> {
    const [row] = await db.insert(bookChapters).values(data).returning();
    return row;
  }

  async updateBookChapter(id: number, data: Partial<InsertBookChapter>): Promise<BookChapter | undefined> {
    const [row] = await db.update(bookChapters).set(data).where(eq(bookChapters.id, id)).returning();
    return row;
  }

  async deleteBookChapter(id: number): Promise<boolean> {
    const result = await db.delete(bookChapters).where(eq(bookChapters.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserBookPurchase(userId: string): Promise<BookPurchase | undefined> {
    const [row] = await db.select().from(bookPurchases).where(eq(bookPurchases.userId, userId));
    return row;
  }

  async createBookPurchase(userId: string, paymentIntentId: string, amountCents: number): Promise<BookPurchase> {
    const [row] = await db.insert(bookPurchases).values({ userId, stripePaymentIntentId: paymentIntentId, amountCents }).returning();
    return row;
  }

  async getBookPurchases(): Promise<{ userId: string; name: string; email: string; amountCents: number; createdAt: Date }[]> {
    const rows = await db.execute(drizzleSql`
      SELECT bp.user_id, u.name, u.email, bp.amount_cents, bp.created_at
      FROM book_purchases bp
      JOIN users u ON bp.user_id = u.id
      ORDER BY bp.created_at DESC
    `);
    return (rows.rows as any[]).map(r => ({
      userId: r.user_id,
      name: r.name || "",
      email: decryptField(r.email || ""),
      amountCents: Number(r.amount_cents),
      createdAt: new Date(r.created_at),
    }));
  }

  async getAllBookPurchaseUserIds(): Promise<Set<string>> {
    const rows = await db.select({ userId: bookPurchases.userId }).from(bookPurchases);
    return new Set(rows.map(r => r.userId));
  }

  async revokeBookAccess(userId: string): Promise<void> {
    await db.delete(bookPurchases).where(eq(bookPurchases.userId, userId));
  }

  async getBookHighlights(userId: string): Promise<BookHighlight[]> {
    return db.select().from(bookHighlights)
      .where(eq(bookHighlights.userId, userId))
      .orderBy(desc(bookHighlights.createdAt));
  }

  async createBookHighlight(data: InsertBookHighlight): Promise<BookHighlight> {
    const [row] = await db.insert(bookHighlights).values(data).returning();
    return row;
  }

  async deleteBookHighlight(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(bookHighlights)
      .where(and(eq(bookHighlights.id, id), eq(bookHighlights.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getAppSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return row?.value ?? null;
  }

  async setAppSetting(key: string, value: string): Promise<void> {
    await db.insert(appSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
  }

  async getAllAppSettings(): Promise<Record<string, string>> {
    const rows = await db.select().from(appSettings);
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }

  async getSubscriptionPlans(includeInactive = false): Promise<SubscriptionPlan[]> {
    const rows = await db.select().from(subscriptionPlans)
      .orderBy(subscriptionPlans.sortOrder, subscriptionPlans.createdAt);
    if (includeInactive) return rows;
    const now = new Date();
    return rows.filter(r => r.isActive && (!r.validUntil || new Date(r.validUntil) > now));
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [row] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return row;
  }

  async createSubscriptionPlan(data: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [row] = await db.insert(subscriptionPlans).values(data).returning();
    return row;
  }

  async updateSubscriptionPlan(id: number, data: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [row] = await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id)).returning();
    return row;
  }

  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    const result = await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getOrCreateReferralCode(userId: string): Promise<string> {
    const [user] = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, userId));
    if (user?.referralCode) return user.referralCode;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
    return code;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return decryptUser(user);
  }

  async createReferral(referrerId: string, referredId: string): Promise<void> {
    const existing = await db.select().from(referrals)
      .where(and(eq(referrals.referrerId, referrerId), eq(referrals.referredId, referredId)));
    if (existing.length > 0) return;
    await db.insert(referrals).values({ referrerId, referredId, status: "pending" });
  }

  async getReferralStats(userId: string): Promise<{ invited: number; converted: number }> {
    const [invited] = await db.select({ count: count() }).from(referrals).where(eq(referrals.referrerId, userId));
    const [converted] = await db.select({ count: count() }).from(referrals)
      .where(and(eq(referrals.referrerId, userId), eq(referrals.status, "rewarded")));
    return { invited: invited?.count ?? 0, converted: converted?.count ?? 0 };
  }

  async rewardReferrer(referredId: string): Promise<string | null> {
    // Find the pending referral for this referred user
    const [referral] = await db.select().from(referrals)
      .where(and(eq(referrals.referredId, referredId), eq(referrals.status, "pending")));
    if (!referral) return null;

    // Grant 30 days premium to the referrer
    const [referrer] = await db.select().from(users).where(eq(users.id, referral.referrerId));
    if (!referrer) return null;

    const now = new Date();
    const base = referrer.premiumUntil && new Date(referrer.premiumUntil) > now
      ? new Date(referrer.premiumUntil)
      : now;
    const newPremiumUntil = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.update(users).set({ isPremium: true, premiumUntil: newPremiumUntil }).where(eq(users.id, referral.referrerId));
    await db.update(referrals).set({ status: "rewarded", rewardedAt: now }).where(eq(referrals.id, referral.id));

    return referral.referrerId;
  }
}

export const storage = new DatabaseStorage();
