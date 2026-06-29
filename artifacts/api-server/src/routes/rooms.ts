import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { roomsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function formatRoom(r: typeof roomsTable.$inferSelect) {
  return {
    id: r.id,
    roomNumber: r.roomNumber,
    type: r.type,
    rentPerDay: parseFloat(r.rentPerDay as string),
    status: r.status,
    floor: r.floor ?? null,
    description: r.description ?? null,
    createdAt: r.createdAt?.toISOString(),
  };
}

router.get("/rooms", async (req, res) => {
  try {
    const rooms = await db.select().from(roomsTable).orderBy(roomsTable.roomNumber);
    res.json(rooms.map(formatRoom));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/rooms", async (req, res) => {
  try {
    const { roomNumber, type, rentPerDay, floor, description } = req.body;
    if (!roomNumber || !type || rentPerDay === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const rows = await db.insert(roomsTable).values({
      roomNumber,
      type,
      rentPerDay: String(rentPerDay),
      floor: floor || null,
      description: description || null,
      status: "available",
    }).returning();
    res.status(201).json(formatRoom(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/rooms/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db.select().from(roomsTable).where(eq(roomsTable.id, id));
    if (!rows[0]) { res.status(404).json({ error: "Room not found" }); return; }
    res.json(formatRoom(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/rooms/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { roomNumber, type, rentPerDay, status, floor, description } = req.body;
    const updateData: Record<string, unknown> = {};
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber;
    if (type !== undefined) updateData.type = type;
    if (rentPerDay !== undefined) updateData.rentPerDay = String(rentPerDay);
    if (status !== undefined) updateData.status = status;
    if (floor !== undefined) updateData.floor = floor;
    if (description !== undefined) updateData.description = description;
    const rows = await db.update(roomsTable).set(updateData).where(eq(roomsTable.id, id)).returning();
    if (!rows[0]) { res.status(404).json({ error: "Room not found" }); return; }
    res.json(formatRoom(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/rooms/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(roomsTable).where(eq(roomsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/rooms/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) { res.status(400).json({ error: "Status required" }); return; }
    const rows = await db.update(roomsTable).set({ status }).where(eq(roomsTable.id, id)).returning();
    if (!rows[0]) { res.status(404).json({ error: "Room not found" }); return; }
    res.json(formatRoom(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
