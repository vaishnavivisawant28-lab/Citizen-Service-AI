import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { citizens } from "./citizens";

export const updateRequests = pgTable("update_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => citizens.id, { onDelete: "cascade" }),
  fieldName: text("field_name").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUpdateRequestSchema = createInsertSchema(updateRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UpdateRequestRecord = typeof updateRequests.$inferSelect;
export type InsertUpdateRequest = z.infer<typeof insertUpdateRequestSchema>;
