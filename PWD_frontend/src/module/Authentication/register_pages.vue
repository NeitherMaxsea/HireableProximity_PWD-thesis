<template>
  <Navbar />

  <div class="container">
    <!-- LEFT IMAGE -->
    <div class="left">
      <img src="@/assets/PWD_worker.png" alt="Worker" class="worker" />
    </div>

    <!-- RIGHT FORM -->
    <div class="right" :class="{ 'fade-in': isVisible }">

      <button class="back-btn-outline" @click="$router.push('/role')">
        ← Back to Choose Role
      </button>

      <div class="logo-container">
        <img src="@/assets/titlelogo.png" class="logo-img" />
      </div>

      <h2>Sign Up</h2>

      <p class="form-p">
        Create your account and start your journey to meaningful and inclusive employment.
      </p>

      <p class="form-p">
        Registering as:
        <span class="role-label" :class="selectedRole">
          {{ roleLabel }}
        </span>
      </p>

      <!-- USERNAME -->
      <div class="form-group">
        <label>Username</label>
        <input type="text" v-model="username" placeholder="Enter username" />
      </div>

      <!-- EMAIL -->
      <div class="form-group">
        <label>Email</label>
        <input type="email" v-model="email" placeholder="Enter email" />
      </div>

      <template v-if="isEmployerRegistration">
        <div class="form-group">
          <label>Company Name</label>
          <input type="text" v-model="companyName" placeholder="Enter company name" />
        </div>

        <div class="form-group">
          <label>Company Address</label>
          <input type="text" v-model="companyAddress" placeholder="Enter company address" />
        </div>

        <div class="form-group">
          <label>Industry</label>
          <input type="text" v-model="companyIndustry" placeholder="Enter company industry" />
        </div>
      </template>

      <!-- PASSWORD -->
      <div class="form-group password-group">
        <label>Password</label>

        <div class="password-wrapper">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="password"
            placeholder="Enter password"
          />

          <!-- SAME EYE AS LOGIN -->
          <span v-if="password" class="toggle-eye" @click="togglePassword">
            <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
          </span>
        </div>
      </div>

      <!-- CONFIRM PASSWORD -->
      <div class="form-group password-group">
        <label>Confirm Password</label>

        <div class="password-wrapper">
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="confirmPassword"
            placeholder="Confirm password"
          />

          <!-- SAME EYE AS LOGIN -->
          <span v-if="confirmPassword" class="toggle-eye" @click="toggleConfirmPassword">
            <i :class="showConfirmPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
          </span>
        </div>
      </div>

      <!-- PASSWORD RULES -->
      <div class="rules">
        <strong>Password Rules:</strong>
        <ul>
          <li :class="{ valid: rules.filled }">✔ All fields filled</li>
          <li :class="{ valid: rules.length }">✔ 8–16 characters</li>
          <li :class="{ valid: rules.upperLower }">✔ Upper & lowercase</li>
          <li :class="{ valid: rules.number }">✔ Number</li>
          <li :class="{ valid: rules.special }">✔ Special character</li>
          <li :class="{ valid: rules.match }">✔ Passwords match</li>
        </ul>
      </div>

      <!-- REGISTER BUTTON -->
      <button class="btn" @click="register" :disabled="loading">
        <span v-if="loading">Creating account...</span>
        <span v-else>Register</span>
      </button>

      <p class="auth-link">
        Already have an account?
        <router-link to="/login">Login here</router-link>
      </p>

    </div>
  </div>
</template>

<script>
import Toastify from "toastify-js"
import "toastify-js/src/toastify.css"

