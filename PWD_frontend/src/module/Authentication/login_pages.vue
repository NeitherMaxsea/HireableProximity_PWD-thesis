<template>
  <div class="auth-page">
    <button class="back-btn" @click="goBack" aria-label="Back to landing">
      <i class="bi bi-arrow-left"></i>
    </button>

    <!-- CENTER LOADING -->
    <div v-if="pageLoading" class="page-loading">
      <div class="loader"></div>
    </div>

    <div class="container">

      <!-- LEFT IMAGE -->
      <div class="left">
        <img src="@/assets/PWD_login.png" alt="Worker" class="worker" />
      </div>

      <!-- RIGHT FORM -->
      <div class="right fade-wrapper" :class="{ show: isVisible }">

        <div class="logo-container">
          <img src="@/assets/titlelogo.png" class="logo-img" />
        </div>

        <h2 class="form-h2">
          Welcome!
          <p class="form-p">
            Your journey to meaningful and inclusive employment starts here.
          </p>
        </h2>

        <!-- EMAIL -->
        <div class="form-group icon-group">
          <i class="bi bi-envelope-fill input-icon"></i>
          <input
            type="email"
            placeholder="Enter email"
            v-model="email"
          />
        </div>

        <!-- PASSWORD -->
        <div class="form-group password-group">

          <div class="password-wrapper icon-group">
            <i class="bi bi-lock-fill input-icon"></i>

            <input
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter password"
              v-model="password"
            />

            <span
              v-if="password"
              class="toggle-eye"
              @click="togglePassword"
            >
              <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
            </span>
          </div>

          <div class="forgot-password">
            <router-link to="/auth/forget-password">
              Forgot password?
            </router-link>
          </div>

        </div>

        <!-- LOGIN BUTTON -->
        <button class="btn" @click="login" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Login</span>
        </button>

        <!-- REGISTER -->
        <p class="auth-link">
          Don’t have an account?
          <a href="#" @click.prevent="goRegister">Register here</a>
        </p>

        <div class="divider">
          <span>OR</span>
        </div>

        <button class="google-btn" disabled>
          Continue with Google (coming soon)
        </button>

      </div>

    </div>

    <div v-if="showCompanyNameModal" class="modal-backdrop">
      <div class="company-modal">
        <h3>Company Admin Email Verification</h3>

        <p v-if="!companyConfirmStep && !companyAdminChecking" class="modal-text">
          Enter your account email to continue.
        </p>

        <p v-if="companyConfirmStep && !companyAdminChecking" class="modal-text">
          Are you sure this is your email:
          <strong>"{{ verificationEmailInput.trim() }}"</strong>?
        </p>

        <div v-if="!companyConfirmStep && !companyAdminChecking" class="modal-input-wrap">
          <input
            v-model="verificationEmailInput"
            type="email"
            placeholder="Type your account email"
            class="modal-input"
            @keyup.enter="proceedCompanyConfirmation"
          />
        </div>

        <div v-if="companyAdminChecking" class="modal-waiting">
          <span class="spinner"></span>
          <span>Waiting... validating company admin access.</span>
        </div>

        <div class="modal-actions" v-if="!companyAdminChecking">
          <button class="modal-btn cancel" @click="cancelCompanyAdminLogin">Cancel</button>
          <button
            v-if="!companyConfirmStep"
            class="modal-btn primary"
            @click="proceedCompanyConfirmation"
          >
            Continue
          </button>
          <template v-else>
            <button class="modal-btn secondary" @click="companyConfirmStep = false">
              Back
            </button>
            <button class="modal-btn primary" @click="confirmCompanyAdminLogin">
              Confirm
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"

import { auth, db } from "@/firebase"

import Toastify from "toastify-js"
import "toastify-js/src/toastify.css"
import "@/assets/Styles/styles.css"

const router = useRouter()

function goBack() {
  router.push('/')
}

/* FORM STATE */
const email = ref("")
const password = ref("")
const showPassword = ref(false)
const loading = ref(false)
const showCompanyNameModal = ref(false)
const verificationEmailInput = ref("")
const companyConfirmStep = ref(false)
const companyAdminChecking = ref(false)
const expectedVerificationEmail = ref("")
const profileCompanyName = ref("")
const expectedCompanyId = ref("")
const sessionUserUid = ref("")
const sessionCollection = ref("users")

/* UI STATE */
const pageLoading = ref(true)
const isVisible = ref(false)

onMounted(() => {
  setTimeout(() => {
    pageLoading.value = false
    isVisible.value = true
  }, 500)
})





