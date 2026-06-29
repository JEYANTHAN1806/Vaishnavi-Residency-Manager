import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { paymentsTable, guestsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function formatPayment(p: typeof paymentsTable.$inferSelect, guestName?: string | null, billNumber?: string | null) {
  return {
    id: p.id,
    voucherNumber: p.voucherNumber,
    type: p.type,
    guestId: p.guestId,
    guestName: guestName ?? null,
    billNumber: billNumber ?? null,
    amount: parseFloat(p.amount as string),
    paymentMode: p.paymentMode,
    remarks: p.remarks ?? null,
    date: p.date ?? null,
    createdAt: p.createdAt?.toISOString(),
  };
}

async function getNextVoucherNumber(type: string): Promise<string> {
  const prefix = type === "receipt" ? "RV" : "PV";
  const result = await db.select({ voucherNumber: paymentsTable.voucherNumber })
    .from(paymentsTable)
    .where(sql`${paymentsTable.type} = ${type}`)
    .orderBy(sql`${paymentsTable.voucherNumber} DESC`)
    .limit(1);
  if (!result[0]) return `${prefix}-000001`;
  const last = result[0].voucherNumber;
  const match = last.match(/-(\d+)/);
  if (!match) return `${prefix}-000001`;
  const next = parseInt(match[1]) + 1;
  return `${prefix}-${String(next).padStart(6, "0")}`;
}

router.get("/payments/next-voucher-number", async (req, res) => {
  try {
    const voucherNumber = await getNextVoucherNumber("receipt");
    res.json({ voucherNumber });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payments", async (req, res) => {
  try {
    const guestIdFilter = req.query.guestId ? parseInt(req.query.guestId as string) : undefined;
    const rows = await db
      .select({ payment: paymentsTable, guest: guestsTable })
      .from(paymentsTable)
      .leftJoin(guestsTable, eq(paymentsTable.guestId, guestsTable.id))
      .orderBy(sql`${paymentsTable.createdAt} DESC`);

    const result = rows
      .filter((r) => !guestIdFilter || r.payment.guestId === guestIdFilter)
      .map((r) => formatPayment(r.payment, r.guest?.guestName, r.guest?.billNumber));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/payments", async (req, res) => {
  try {
    const { type, guestId, amount, paymentMode, date, remarks } = req.body;
    if (!type || !guestId || amount === undefined || !paymentMode) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const voucherNumber = await getNextVoucherNumber(type);
    const today = new Date().toLocaleDateString("en-IN");
    const rows = await db.insert(paymentsTable).values({
      voucherNumber,
      type,
      guestId,
      amount: String(amount),
      paymentMode,
      date: date || today,
      remarks: remarks || null,
    }).returning();
    const guestRows = await db.select().from(guestsTable).where(eq(guestsTable.id, guestId));
    res.status(201).json(formatPayment(rows[0], guestRows[0]?.guestName, guestRows[0]?.billNumber));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db
      .select({ payment: paymentsTable, guest: guestsTable })
      .from(paymentsTable)
      .leftJoin(guestsTable, eq(paymentsTable.guestId, guestsTable.id))
      .where(eq(paymentsTable.id, id));
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatPayment(rows[0].payment, rows[0].guest?.guestName, rows[0].guest?.billNumber));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
