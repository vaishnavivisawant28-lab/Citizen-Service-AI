import { Router } from "express";

const router = Router();

router.get("/profile/me", async (req: any, res: any) => {
  res.json({
    message: "Profile route working",
  });
});

router.post("/profile/me/sync", async (req: any, res: any) => {
  res.json({
    message: "Profile sync working",
  });
});

router.get("/dashboard/stats", async (req: any, res: any) => {
  res.json({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  });
});

export default router;
