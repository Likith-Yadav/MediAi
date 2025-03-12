import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  age: integer("age"),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  age: true,
  bloodType: true,
  allergies: true,
});

// Consultations model
export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  date: timestamp("date").defaultNow(),
  status: text("status").notNull().default("active"),
});

export const insertConsultationSchema = createInsertSchema(consultations).pick({
  userId: true,
  title: true,
  status: true,
});

// Messages model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultation_id").notNull(),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  consultationId: true,
  content: true,
  role: true,
});

// Diagnoses model
export const diagnoses = pgTable("diagnoses", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultation_id").notNull(),
  conditions: jsonb("conditions").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  warnings: jsonb("warnings"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDiagnosisSchema = createInsertSchema(diagnoses).pick({
  consultationId: true,
  conditions: true,
  recommendations: true,
  warnings: true,
});

// Media uploads model
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultation_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  analysisResult: jsonb("analysis_result"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertUploadSchema = createInsertSchema(uploads).pick({
  consultationId: true,
  fileName: true,
  fileType: true,
  analysisResult: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Diagnosis = typeof diagnoses.$inferSelect;
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
