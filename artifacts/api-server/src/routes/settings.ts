import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function formatSettings(s: typeof settingsTable.$inferSelect) {
  return {
    id: s.id,
    hotelName: s.hotelName,
    tagline: s.tagline ?? null,
    address: s.address,
    phone: s.phone,
    email: s.email ?? null,
    website: s.website ?? null,
    gstin: s.gstin ?? null,
    currency: s.currency,
    taxEnabled: s.taxEnabled,
    taxRate: parseFloat(s.taxRate as string),
    checkInTime: s.checkInTime,
    checkOutTime: s.checkOutTime,
    updatedAt: s.updatedAt?.toISOString(),
  };
}

async function getOrCreateSettings() {
  const rows = await db.select().from(settingsTable).limit(1);
  if (rows[0]) return rows[0];
  const inserted = await db.insert(settingsTable).values({
    hotelName: "Vaishnavi Residency",
    tagline: "Your Home Away From Home",
    address: "123 Main Street, City - 000000",
    phone: "9876543210",
    email: "info@vaishnaviresidency.com",
    currency: "INR",
    taxEnabled: false,
    taxRate: "18",
    checkInTime: "12:00",
    checkOutTime: "11:00",
  }).returning();
  return inserted[0];
}

router.get("/settings", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(formatSettings(settings));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const {
      hotelName, tagline, address, phone, email, website, gstin,
      currency, taxEnabled, taxRate, checkInTime, checkOutTime,
    } = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (hotelName !== undefined) updateData.hotelName = hotelName;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (gstin !== undefined) updateData.gstin = gstin;
    if (currency !== undefined) updateData.currency = currency;
    if (taxEnabled !== undefined) updateData.taxEnabled = taxEnabled;
    if (taxRate !== undefined) updateData.taxRate = String(taxRate);
    if (checkInTime !== undefined) updateData.checkInTime = checkInTime;
    if (checkOutTime !== undefined) updateData.checkOutTime = checkOutTime;

    const rows = await db.update(settingsTable).set(updateData).where(eq(settingsTable.id, settings.id)).returning();
    res.json(formatSettings(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
