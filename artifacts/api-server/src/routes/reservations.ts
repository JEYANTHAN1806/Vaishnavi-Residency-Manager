import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reservationsTable, roomsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function formatReservation(r: typeof reservationsTable.$inferSelect, roomNumber?: string | null) {
  return {
    id: r.id,
    reservationNumber: r.reservationNumber,
    guestName: r.guestName,
    mobile: r.mobile,
    roomId: r.roomId,
    roomNumber: roomNumber ?? null,
    checkInDate: r.checkInDate,
    checkOutDate: r.checkOutDate,
    advance: parseFloat(r.advance as string),
    status: r.status,
    remarks: r.remarks ?? null,
    createdAt: r.createdAt?.toISOString(),
  };
}

async function getNextReservationNumber(): Promise<string> {
  const result = await db.select({ n: reservationsTable.reservationNumber })
    .from(reservationsTable)
    .orderBy(sql`${reservationsTable.reservationNumber} DESC`)
    .limit(1);
  if (!result[0]) return "RSV-000001";
  const last = result[0].n;
  const match = last.match(/RSV-(\d+)/);
  if (!match) return "RSV-000001";
  const next = parseInt(match[1]) + 1;
  return `RSV-${String(next).padStart(6, "0")}`;
}

router.get("/reservations", async (req, res) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const rows = await db
      .select({ reservation: reservationsTable, room: roomsTable })
      .from(reservationsTable)
      .leftJoin(roomsTable, eq(reservationsTable.roomId, roomsTable.id))
      .orderBy(sql`${reservationsTable.createdAt} DESC`);

    const result = rows
      .filter((r) => !statusFilter || r.reservation.status === statusFilter)
      .map((r) => formatReservation(r.reservation, r.room?.roomNumber));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reservations", async (req, res) => {
  try {
    const { guestName, mobile, roomId, checkInDate, checkOutDate, advance, remarks } = req.body;
    if (!guestName || !mobile || !roomId || !checkInDate || !checkOutDate) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const reservationNumber = await getNextReservationNumber();
    const rows = await db.insert(reservationsTable).values({
      reservationNumber,
      guestName,
      mobile,
      roomId,
      checkInDate,
      checkOutDate,
      advance: String(advance || 0),
      remarks: remarks || null,
      status: "reserved",
    }).returning();
    // Mark room as reserved
    await db.update(roomsTable).set({ status: "reserved" }).where(eq(roomsTable.id, roomId));
    const roomRows = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId));
    res.status(201).json(formatReservation(rows[0], roomRows[0]?.roomNumber));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reservations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db
      .select({ reservation: reservationsTable, room: roomsTable })
      .from(reservationsTable)
      .leftJoin(roomsTable, eq(reservationsTable.roomId, roomsTable.id))
      .where(eq(reservationsTable.id, id));
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatReservation(rows[0].reservation, rows[0].room?.roomNumber));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/reservations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { guestName, mobile, roomId, checkInDate, checkOutDate, advance, status, remarks } = req.body;
    const updateData: Record<string, unknown> = {};
    if (guestName !== undefined) updateData.guestName = guestName;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (roomId !== undefined) updateData.roomId = roomId;
    if (checkInDate !== undefined) updateData.checkInDate = checkInDate;
    if (checkOutDate !== undefined) updateData.checkOutDate = checkOutDate;
    if (advance !== undefined) updateData.advance = String(advance);
    if (status !== undefined) {
      updateData.status = status;
      // If cancelled, free the room
      if (status === "cancelled") {
        const existing = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
        if (existing[0]) {
          await db.update(roomsTable).set({ status: "available" }).where(eq(roomsTable.id, existing[0].roomId));
        }
      }
    }
    if (remarks !== undefined) updateData.remarks = remarks;
    const rows = await db.update(reservationsTable).set(updateData).where(eq(reservationsTable.id, id)).returning();
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    const roomRows = await db.select().from(roomsTable).where(eq(roomsTable.id, rows[0].roomId));
    res.json(formatReservation(rows[0], roomRows[0]?.roomNumber));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
