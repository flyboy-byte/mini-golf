import { Router, type IRouter } from "express";
import { ChangePasswordBody } from "@workspace/api-zod";
import { setAppPassword } from "../lib/settings";

const router: IRouter = Router();

// Change the shared app password
router.post("/auth/change-password", async (req, res): Promise<void> => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await setAppPassword(parsed.data.newPassword);
  res.sendStatus(204);
});

export default router;
