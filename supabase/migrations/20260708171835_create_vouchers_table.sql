CREATE TABLE "vouchers" (
  "id" serial PRIMARY KEY NOT NULL,
  "voucher_number" text NOT NULL UNIQUE,
  "type" text NOT NULL,
  "name" text NOT NULL,
  "reason" text NOT NULL,
  "amount" numeric(10, 2) NOT NULL DEFAULT '0',
  "amount_in_words" text,
  "date" text NOT NULL,
  "approved_by" text,
  "received_by" text,
  "remarks" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
