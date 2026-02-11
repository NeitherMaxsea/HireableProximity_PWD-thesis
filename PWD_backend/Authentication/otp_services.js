import { sendEmail } from "./mailer.js"

const otpStore = new Map() // email -> { otp, expires }

export const sendOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  otpStore.set(email, {
    otp,
    expires: Date.now() + 5 * 60 * 1000, // 5 mins
  })

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP Code is ${otp}. It expires in 5 minutes.`,
    html: `
      <h2>Your OTP Code</h2>
      <h1>${otp}</h1>
      <p>This code will expire in 5 minutes.</p>
    `,
  })
}

export const verifyOtp = (email, code) => {
  const record = otpStore.get(email)

  if (!record) return false
  if (record.expires < Date.now()) return false
  if (record.otp !== code) return false

  otpStore.delete(email)
  return true
}
