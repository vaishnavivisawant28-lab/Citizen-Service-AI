import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const citizens = pgTable("citizens", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  aadhaarNumber: text("aadhaar_number").notNull().unique(),
  mobileNumber: text("mobile_number"),
  email: text("email"),
  address: text("address"),
  role: text("role").notNull().default("citizen"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCitizenSchema = createInsertSchema(citizens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Citizen = typeof citizens.$inferSelect;
export type InsertCitizen = z.infer<typeof insertCitizenSchema>;
