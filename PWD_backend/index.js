import "dotenv/config"
import express from "express"
import cors from "cors"
import path from "path"
import fs from "fs"
import multer from "multer"
import otpRoutes from "./Authentication/otp_routess.js"


const app = express()

app.use(cors())
app.use(express.json())

const uploadsDir = path.resolve("uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

app.use("/uploads", express.static(uploadsDir))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = (file.originalname || "image").replace(/\s+/g, "_")
    const ext = path.extname(safeName)
    const base = path.basename(safeName, ext)
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    cb(null, `${base}_${unique}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      cb(new Error("Only image files are allowed"))
      return
    }
    cb(null, true)
  }
})

app.get("/", (req, res) => {
  res.json({ status: "PWD backend running" })
})

app.post("/api/uploads", upload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "No file uploaded" })
    return
  }
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
  res.json({ url })
})

app.use("/api/otp", otpRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