import { collection, doc, serverTimestamp, setDoc, getDoc, deleteDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth"
import { auth, db } from "@/firebase"
import { sendOtp } from "@/services/otp.services"

export default {
  name: "Register",

  data() {
    return {
      username: "",
      email: "",
      companyName: "",
      companyAddress: "",
      companyIndustry: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      loading: false,
      selectedRole: "",
      isVisible: false
    }
  },

  mounted() {
    const role = localStorage.getItem("selectedRole")

    if (!role) {
      this.$router.replace("/role")
      return
    }

    this.selectedRole = role

    requestAnimationFrame(() => {
      this.isVisible = true
    })
  },

  computed: {
    isEmployerRegistration() {
      return String(this.selectedRole || "").toLowerCase() === "employer"
    },

    roleLabel() {
      return this.isEmployerRegistration ? "company admin" : this.selectedRole
    },

    rules() {
      const companyOk = this.isEmployerRegistration
        ? this.companyName && this.companyAddress && this.companyIndustry
        : true

      return {
        filled:
          this.username &&
          this.email &&
          companyOk &&
          this.password &&
          this.confirmPassword,
        length: this.password.length >= 8 && this.password.length <= 16,
        upperLower: /(?=.*[a-z])(?=.*[A-Z])/.test(this.password),
        number: /(?=.*\d)/.test(this.password),
        special: /(?=.*[@$!%*?&;])/.test(this.password),
        match:
          this.password === this.confirmPassword &&
          this.password.length > 0
      }
    },

    allValid() {
      return Object.values(this.rules).every(Boolean)
    }
  },

  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword
    },

    toggleConfirmPassword() {
      this.showConfirmPassword = !this.showConfirmPassword
    },

   async register() {
  if (!this.allValid) {
    Toastify({
      text: "Please meet all password requirements",
      backgroundColor: "#e74c3c"
    }).showToast()
    return
  }

  this.loading = true

  try {
    const normalizedUsername = this.username.trim()
    const lowerUsername = normalizedUsername.toLowerCase()
    const normalizedRole = this.isEmployerRegistration ? "company_admin" : this.selectedRole

    if (lowerUsername.includes("maganda")) {
      Toastify({
        text: "Invalid username",
        backgroundColor: "#e74c3c"
      }).showToast()
      return
    }

    const cred = await createUserWithEmailAndPassword(
      auth,
      this.email,
      this.password
    )

    const usernameDocRef = doc(db, "usernames", lowerUsername)
    const existingUsername = await getDoc(usernameDocRef)
    if (existingUsername.exists()) {
      await deleteUser(cred.user)
      Toastify({
        text: "Username already used",
        backgroundColor: "#e74c3c"
      }).showToast()
      return
    }

    await setDoc(usernameDocRef, {
      uid: cred.user.uid,
      username: normalizedUsername
    })

    const companyId = this.isEmployerRegistration
      ? `company_${cred.user.uid}`
      : ""

    try {
      const profilePayload = {
        uid: cred.user.uid,
        username: normalizedUsername,
        usernameLower: lowerUsername,
        email: this.email,
        emailLower: this.email.toLowerCase(),
        role: normalizedRole,
        companyId: companyId || null,
        companyName: this.isEmployerRegistration ? this.companyName.trim() : null,
        authProvider: "password",
        authLinked: true,
        emailVerified: false,
        isActive: true,
        status: "active",
        lastLoginAt: null,
        lastSeenAt: null,
        source: "firebase-auth",
        syncedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }

      await setDoc(doc(db, "users", cred.user.uid), profilePayload)
      try {
        // Mirror for projects still reading legacy "Users" collection.
        await setDoc(doc(db, "Users", cred.user.uid), profilePayload)
      } catch {
        // non-blocking
      }
    } catch (profileErr) {
      try {
        await deleteDoc(doc(db, "usernames", lowerUsername))
      } catch {
        // ignore rollback failure
      }
      try {
        await deleteUser(cred.user)
      } catch {
        // ignore rollback failure
      }
      throw profileErr
    }

    if (this.isEmployerRegistration) {
      try {
        await setDoc(doc(db, "companies", companyId), {
          id: companyId,
          companyName: this.companyName.trim(),
          companyEmail: this.email.toLowerCase(),
          companyAddress: this.companyAddress.trim(),
          companyIndustry: this.companyIndustry.trim(),
          createdByUid: cred.user.uid,
          createdByEmail: this.email.toLowerCase(),
          createdAt: serverTimestamp(),
          status: "active"
        })
      } catch (companyErr) {
        // Keep registration successful even if company collection rules are stricter.
        console.warn("Company profile write skipped:", companyErr)
      }
    }

    localStorage.removeItem("selectedRole")
    localStorage.setItem("pendingOtpEmail", this.email)
    localStorage.setItem("pendingOtpRole", normalizedRole)

    let otpSendFailed = false
    try {
      await sendOtp(this.email)
      Toastify({
        text: "OTP sent to your email. Please verify.",
        backgroundColor: "#2563eb"
      }).showToast()
    } catch (otpErr) {
      otpSendFailed = true
      console.error("Initial OTP send failed:", otpErr)
      Toastify({
        text: "Account created. OTP send failed, retry on OTP page.",
        backgroundColor: "#f59e0b"
      }).showToast()
    }

    this.$router.push({
      path: "/auth/otp",
      query: {
        email: this.email,
        role: normalizedRole,
        otpSendFailed: otpSendFailed ? "1" : "0"
      }
    })

  } catch (error) {
    let message = "Registration failed"
    if (String(error?.code || "").includes("permission-denied")) {
      message = "Firestore permission denied. Update rules for users/usernames."
    } else if (error?.code === "auth/email-already-in-use") {
      message = "Email already registered"
    } else if (error?.code === "auth/invalid-email") {
      message = "Invalid email"
    } else if (error?.code === "auth/weak-password") {
      message = "Password too weak"
    } else if (error?.message) {
      message = error.message
    }

    Toastify({
      text: message,
      backgroundColor: "#e74c3c"
    }).showToast()
  } finally {
    this.loading = false
  }
}

  }
}
</script>

<style scoped>
/* FADE IN */
.right {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-in {
  opacity: 1;
  transform: translateY(0);
}

/* BACK BUTTON */
.back-btn-outline {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 8px 16px;
  font-size: 14px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.back-btn-outline:hover {
  background: #f0f2f5;
}

/* ROLE LABEL */
.role-label {
  font-weight: 600;
  text-transform: capitalize;
}

.role-label.applicant {
  color: #22c55e;
}

.role-label.employer {
  color: #3b82f6;
}

/* PASSWORD FIELD */
.password-wrapper {
  position: relative;
}

.password-wrapper input {
  width: 100%;
  padding-right: 42px;
}

/* ✅ SAME AS LOGIN */
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

/* REMOVE BROWSER EYE */
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear {
  display: none;
}
</style>
