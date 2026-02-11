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
          Email Verification
          <p class="form-p">
            We’ll send a one-time password (OTP) to your email.
          </p>
        </h2>

        <!-- EMAIL -->
        <div class="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            v-model="email"
            :disabled="otpSent"
          />
        </div>

        <!-- OTP -->
        <div v-if="otpSent" class="form-group">
          <label>OTP Code</label>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            v-model="otp"
            maxlength="6"
          />
        </div>

        <!-- BUTTON -->
        <button class="btn" @click="otpSent ? verifyOtp() : sendOtp()" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>
            {{ otpSent ? "Verify OTP" : "Send OTP" }}
          </span>
        </button>

        <!-- RESEND -->
        <p v-if="otpSent" class="auth-link">
          Didn’t receive the code?
          <a href="#" @click.prevent="sendOtp">Resend OTP</a>
        </p>

      </div>
    </div>
  </div>
</template>
