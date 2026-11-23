import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import authRouter from "./auth";
import draftsRouter from "./drafts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(authRouter);
router.use(draftsRouter);

export default router;
