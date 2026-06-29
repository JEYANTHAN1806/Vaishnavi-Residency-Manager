import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Simple token: base64(username:timestamp)
function makeToken(userId: number, username: string): string {
  return Buffer.from(`${userId}:${username}:${Date.now()}`).toString("base64");
}

// Token store (in-memory for simplicity — survives server restarts poorly but works for single-server)
const tokenStore = new Map<string, number>(); // token -> userId

export function getUserIdFromToken(token: string): number | null {
  return tokenStore.get(token) ?? null;
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt?.toISOString(),
  };
}

router.post("/auth/login", async (req, res) => {
  try {
    const body = LoginBody.parse(req.body);
    const users = await db.select().from(usersTable).where(eq(usersTable.username, body.username));
    const user = users[0];
    if (!user || user.password !== body.password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = makeToken(user.id, user.username);
    tokenStore.set(token, user.id);
    res.json({ user: formatUser(user), token });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.post("/auth/logout", (req, res) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    tokenStore.delete(auth.slice(7));
  }
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  const userId = getUserIdFromToken(auth.slice(7));
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const user = users[0];
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json(formatUser(user));
});

export default router;
