import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  isPremium: boolean("is_premium").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  trialEndsAt: timestamp("trial_ends_at"),
  premiumUntil: timestamp("premium_until"),
  invitedBy: varchar("invited_by"),
  journeyOnboardingDone: boolean("journey_onboarding_done").notNull().default(false),
  journeyOrder: text("journey_order").array().notNull().default(sql`'{}'::text[]`),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  googleId: text("google_id"),
  appleId: text("apple_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  mood: text("mood"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moodCheckins = pgTable("mood_checkins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  mood: text("mood").notNull(),
  entry: text("entry").notNull().default(""),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMoodCheckinSchema = createInsertSchema(moodCheckins).omit({
  id: true,
  createdAt: true,
});

export const feedbackTickets = pgTable("feedback_tickets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull().default("feedback"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedbackTicketSchema = createInsertSchema(feedbackTickets).omit({
  id: true,
  createdAt: true,
});

export const journeyProgress = pgTable("journey_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  journeyId: text("journey_id").notNull(),
  completedDays: text("completed_days").array().notNull().default(sql`'{}'::text[]`),
  completedTimestamps: text("completed_timestamps").default("{}"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
});

export const insertJourneyProgressSchema = createInsertSchema(journeyProgress).omit({
  id: true,
  startedAt: true,
  lastActivityAt: true,
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export const scheduledNotifications = pgTable("scheduled_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url").notNull().default("/"),
  intervalHours: integer("interval_hours").notNull().default(24),
  isActive: boolean("is_active").notNull().default(true),
  lastSentAt: timestamp("last_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScheduledNotificationSchema = createInsertSchema(scheduledNotifications).omit({
  id: true,
  lastSentAt: true,
  createdAt: true,
});

export type InsertScheduledNotification = z.infer<typeof insertScheduledNotificationSchema>;
export type ScheduledNotification = typeof scheduledNotifications.$inferSelect;

export const journeyReports = pgTable("journey_reports", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  journeyId: text("journey_id").notNull(),
  journeyTitle: text("journey_title").notNull(),
  reportData: text("report_data").notNull(),
  entriesCount: integer("entries_count").notNull().default(0),
  completedDays: integer("completed_days").notNull(),
  totalDays: integer("total_days").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJourneyReportSchema = createInsertSchema(journeyReports).omit({
  id: true,
  createdAt: true,
});

export type InsertJourneyReport = z.infer<typeof insertJourneyReportSchema>;
export type JourneyReport = typeof journeyReports.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertMoodCheckin = z.infer<typeof insertMoodCheckinSchema>;
export type MoodCheckin = typeof moodCheckins.$inferSelect;
export type InsertFeedbackTicket = z.infer<typeof insertFeedbackTicketSchema>;
export type FeedbackTicket = typeof feedbackTickets.$inferSelect;
export type InsertJourneyProgress = z.infer<typeof insertJourneyProgressSchema>;
export type JourneyProgress = typeof journeyProgress.$inferSelect;
