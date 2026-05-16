import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  sourceName: text("source_name").notNull(),
  documentText: text("document_text").notNull(),
  chunk: text("chunk").notNull(),
  chunkIndex: serial("chunk_index"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({
  id: true,
  createdAt: true,
});

export type KnowledgeBaseEntry = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBaseEntry = z.infer<typeof insertKnowledgeBaseSchema>;
