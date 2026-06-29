import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt?.toISOString(),
  };
}

router.get("/users", async (req, res) => {
  try {
    const rows = await db.select().from(usersTable).orderBy(usersTable.id);
    res.json(rows.map(formatUser));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name || !role) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const rows = await db.insert(usersTable).values({ username, password, name, role }).returning();
    res.status(201).json(formatUser(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { username, password, name, role } = req.body;
    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username;
    if (password !== undefined) updateData.password = password;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    const rows = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatUser(rows[0]));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