/* TOGGLE PASSWORD */
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

/* GO TO REGISTER */
const goRegister = () => {
  router.push("/role")
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase()
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function isCompanyScopedRole(role) {
  const normalized = String(role || "").toLowerCase()
  return ["hr", "finance", "operation", "operator"].includes(normalized)
}

async function validateCompanyScopeForEmployee(profileData, normalizedRole) {
  if (!isCompanyScopedRole(normalizedRole)) {
    return { allowed: true }
  }

  const employeeCompanyId = String(profileData.companyId || "").trim()
  const employeeCompanyName = String(profileData.companyName || "").trim()
  const creatorUid = String(profileData.createdByCompanyAdminUid || "").trim()
  const creatorCompanyName = String(profileData.createdByCompanyName || "").trim()

  if (!employeeCompanyId || !employeeCompanyName || !creatorUid) {
    return {
      allowed: false,
      reason: "Missing company assignment in your account profile."
    }
  }

  if (
    creatorCompanyName &&
    normalizeText(creatorCompanyName) !== normalizeText(employeeCompanyName)
  ) {
    return {
      allowed: false,
      reason: "Bawal: this account does not match the company that created it."
    }
  }

  return {
    allowed: true,
    companyId: employeeCompanyId,
    companyName: employeeCompanyName,
    creatorUid
  }
}

async function logBlockedCompanyScopeAttempt(userUid, userEmail, role, details) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      event: "Blocked Login - Company Mismatch",
      details: String(details || ""),
      actorUid: String(userUid || ""),
      actorEmail: String(userEmail || ""),
      targetUid: String(userUid || ""),
      targetEmail: String(userEmail || ""),
      targetRole: String(role || ""),
      companyId: "",
      companyName: "",
      createdAt: serverTimestamp()
    })
  } catch {
    // no-op
  }
}

function proceedCompanyConfirmation() {
  const typedEmail = verificationEmailInput.value.trim()
  if (!typedEmail) {
    Toastify({
      text: "Please enter your email first.",
      backgroundColor: "#e74c3c",
    }).showToast()
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typedEmail)) {
    Toastify({
      text: "Please enter a valid email format.",
      backgroundColor: "#e74c3c",
    }).showToast()
    return
  }
  companyConfirmStep.value = true
}

async function cancelCompanyAdminLogin() {
  showCompanyNameModal.value = false
  companyConfirmStep.value = false
  companyAdminChecking.value = false
  verificationEmailInput.value = ""
  expectedVerificationEmail.value = ""
  profileCompanyName.value = ""
  expectedCompanyId.value = ""

  try {
    await signOut(auth)
  } catch {
    // no-op
  }

  localStorage.removeItem("activeSessionId")
  localStorage.removeItem("sessionUid")
  localStorage.removeItem("userCollection")

  Toastify({
    text: "Company admin login cancelled.",
    backgroundColor: "#e74c3c",
  }).showToast()
}

async function confirmCompanyAdminLogin() {
  const typedEmail = verificationEmailInput.value.trim()
  if (!typedEmail) {
    Toastify({
      text: "Please enter your email first.",
      backgroundColor: "#e74c3c",
    }).showToast()
    companyConfirmStep.value = false
    return
  }

  companyAdminChecking.value = true

  try {
    const expected = expectedVerificationEmail.value.trim()
    if (!String(profileCompanyName.value || "").trim()) {
      await clearManagedEmployeeRolesIfCompanyNameDeleted()
    }

    if (expected && normalizeEmail(typedEmail) !== normalizeEmail(expected)) {
      Toastify({
        text: "Email does not match your registered account email.",
        backgroundColor: "#e74c3c",
      }).showToast()
      companyConfirmStep.value = false
      return
    }

    if (!expected && sessionUserUid.value) {
      try {
        await updateDoc(doc(db, sessionCollection.value, sessionUserUid.value), {
          email: typedEmail,
          emailLower: normalizeEmail(typedEmail),
          updatedAt: serverTimestamp(),
        })
      } catch {
        // no-op
      }
    }

    Toastify({
      text: "Email verified. Redirecting...",
      backgroundColor: "#2ecc71",
    }).showToast()

    showCompanyNameModal.value = false
    companyConfirmStep.value = false
    router.push("/company-admin/dashboard")
  } finally {
    companyAdminChecking.value = false
  }
}

