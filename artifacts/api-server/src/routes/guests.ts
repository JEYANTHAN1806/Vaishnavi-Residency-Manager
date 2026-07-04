import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { guestsTable, roomsTable } from "@workspace/db";
import { eq, or, ilike, sql } from "drizzle-orm";

const router: IRouter = Router();

function formatGuest(g: typeof guestsTable.$inferSelect, roomNumber?: string | null) {
  return {
    id: g.id,
    billNumber: g.billNumber,
    date: g.date,
    time: g.time,
    guestName: g.guestName,
    gender: g.gender ?? null,
    age: g.age ?? null,
    mobile: g.mobile,
    alternativeMobile: g.alternativeMobile ?? null,
    address: g.address ?? null,
    aadhaarNumber: g.aadhaarNumber ?? null,
    idProofType: g.idProofType ?? null,
    pax: g.pax,
    roomId: g.roomId,
    roomNumber: roomNumber ?? null,
    checkInDate: g.checkInDate,
    checkInTime: g.checkInTime ?? null,
    expectedCheckOutDate: g.expectedCheckOutDate ?? null,
    expectedCheckOutTime: g.expectedCheckOutTime ?? null,
    actualCheckOutDate: g.actualCheckOutDate ?? null,
    actualCheckOutTime: g.actualCheckOutTime ?? null,
    numberOfDays: g.numberOfDays ?? null,
    rentPerDay: parseFloat(g.rentPerDay as string),
    extraCharges: parseFloat(g.extraCharges as string),
    discount: parseFloat(g.discount as string),
    gst: parseFloat(g.gst as string),
    totalAmount: parseFloat(g.totalAmount as string),
    advancePaid: parseFloat(g.advancePaid as string),
    balanceAmount: parseFloat(g.balanceAmount as string),
    paymentMode: g.paymentMode ?? null,
    remarks: g.remarks ?? null,
    receptionistName: g.receptionistName ?? null,
    status: g.status,
    createdAt: g.createdAt?.toISOString(),
  };
}

async function getNextBillNumberStr(): Promise<string> {
  const result = await db.select({ billNumber: guestsTable.billNumber })
    .from(guestsTable)
    .orderBy(sql`${guestsTable.billNumber} DESC`)
    .limit(1);
  if (!result[0]) return "VR-000001";
  const last = result[0].billNumber;
  const match = last.match(/VR-(\d+)/);
  if (!match) return "VR-000001";
  const next = parseInt(match[1]) + 1;
  return `VR-${String(next).padStart(6, "0")}`;
}

