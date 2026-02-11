<template>
  <div class="auth-page">

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
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { signInWithEmailAndPassword } from "firebase/auth"

import { auth, db } from "@/firebase"

import Toastify from "toastify-js"
import "toastify-js/src/toastify.css"
import "@/assets/Styles/styles.css"

const router = useRouter()

/* FORM STATE */
const email = ref("")
const password = ref("")
const showPassword = ref(false)
const loading = ref(false)

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
        lastLoginAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      })
    } catch (syncErr) {
      console.warn("User sync update failed:", syncErr)
    }

    // ✅ STORE USER INFO FOR SIDEBAR DISPLAY
    localStorage.setItem("userName", data.username || data.name || "User")
    localStorage.setItem("userEmail", data.email || cred.user.email || normalizedEmail)
    localStorage.setItem("userRole", role || "")
    localStorage.setItem("companyId", data.companyId || "")
    localStorage.setItem("companyName", data.companyName || "")

    Toastify({
      text: "Login successful!",
      backgroundColor: "#2ecc71",
    }).showToast()

    // 🚦 REDIRECT
    if (normalizedRole === "applicant") {
      router.push("/applicant/job_list")
    } else if (normalizedRole === "employer" || normalizedRole === "hr") {
      router.push("/employer/HR/dashboard")
    } else if (normalizedRole === "finance") {
      router.push("/employer/finance/dashboard")
    } else if (normalizedRole === "company_admin") {
      router.push("/company-admin/dashboard")
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
</style>