async function clearManagedEmployeeRolesIfCompanyNameDeleted() {
  const adminUid = sessionUserUid.value
  const companyId = expectedCompanyId.value
  const usersCollection = sessionCollection.value || "users"

  if (!adminUid || !companyId) return

  const q = query(
    collection(db, usersCollection),
    where("createdByCompanyAdminUid", "==", adminUid),
    where("companyId", "==", companyId)
  )

  const snap = await getDocs(q)
  if (snap.empty) return

  const managedDocs = snap.docs.filter((docSnap) => {
    const role = String(docSnap.data()?.role || "").toLowerCase()
    return ["hr", "finance", "operation"].includes(role)
  })

  if (!managedDocs.length) return

  let batch = writeBatch(db)
  let ops = 0

  for (const docSnap of managedDocs) {
    batch.update(docSnap.ref, {
      role: deleteField(),
      companyName: "",
      status: "inactive",
      isActive: false,
      updatedAt: serverTimestamp(),
      syncedAt: serverTimestamp()
    })
    ops += 1

    if (ops === 450) {
      await batch.commit()
      batch = writeBatch(db)
      ops = 0
    }
  }

  if (ops > 0) {
    await batch.commit()
  }

  Toastify({
    text: `${managedDocs.length} employee role(s) removed because company name was deleted.`,
    backgroundColor: "#f59e0b",
  }).showToast()
}

function createSessionId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function getUserProfile(uid) {
  const lowerRef = doc(db, "users", uid)
  const lowerSnap = await getDoc(lowerRef)
  if (lowerSnap.exists()) {
    return { data: lowerSnap.data(), ref: lowerRef, collectionName: "users" }
  }

  const upperRef = doc(db, "Users", uid)
  const upperSnap = await getDoc(upperRef)
  if (upperSnap.exists()) {
    return { data: upperSnap.data(), ref: upperRef, collectionName: "Users" }
  }

  return null
}

