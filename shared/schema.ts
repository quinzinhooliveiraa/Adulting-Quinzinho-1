import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, boolean } from "drizzle-orm/pg-core";
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
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
});

export const insertJourneyProgressSchema = createInsertSchema(journeyProgress).omit({
  id: true,
  startedAt: true,
  lastActivityAt: true,
});

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
