import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import roomsRouter from "./rooms";
import guestsRouter from "./guests";
import reservationsRouter from "./reservations";
import paymentsRouter from "./payments";
import vouchersRouter from "./vouchers";
import reportsRouter from "./reports";
import settingsRouter from "./settings";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(roomsRouter);
router.use(guestsRouter);
router.use(reservationsRouter);
router.use(paymentsRouter);
router.use(vouchersRouter);
router.use(reportsRouter);
router.use(settingsRouter);
router.use(usersRouter);

export default router;