/* LOGIN */
const login = async () => {
  const normalizedEmail = email.value.trim()

  if (!normalizedEmail || !password.value) {
    Toastify({
      text: "Please enter your email and password",
      backgroundColor: "#e74c3c",
    }).showToast()
    return
  }

  loading.value = true

  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password.value
    )

    const profile = await getUserProfile(cred.user.uid)
    if (!profile) {
      Toastify({
        text: "Profile not found. Please register again.",
        backgroundColor: "#e74c3c",
      }).showToast()
      return
    }

    const data = profile.data || {}
    let role = data.role
    const pendingOtpEmail = localStorage.getItem("pendingOtpEmail") || ""
    const pendingOtpRole = localStorage.getItem("pendingOtpRole") || ""
    if (!role && pendingOtpRole && pendingOtpEmail.toLowerCase() === normalizedEmail.toLowerCase()) {
      role = pendingOtpRole
      try {
        await updateDoc(profile.ref, {
          role: pendingOtpRole,
          updatedAt: serverTimestamp()
        })
      } catch {
        // no-op
      }
    }

    const normalizedRole = String(role || "").toLowerCase()
    if (!normalizedRole) {
      Toastify({
        text: "Role missing in Firestore profile. Please contact admin.",
        backgroundColor: "#e74c3c",
      }).showToast()
      return
    }

    const scopedValidation = await validateCompanyScopeForEmployee(data, normalizedRole)
    if (!scopedValidation.allowed) {
      await logBlockedCompanyScopeAttempt(
        cred.user.uid,
        data.email || cred.user.email || normalizedEmail,
        normalizedRole,
        scopedValidation.reason
      )
      Toastify({
        text: scopedValidation.reason,
        backgroundColor: "#e74c3c",
      }).showToast()
      await signOut(auth)
      return
    }

    const sessionId = createSessionId()
    try {
      await updateDoc(profile.ref, {
        email: data.email || cred.user.email || normalizedEmail,
        emailLower: (data.email || cred.user.email || normalizedEmail).toLowerCase(),
        role: normalizedRole,
        authProvider: cred.user.providerData?.[0]?.providerId || "password",
        authLinked: true,
        emailVerified: !!cred.user.emailVerified,
        isActive: true,
        status: "active",
        activeSessionId: sessionId,
        activeSessionUpdatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      })
    } catch (syncErr) {
      console.warn("User sync update failed:", syncErr)
      Toastify({
        text: "Unable to establish secure session. Please check Firestore Rules.",
        backgroundColor: "#e74c3c"
      }).showToast()
      await signOut(auth)
      return
    }

    // ✅ STORE USER INFO FOR SIDEBAR DISPLAY
    localStorage.setItem("userName", data.username || data.name || "User")
    localStorage.setItem("userEmail", data.email || cred.user.email || normalizedEmail)
    localStorage.setItem("userRole", role || "")
    localStorage.setItem("companyId", data.companyId || "")
    localStorage.setItem("companyName", data.companyName || "")
    localStorage.setItem("activeSessionId", sessionId)
    localStorage.setItem("sessionUid", cred.user.uid)
    localStorage.setItem("userCollection", profile.collectionName)

    if (normalizedRole !== "company_admin") {
      Toastify({
        text: "Login successful!",
        backgroundColor: "#2ecc71",
      }).showToast()
    }

    // 🚦 REDIRECT
    if (normalizedRole === "applicant") {
      router.push("/applicant/job_list")
    } else if (normalizedRole === "employer" || normalizedRole === "hr") {
      router.push("/employer/HR/dashboard")
    } else if (normalizedRole === "finance") {
      router.push("/employer/finance/dashboard")
    } else if (normalizedRole === "company_admin") {
      expectedVerificationEmail.value = String(data.email || cred.user.email || normalizedEmail).trim()
      profileCompanyName.value = String(data.companyName || "").trim()
      expectedCompanyId.value = String(data.companyId || "").trim()
      sessionUserUid.value = cred.user.uid
      sessionCollection.value = profile.collectionName
      verificationEmailInput.value = ""
      companyConfirmStep.value = false
      showCompanyNameModal.value = true
    } else if (
      normalizedRole.includes("operator") ||
      normalizedRole.includes("operation")
    ) {
      router.push("/employer/operation/dashboard")
    } else {
      Toastify({
        text: "Invalid user role",
        backgroundColor: "#e74c3c",
      }).showToast()
    }

  } catch (error) {
    let message = "Login failed"
    if (error?.code === "auth/invalid-credential") {
      message = "Incorrect email or password"
    } else if (error?.code === "auth/user-not-found") {
      message = "Account not found"
    } else if (error?.code === "auth/wrong-password") {
      message = "Incorrect email or password"
    } else if (error?.code === "auth/invalid-email") {
      message = "Invalid email"
    } else if (error?.code === "auth/user-disabled") {
      message = "Account disabled"
    } else if (error?.message) {
      message = error.message
    }
    Toastify({
      text: message,
      backgroundColor: "#e74c3c",
    }).showToast()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
html {
  font-family: "Poppins", sans-serif;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

/* PAGE WRAPPER */
.auth-page {
  position: relative;
  min-height: 100vh;
}

/* CENTER LOADING */
.page-loading {
  position: fixed;
  inset: 0;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

/* LOADER */
.loader {
  width: 46px;
  height: 46px;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* FADE IN FORM */
.fade-wrapper {
  opacity: 0;
  transform: translateY(16px);
  transition: all 0.6s ease;
}

.fade-wrapper.show {
  opacity: 1;
  transform: translateY(0);
}

/* ICON GROUP */
.icon-group {
  position: relative;
}

/* LEFT ICON */
.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #64748b;
  pointer-events: none;
}

/* PASSWORD WRAPPER */
.password-wrapper {
  position: relative;
}

/* INPUT SPACING */
.icon-group input {
  padding-left: 42px;
  padding-right: 42px;
}

/* EYE ICON */
.toggle-eye {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.toggle-eye i {
  font-size: 16px;
  color: #64748b;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.58);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 20px;
}

.company-modal {
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 14px 50px rgba(15, 23, 42, 0.2);
  padding: 22px 20px;
}

.company-modal h3 {
  margin: 0 0 10px;
  color: #0f172a;
}

.modal-text {
  margin: 0 0 12px;
  color: #334155;
  line-height: 1.45;
}

.modal-input-wrap {
  margin-bottom: 14px;
}

.modal-input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 11px 12px;
  font-size: 14px;
  outline: none;
}

.modal-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.modal-waiting {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0 14px;
  color: #1e293b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* BACK BUTTON */
.back-btn{
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 1300;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width:40px;
  height:40px;
  background: rgba(255,255,255,0.95);
  border: 1px solid #e5e7eb;
  border-radius:8px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(2,6,23,0.08);
}

.back-btn i{ font-size:18px; color:#0f172a }

.modal-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 600;
  cursor: pointer;
}

.modal-btn.cancel {
  background: #ef4444;
  color: #ffffff;
}

.modal-btn.secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.modal-btn.primary {
  background: #2563eb;
  color: #ffffff;
}

@media (max-width: 640px) {
  .company-modal {
    padding: 18px 16px;
  }

  .modal-actions {
    flex-wrap: wrap;
  }

  .modal-btn {
    flex: 1 1 120px;
  }
}
</style>
