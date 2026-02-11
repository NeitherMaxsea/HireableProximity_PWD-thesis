import sgMail from "@sendgrid/mail"

const apiKey = (process.env.SENDGRID_API_KEY || "").trim()
const fromEmail = (process.env.SENDGRID_FROM || "").trim()

if (!apiKey || /\s/.test(apiKey)) {
  throw new Error("SENDGRID_API_KEY is missing")
}
if (!fromEmail) {
  throw new Error("SENDGRID_FROM is missing")
}

sgMail.setApiKey(apiKey)

export const sendEmail = async ({ to, subject, html, text }) => {
  return sgMail.send({
    to,
    from: fromEmail,
    subject,
    html,
    text,
  })
}
