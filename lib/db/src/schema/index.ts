import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("receptionist"), // admin | receptionist
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ─── Rooms ────────────────────────────────────────────────────────────────────
export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull().unique(),
  type: text("type").notNull().default("Standard"),
  rentPerDay: numeric("rent_per_day", { precision: 10, scale: 2 }).notNull().default("1000"),
  status: text("status").notNull().default("available"), // available | occupied | reserved | cleaning
  floor: text("floor"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;

// ─── Guests ───────────────────────────────────────────────────────────────────
export const guestsTable = pgTable("guests", {
  id: serial("id").primaryKey(),
  billNumber: text("bill_number").notNull().unique(),
  date: text("date"),
  time: text("time"),
  guestName: text("guest_name").notNull(),
  gender: text("gender"),
  age: integer("age"),
  mobile: text("mobile").notNull(),
  alternativeMobile: text("alternative_mobile"),
  address: text("address"),
  aadhaarNumber: text("aadhaar_number"),
  idProofType: text("id_proof_type"),
  pax: integer("pax").notNull().default(1),
  roomId: integer("room_id").notNull(),
  checkInDate: text("check_in_date").notNull(),
  checkInTime: text("check_in_time"),
  expectedCheckOutDate: text("expected_check_out_date"),
  expectedCheckOutTime: text("expected_check_out_time"),
  actualCheckOutDate: text("actual_check_out_date"),
  actualCheckOutTime: text("actual_check_out_time"),
  numberOfDays: integer("number_of_days"),
  rentPerDay: numeric("rent_per_day", { precision: 10, scale: 2 }).notNull().default("0"),
  extraCharges: numeric("extra_charges", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  gst: numeric("gst", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  advancePaid: numeric("advance_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  balanceAmount: numeric("balance_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMode: text("payment_mode"),
  remarks: text("remarks"),
  receptionistName: text("receptionist_name"),
  status: text("status").notNull().default("booked"), // booked | checked-in | checked-out | cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGuestSchema = createInsertSchema(guestsTable).omit({ id: true, createdAt: true });
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guestsTable.$inferSelect;

// ─── Reservations ─────────────────────────────────────────────────────────────
export const reservationsTable = pgTable("reservations", {
  id: serial("id").primaryKey(),
  reservationNumber: text("reservation_number").notNull().unique(),
  guestName: text("guest_name").notNull(),
  mobile: text("mobile").notNull(),
  roomId: integer("room_id").notNull(),
  checkInDate: text("check_in_date").notNull(),
  checkOutDate: text("check_out_date").notNull(),
  advance: numeric("advance", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("reserved"), // reserved | confirmed | cancelled
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReservationSchema = createInsertSchema(reservationsTable).omit({ id: true, createdAt: true });
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  voucherNumber: text("voucher_number").notNull().unique(),
  type: text("type").notNull(), // receipt | payment
  guestId: integer("guest_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMode: text("payment_mode").notNull().default("Cash"),
  date: text("date"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  hotelName: text("hotel_name").notNull().default("Vaishnavi Residency"),
  tagline: text("tagline"),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email"),
  website: text("website"),
  gstin: text("gstin"),
  currency: text("currency").notNull().default("INR"),
  taxEnabled: boolean("tax_enabled").notNull().default(false),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("18"),
  checkInTime: text("check_in_time").notNull().default("12:00"),
  checkOutTime: text("check_out_time").notNull().default("11:00"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
