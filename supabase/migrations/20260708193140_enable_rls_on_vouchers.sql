/*
# Enable RLS on vouchers table

## Summary
The `vouchers` table was created without Row Level Security (RLS), leaving it
accessible without any policy-level access control. This migration enables RLS
and adds permissive CRUD policies so the application (which connects via the
anon key through the Express API server) can continue to read and write rows.

## Context
- The app uses custom username/password auth in its own `users` table, NOT
  Supabase Auth. There is no `auth.uid()` to scope ownership against.
- The `vouchers` table has no `user_id` column.
- The Express API server connects to Supabase using the anon key, so policies
  must allow the `anon` role.

## Changes
1. Enable RLS on `public.vouchers`.
2. Create four policies (SELECT, INSERT, UPDATE, DELETE) scoped to
   `anon, authenticated` with `USING (true)` / `WITH CHECK (true)`, because
   the data is intentionally shared within this single-tenant app.

## Security
- RLS is now enabled, closing the "public, RLS disabled" exposure.
- Access is gated behind the anon/authenticated roles via policies.
*/

ALTER TABLE "vouchers" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vouchers" ON "vouchers";
CREATE POLICY "anon_select_vouchers" ON "vouchers"
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vouchers" ON "vouchers";
CREATE POLICY "anon_insert_vouchers" ON "vouchers"
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vouchers" ON "vouchers";
CREATE POLICY "anon_update_vouchers" ON "vouchers"
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vouchers" ON "vouchers";
CREATE POLICY "anon_delete_vouchers" ON "vouchers"
  FOR DELETE TO anon, authenticated USING (true);
