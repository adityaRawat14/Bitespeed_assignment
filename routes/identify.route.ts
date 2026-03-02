import { Router } from "express";
import { identifyContact } from "../services/identify.service";

const router = Router();

router.post("/identify", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    const result = await identifyContact(email, phoneNumber);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;