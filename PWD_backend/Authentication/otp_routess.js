import express from "express"
import { sendOtp, verifyOtp } from "./otp_services.js"

const router = express.Router()

router.post("/send", async (req, res) => {
  try {
    await sendOtp(req.body.email)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to send OTP"
    })
  }
})

router.post("/verify", (req, res) => {
  try {
    const valid = verifyOtp(req.body.email, req.body.otp)
    res.json({ valid })
  } catch (error) {
    res.status(500).json({
      valid: false,
      message: error?.message || "OTP verification failed"
    })
  }
})

export default router
