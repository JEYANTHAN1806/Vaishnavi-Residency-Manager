import { pgTable, unique, serial, text, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const guests = pgTable("guests", {
	id: serial().primaryKey().notNull(),
	billNumber: text("bill_number").notNull(),
	date: text(),
	time: text(),
	guestName: text("guest_name").notNull(),
	gender: text(),
	age: integer(),
	mobile: text().notNull(),
	alternativeMobile: text("alternative_mobile"),
	address: text(),
	aadhaarNumber: text("aadhaar_number"),
	idProofType: text("id_proof_type"),
	pax: integer().default(1).notNull(),
	roomId: integer("room_id").notNull(),
	checkInDate: text("check_in_date").notNull(),
	checkInTime: text("check_in_time"),
	expectedCheckOutDate: text("expected_check_out_date"),
	expectedCheckOutTime: text("expected_check_out_time"),
	actualCheckOutDate: text("actual_check_out_date"),
	actualCheckOutTime: text("actual_check_out_time"),
	numberOfDays: integer("number_of_days"),
	rentPerDay: numeric("rent_per_day", { precision: 10, scale:  2 }).default('0').notNull(),
	extraCharges: numeric("extra_charges", { precision: 10, scale:  2 }).default('0').notNull(),
	discount: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	gst: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	advancePaid: numeric("advance_paid", { precision: 10, scale:  2 }).default('0').notNull(),
	balanceAmount: numeric("balance_amount", { precision: 10, scale:  2 }).default('0').notNull(),
	paymentMode: text("payment_mode"),
	remarks: text(),
	receptionistName: text("receptionist_name"),
	status: text().default('booked').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("guests_bill_number_unique").on(table.billNumber),
]);

export const payments = pgTable("payments", {
	id: serial().primaryKey().notNull(),
	voucherNumber: text("voucher_number").notNull(),
	type: text().notNull(),
	guestId: integer("guest_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	paymentMode: text("payment_mode").default('Cash').notNull(),
	date: text(),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("payments_voucher_number_unique").on(table.voucherNumber),
]);

export const reservations = pgTable("reservations", {
	id: serial().primaryKey().notNull(),
	reservationNumber: text("reservation_number").notNull(),
	guestName: text("guest_name").notNull(),
	mobile: text().notNull(),
	roomId: integer("room_id").notNull(),
	checkInDate: text("check_in_date").notNull(),
	checkOutDate: text("check_out_date").notNull(),
	advance: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	status: text().default('reserved').notNull(),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("reservations_reservation_number_unique").on(table.reservationNumber),
]);

export const rooms = pgTable("rooms", {
	id: serial().primaryKey().notNull(),
	roomNumber: text("room_number").notNull(),
	type: text().default('Standard').notNull(),
	acType: text("ac_type").default('Non-AC').notNull(),
	rentPerDay: numeric("rent_per_day", { precision: 10, scale:  2 }).default('1000').notNull(),
	status: text().default('available').notNull(),
	floor: text(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("rooms_room_number_unique").on(table.roomNumber),
]);

export const settings = pgTable("settings", {
	id: serial().primaryKey().notNull(),
	hotelName: text("hotel_name").default('Vaishnavi Residency').notNull(),
	tagline: text(),
	address: text().default(').notNull(),
	phone: text().default(').notNull(),
	email: text(),
	website: text(),
	gstin: text(),
	currency: text().default('INR').notNull(),
	taxEnabled: boolean("tax_enabled").default(false).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale:  2 }).default('18').notNull(),
	checkInTime: text("check_in_time").default('12:00').notNull(),
	checkOutTime: text("check_out_time").default('11:00').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	role: text().default('receptionist').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);