router.get("/guests/next-bill-number", async (req, res) => {
  try {
    const billNumber = await getNextBillNumberStr();
    res.json({ billNumber });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/guests", async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    let rows = await db
      .select({ guest: guestsTable, room: roomsTable })
      .from(guestsTable)
      .leftJoin(roomsTable, eq(guestsTable.roomId, roomsTable.id))
      .orderBy(sql`${guestsTable.createdAt} DESC`);

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.guest.guestName.toLowerCase().includes(s) ||
          r.guest.mobile.includes(s) ||
          r.guest.billNumber.toLowerCase().includes(s) ||
          (r.room?.roomNumber ?? "").toLowerCase().includes(s) ||
          (r.guest.aadhaarNumber ?? "").includes(s)
      );
    }
    if (status) {
      rows = rows.filter((r) => r.guest.status === status);
    }

    res.json(rows.map((r) => formatGuest(r.guest, r.room?.roomNumber)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/guests", async (req, res) => {
  try {
    const body = req.body;

    // Auto-generate bill number if not provided
    let billNumber = body.billNumber;
    if (!billNumber) {
      billNumber = await getNextBillNumberStr();
    }

    // Check if bill number already exists
    const existing = await db.select().from(guestsTable).where(eq(guestsTable.billNumber, billNumber));
    if (existing.length > 0) {
      billNumber = await getNextBillNumberStr();
    }

    // Check room availability
    const activeGuests = await db.select().from(guestsTable).where(
      eq(guestsTable.roomId, body.roomId)
    );
    const occupied = activeGuests.find(g => g.status === "checked-in" || g.status === "booked");
    if (occupied) {
      res.status(400).json({ error: "Room is already occupied or booked" });
      return;
    }

    const rows = await db.insert(guestsTable).values({
      billNumber,
      date: body.date || new Date().toLocaleDateString("en-IN"),
      time: body.time || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      guestName: body.guestName,
      gender: body.gender || null,
      age: body.age ?? null,
      mobile: body.mobile,
      alternativeMobile: body.alternativeMobile || null,
      address: body.address || null,
      aadhaarNumber: body.aadhaarNumber || null,
      idProofType: body.idProofType || null,
      pax: body.pax || 1,
      roomId: body.roomId,
      checkInDate: body.checkInDate,
      checkInTime: body.checkInTime || null,
      expectedCheckOutDate: body.expectedCheckOutDate || null,
      expectedCheckOutTime: body.expectedCheckOutTime || null,
      numberOfDays: body.numberOfDays ?? null,
      rentPerDay: String(body.rentPerDay || 0),
      extraCharges: String(body.extraCharges || 0),
      discount: String(body.discount || 0),
      gst: String(body.gst || 0),
      totalAmount: String(body.totalAmount || 0),
      advancePaid: String(body.advancePaid || 0),
      balanceAmount: String(body.balanceAmount || 0),
      paymentMode: body.paymentMode || null,
      remarks: body.remarks || null,
      receptionistName: body.receptionistName || null,
      status: "booked",
    }).returning();

    // Mark room as reserved/occupied
    await db.update(roomsTable).set({ status: "reserved" }).where(eq(roomsTable.id, body.roomId));

    const roomRows = await db.select().from(roomsTable).where(eq(roomsTable.id, body.roomId));
    res.status(201).json(formatGuest(rows[0], roomRows[0]?.roomNumber));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/guests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db
      .select({ guest: guestsTable, room: roomsTable })
      .from(guestsTable)
      .leftJoin(roomsTable, eq(guestsTable.roomId, roomsTable.id))
      .where(eq(guestsTable.id, id));
    if (!rows[0]) { res.status(404).json({ error: "Guest not found" }); return; }
    res.json(formatGuest(rows[0].guest, rows[0].room?.roomNumber));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/guests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const updateData: Record<string, unknown> = {};
    const fields = [
      "guestName", "gender", "age", "mobile", "alternativeMobile", "address",
      "aadhaarNumber", "idProofType", "pax", "roomId", "checkInDate", "checkInTime",
      "expectedCheckOutDate", "expectedCheckOutTime", "numberOfDays", "paymentMode",
      "remarks", "receptionistName", "status", "actualCheckOutDate", "actualCheckOutTime"
    ];
    for (const f of fields) {
      if (body[f] !== undefined) updateData[f === "guestName" ? "guestName" : f] = body[f];
    }
    const numericFields = ["rentPerDay", "extraCharges", "discount", "gst", "totalAmount", "advancePaid", "balanceAmount"];
    for (const f of numericFields) {
      if (body[f] !== undefined) updateData[f] = String(body[f]);
    }

    const rows = await db.update(guestsTable).set(updateData).where(eq(guestsTable.id, id)).returning();
    if (!rows[0]) { res.status(404).json({ error: "Guest not found" }); return; }
    const roomRows = await db.select().from(roomsTable).where(eq(roomsTable.id, rows[0].roomId));
    res.json(formatGuest(rows[0], roomRows[0]?.roomNumber));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/guests/:id/checkin", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const now = new Date();
    const rows = await db.update(guestsTable).set({
      status: "checked-in",
      checkInTime: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    }).where(eq(guestsTable.id, id)).returning();
    if (!rows[0]) { res.status(404).json({ error: "Guest not found" }); return; }
    // Mark room as occupied
    await db.update(roomsTable).set({ status: "occupied" }).where(eq(roomsTable.id, rows[0].roomId));
    const roomRows = await db.select().from(roomsTable).where(eq(roomsTable.id, rows[0].roomId));
    res.json(formatGuest(rows[0], roomRows[0]?.roomNumber));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/guests/:id/checkout", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { actualCheckOutDate, actualCheckOutTime, finalAmount, balanceAmount, paymentMode } = req.body;
    const now = new Date();
    const updateData: Record<string, unknown> = {
      status: "checked-out",
      actualCheckOutDate: actualCheckOutDate || now.toISOString().split("T")[0],
      actualCheckOutTime: actualCheckOutTime || now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    if (balanceAmount !== undefined) updateData.balanceAmount = String(balanceAmount);
    if (finalAmount !== undefined) updateData.totalAmount = String(finalAmount);
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
    const rows = await db.update(guestsTable).set(updateData).where(eq(guestsTable.id, id)).returning();
    if (!rows[0]) { res.status(404).json({ error: "Guest not found" }); return; }
    // Mark room as available
    await db.update(roomsTable).set({ status: "available" }).where(eq(roomsTable.id, rows[0].roomId));
    const roomRows = await db.select().from(roomsTable).where(eq(roomsTable.id, rows[0].roomId));
    res.json(formatGuest(rows[0], roomRows[0]?.roomNumber));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
