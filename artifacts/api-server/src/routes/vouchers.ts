import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vouchersTable } from "@workspace/db";
import { eq, sql, ilike, gte, lte, and, desc } from "drizzle-orm";

const router: IRouter = Router();

function formatVoucher(v: typeof vouchersTable.$inferSelect) {
  return {
    id: v.id,
    voucherNumber: v.voucherNumber,
    type: v.type,
    name: v.name,
    reason: v.reason,
    amount: parseFloat(v.amount as string),
    amountInWords: v.amountInWords ?? null,
    date: v.date,
    approvedBy: v.approvedBy ?? null,
    receivedBy: v.receivedBy ?? null,
    remarks: v.remarks ?? null,
    createdAt: v.createdAt?.toISOString(),
    updatedAt: v.updatedAt?.toISOString(),
  };
}

async function getNextVoucherNumber(type: string): Promise<string> {
  const prefix = type === "receipt" ? "RV" : "PV";
  const result = await db.select({ voucherNumber: vouchersTable.voucherNumber })
    .from(vouchersTable)
    .where(sql`${vouchersTable.type} = ${type}`)
    .orderBy(desc(vouchersTable.voucherNumber))
    .limit(1);
  if (!result[0]) return `${prefix}-000001`;
  const last = result[0].voucherNumber;
  const match = last.match(/-(\d+)/);
  if (!match) return `${prefix}-000001`;
  const next = parseInt(match[1]) + 1;
  return `${prefix}-${String(next).padStart(6, "0")}`;
}

router.get("/vouchers/next-voucher-number", async (req, res) => {
  try {
    const type = (req.query.type as string) || "payment";
    const voucherNumber = await getNextVoucherNumber(type);
    res.json({ voucherNumber });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/vouchers", async (req, res) => {
  try {
    const typeFilter = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    const conditions: ReturnType<typeof eq>[] = [];
    if (typeFilter) conditions.push(eq(vouchersTable.type, typeFilter));
    if (search) conditions.push(ilike(vouchersTable.name, `%${search}%`));
    if (fromDate) conditions.push(gte(vouchersTable.date, fromDate));
    if (toDate) conditions.push(lte(vouchersTable.date, toDate));

    const query = db.select().from(vouchersTable);
    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(vouchersTable.createdAt))
      : await query.orderBy(desc(vouchersTable.createdAt));

    res.json(rows.map(formatVoucher));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/vouchers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(vouchersTable).where(eq(vouchersTable.id, id));
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatVoucher(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/vouchers", async (req, res) => {
  try {
    const { type, name, reason, amount, amountInWords, date, approvedBy, receivedBy, remarks } = req.body;
    if (!type || !name || !reason || amount === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const voucherNumber = await getNextVoucherNumber(type);
    const today = new Date().toLocaleDateString("en-IN");
    const rows = await db.insert(vouchersTable).values({
      voucherNumber,
      type,
      name,
      reason,
      amount: String(amount),
      amountInWords: amountInWords || null,
      date: date || today,
      approvedBy: approvedBy || null,
      receivedBy: receivedBy || null,
      remarks: remarks || null,
    }).returning();
    res.status(201).json(formatVoucher(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/vouchers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { type, name, reason, amount, amountInWords, date, approvedBy, receivedBy, remarks } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (type !== undefined) updates.type = type;
    if (name !== undefined) updates.name = name;
    if (reason !== undefined) updates.reason = reason;
    if (amount !== undefined) updates.amount = String(amount);
    if (amountInWords !== undefined) updates.amountInWords = amountInWords;
    if (date !== undefined) updates.date = date;
    if (approvedBy !== undefined) updates.approvedBy = approvedBy;
    if (receivedBy !== undefined) updates.receivedBy = receivedBy;
    if (remarks !== undefined) updates.remarks = remarks;

    const rows = await db.update(vouchersTable).set(updates).where(eq(vouchersTable.id, id)).returning();
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatVoucher(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/vouchers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.delete(vouchersTable).where(eq(vouchersTable.id, id)).returning();
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
