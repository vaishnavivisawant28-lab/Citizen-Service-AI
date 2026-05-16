import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import requestsRouter from "./requests";
import otpRouter from "./otp";
import adminRouter from "./admin";
import chatbotRouter from "./chatbot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(requestsRouter);
router.use(otpRouter);
router.use(adminRouter);
router.use(chatbotRouter);

export default router;
