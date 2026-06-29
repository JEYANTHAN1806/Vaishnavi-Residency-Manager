import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { guestsTable, roomsTable, reservationsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

const router: IRouter = Router();

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

router.get("/reports/dashboard", async (req, res) => {
  try {
    const today = todayStr();
    const todayFormatted = new Date().toLocaleDateString("en-IN");

    const allGuests = await db.select().from(guestsTable);
    const allRooms = await db.select().from(roomsTable);

    const todayCheckIns = allGuests.filter(
      (g) => (g.checkInDate === today || g.checkInDate === todayFormatted) &&
        (g.status === "checked-in" || g.status === "booked")
    ).length;

    const todayCheckOuts = allGuests.filter(
      (g) => (g.actualCheckOutDate === today || g.actualCheckOutDate === todayFormatted) &&
        g.status === "checked-out"
    ).length;

    const occupiedRooms = allRooms.filter((r) => r.status === "occupied").length;
    const availableRooms = allRooms.filter((r) => r.status === "available").length;
    const reservedRooms = allRooms.filter((r) => r.status === "reserved").length;
    const cleaningRooms = allRooms.filter((r) => r.status === "cleaning").length;
    const totalRooms = allRooms.length;

    const todayGuests = allGuests.filter(
      (g) => g.checkInDate === today || g.checkInDate === todayFormatted
    );
    const todayRevenue = todayGuests.reduce((sum, g) => sum + parseFloat(g.advancePaid as string || "0"), 0);

    const pendingBalance = allGuests
      .filter((g) => g.status !== "cancelled")
      .reduce((sum, g) => sum + parseFloat(g.balanceAmount as string || "0"), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyGuests = allGuests.filter((g) => {
      const d = new Date(g.createdAt);
      return d >= monthStart;
    });
    const monthlyRevenue = monthlyGuests.reduce(
      (sum, g) => sum + parseFloat(g.totalAmount as string || "0"), 0
    );

    res.json({
      todayCheckIns,
      todayCheckOuts,
      occupiedRooms,
      availableRooms,
      reservedRooms,
      cleaningRooms,
      totalRooms,
      todayRevenue,
      pendingBalance,
      monthlyRevenue,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/revenue", async (req, res) => {
  try {
    const period = (req.query.period as string) || "week";
    const allGuests = await db.select().from(guestsTable);
    const now = new Date();

    let data: { label: string; revenue: number; guests: number }[] = [];
    let totalRevenue = 0;
    let totalGuests = 0;

    if (period === "today") {
      const todayFormatted = now.toLocaleDateString("en-IN");
      const today = now.toISOString().split("T")[0];
      const todayGuests = allGuests.filter(
        (g) => g.checkInDate === today || g.checkInDate === todayFormatted
      );
      totalRevenue = todayGuests.reduce((s, g) => s + parseFloat(g.totalAmount as string || "0"), 0);
      totalGuests = todayGuests.length;
      data = [{ label: "Today", revenue: totalRevenue, guests: totalGuests }];
    } else if (period === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayStr = formatDate(d);
        const dayLocalStr = d.toLocaleDateString("en-IN");
        const dayGuests = allGuests.filter(
          (g) => g.checkInDate === dayStr || g.checkInDate === dayLocalStr
        );
        const rev = dayGuests.reduce((s, g) => s + parseFloat(g.totalAmount as string || "0"), 0);
        data.push({
          label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
          revenue: rev,
          guests: dayGuests.length,
        });
        totalRevenue += rev;
        totalGuests += dayGuests.length;
      }
    } else if (period === "month") {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dayStr = formatDate(d);
        const dayLocalStr = d.toLocaleDateString("en-IN");
        const dayGuests = allGuests.filter(
          (g) => g.checkInDate === dayStr || g.checkInDate === dayLocalStr
        );
        const rev = dayGuests.reduce((s, g) => s + parseFloat(g.totalAmount as string || "0"), 0);
        data.push({ label: String(day), revenue: rev, guests: dayGuests.length });
        totalRevenue += rev;
        totalGuests += dayGuests.length;
      }
    } else if (period === "year") {
      for (let m = 0; m < 12; m++) {
        const monthGuests = allGuests.filter((g) => {
          const d = new Date(g.createdAt);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === m;
        });
        const rev = monthGuests.reduce((s, g) => s + parseFloat(g.totalAmount as string || "0"), 0);
        data.push({
          label: new Date(now.getFullYear(), m, 1).toLocaleDateString("en-IN", { month: "short" }),
          revenue: rev,
          guests: monthGuests.length,
        });
        totalRevenue += rev;
        totalGuests += monthGuests.length;
      }
    }

    const pendingBalance = allGuests
      .filter((g) => g.status !== "cancelled")
      .reduce((s, g) => s + parseFloat(g.balanceAmount as string || "0"), 0);

    res.json({ period, totalRevenue, totalGuests, pendingBalance, data });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/occupancy", async (req, res) => {
  try {
    const period = (req.query.period as string) || "month";
    const allGuests = await db.select().from(guestsTable);
    const allRooms = await db.select().from(roomsTable);
    const totalRooms = allRooms.length || 1;

    const occupiedRooms = allRooms.filter((r) => r.status === "occupied").length;
    const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

    // Room booking counts
    const roomBookings: Record<string, number> = {};
    for (const room of allRooms) {
      const count = allGuests.filter((g) => g.roomId === room.id && g.status !== "cancelled").length;
      roomBookings[room.roomNumber] = count;
    }
    const topRooms = Object.entries(roomBookings)
      .map(([roomNumber, bookings]) => ({ roomNumber, bookings }))
      .sort((a, b) => b.bookings - a.bookings);

    // Data over time
    const now = new Date();
    const data: { label: string; occupancyRate: number }[] = [];
    if (period === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayStr = formatDate(d);
        const dayLocalStr = d.toLocaleDateString("en-IN");
        const activeCount = allGuests.filter(
          (g) => (g.checkInDate === dayStr || g.checkInDate === dayLocalStr) &&
            (g.status === "checked-in" || g.status === "checked-out")
        ).length;
        data.push({
          label: d.toLocaleDateString("en-IN", { weekday: "short" }),
          occupancyRate: Math.round(Math.min((activeCount / totalRooms) * 100, 100)),
        });
      }
    } else {
      for (let m = 0; m < 12; m++) {
        const monthGuests = allGuests.filter((g) => {
          const d = new Date(g.createdAt);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === m;
        });
        data.push({
          label: new Date(now.getFullYear(), m, 1).toLocaleDateString("en-IN", { month: "short" }),
          occupancyRate: Math.round(Math.min((monthGuests.length / totalRooms) * 100, 100)),
        });
      }
    }

    res.json({ period, occupancyRate, totalRooms, occupiedRooms, topRooms, data });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/recent-guests", async (req, res) => {
  try {
    const rows = await db
      .select({ guest: guestsTable, room: roomsTable })
      .from(guestsTable)
      .leftJoin(roomsTable, eq(guestsTable.roomId, roomsTable.id))
      .orderBy(sql`${guestsTable.createdAt} DESC`)
      .limit(10);
    res.json(rows.map((r) => ({
      id: r.guest.id,
      billNumber: r.guest.billNumber,
      date: r.guest.date,
      time: r.guest.time,
      guestName: r.guest.guestName,
      gender: r.guest.gender ?? null,
      age: r.guest.age ?? null,
      mobile: r.guest.mobile,
      alternativeMobile: r.guest.alternativeMobile ?? null,
      address: r.guest.address ?? null,
      aadhaarNumber: r.guest.aadhaarNumber ?? null,
      idProofType: r.guest.idProofType ?? null,
      pax: r.guest.pax,
      roomId: r.guest.roomId,
      roomNumber: r.room?.roomNumber ?? null,
      checkInDate: r.guest.checkInDate,
      checkInTime: r.guest.checkInTime ?? null,
      expectedCheckOutDate: r.guest.expectedCheckOutDate ?? null,
      expectedCheckOutTime: r.guest.expectedCheckOutTime ?? null,
      actualCheckOutDate: r.guest.actualCheckOutDate ?? null,
      actualCheckOutTime: r.guest.actualCheckOutTime ?? null,
      numberOfDays: r.guest.numberOfDays ?? null,
      rentPerDay: parseFloat(r.guest.rentPerDay as string),
      extraCharges: parseFloat(r.guest.extraCharges as string),
      discount: parseFloat(r.guest.discount as string),
      gst: parseFloat(r.guest.gst as string),
      totalAmount: parseFloat(r.guest.totalAmount as string),
      advancePaid: parseFloat(r.guest.advancePaid as string),
      balanceAmount: parseFloat(r.guest.balanceAmount as string),
      paymentMode: r.guest.paymentMode ?? null,
      remarks: r.guest.remarks ?? null,
      receptionistName: r.guest.receptionistName ?? null,
      status: r.guest.status,
      createdAt: r.guest.createdAt?.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/upcoming-reservations", async (req, res) => {
  try {
    const rows = await db
      .select({ reservation: reservationsTable, room: roomsTable })
      .from(reservationsTable)
      .leftJoin(roomsTable, eq(reservationsTable.roomId, roomsTable.id))
      .orderBy(sql`${reservationsTable.checkInDate} ASC`)
      .limit(10);
    res.json(rows
      .filter((r) => r.reservation.status !== "cancelled")
      .map((r) => ({
        id: r.reservation.id,
        reservationNumber: r.reservation.reservationNumber,
        guestName: r.reservation.guestName,
        mobile: r.reservation.mobile,
        roomId: r.reservation.roomId,
        roomNumber: r.room?.roomNumber ?? null,
        checkInDate: r.reservation.checkInDate,
        checkOutDate: r.reservation.checkOutDate,
        advance: parseFloat(r.reservation.advance as string),
        status: r.reservation.status,
        remarks: r.reservation.remarks ?? null,
        createdAt: r.reservation.createdAt?.toISOString(),
      })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
