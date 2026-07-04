CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_number" text NOT NULL,
	"date" text,
	"time" text,
	"guest_name" text NOT NULL,
	"gender" text,
	"age" integer,
	"mobile" text NOT NULL,
	"alternative_mobile" text,
	"address" text,
	"aadhaar_number" text,
	"id_proof_type" text,
	"pax" integer DEFAULT 1 NOT NULL,
	"room_id" integer NOT NULL,
	"check_in_date" text NOT NULL,
	"check_in_time" text,
	"expected_check_out_date" text,
	"expected_check_out_time" text,
	"actual_check_out_date" text,
	"actual_check_out_time" text,
	"number_of_days" integer,
	"rent_per_day" numeric(10, 2) DEFAULT '0' NOT NULL,
	"extra_charges" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"gst" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"advance_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_mode" text,
	"remarks" text,
	"receptionist_name" text,
	"status" text DEFAULT 'booked' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guests_bill_number_unique" UNIQUE("bill_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_number" text NOT NULL,
	"type" text NOT NULL,
	"guest_id" integer NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_mode" text DEFAULT 'Cash' NOT NULL,
	"date" text,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_voucher_number_unique" UNIQUE("voucher_number")
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"reservation_number" text NOT NULL,
	"guest_name" text NOT NULL,
	"mobile" text NOT NULL,
	"room_id" integer NOT NULL,
	"check_in_date" text NOT NULL,
	"check_out_date" text NOT NULL,
	"advance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_reservation_number_unique" UNIQUE("reservation_number")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_number" text NOT NULL,
	"type" text DEFAULT 'Standard' NOT NULL,
	"ac_type" text DEFAULT 'Non-AC' NOT NULL,
	"rent_per_day" numeric(10, 2) DEFAULT '1000' NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"floor" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_room_number_unique" UNIQUE("room_number")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_name" text DEFAULT 'Vaishnavi Residency' NOT NULL,
	"tagline" text,
	"address" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text,
	"website" text,
	"gstin" text,
	"currency" text DEFAULT 'INR' NOT NULL,
	"tax_enabled" boolean DEFAULT false NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '18' NOT NULL,
	"check_in_time" text DEFAULT '12:00' NOT NULL,
	"check_out_time" text DEFAULT '11:00' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'receptionist' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
