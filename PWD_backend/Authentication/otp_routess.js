import express from "express"
import { sendOtp, verifyOtp } from "./otp_services.js"

const router = express.Router()

router.post("/send", async (req, res) => {
  await sendOtp(req.body.email)
  res.json({ success: true })
})

router.post("/verify", (req, res) => {
  const valid = verifyOtp(req.body.email, req.body.otp)
  res.json({ valid })
})

export default router
