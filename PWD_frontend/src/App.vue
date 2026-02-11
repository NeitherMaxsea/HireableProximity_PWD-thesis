<template>
  <router-view />
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue"
import { useRouter } from "vue-router"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import Toastify from "toastify-js"
import "toastify-js/src/toastify.css"
import { auth, db } from "@/firebase"

const router = useRouter()

let stopAuthWatch = null
let stopProfileWatch = null

function clearSessionLocal() {
  localStorage.removeItem("activeSessionId")
  localStorage.removeItem("sessionUid")
  localStorage.removeItem("userCollection")
}

function closeProfileWatch() {
  if (typeof stopProfileWatch === "function") {
    stopProfileWatch()
    stopProfileWatch = null
  }
}

async function resolveProfileRef(uid) {
  const preferred = localStorage.getItem("userCollection")
  const candidates = preferred === "Users" ? ["Users", "users"] : ["users", "Users"]

  for (const collectionName of candidates) {
    const ref = doc(db, collectionName, uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      return { ref, collectionName }
    }
  }
  return null
}

onMounted(() => {
  stopAuthWatch = onAuthStateChanged(auth, async (user) => {
    closeProfileWatch()
    if (!user) return

    const profile = await resolveProfileRef(user.uid)
    if (!profile) return

    stopProfileWatch = onSnapshot(profile.ref, async (snap) => {
      if (!snap.exists()) return

      const data = snap.data() || {}
      const remoteSessionId = String(data.activeSessionId || "")
      const localSessionId = String(localStorage.getItem("activeSessionId") || "")
      const localSessionUid = String(localStorage.getItem("sessionUid") || "")

      if (localSessionUid && localSessionUid !== user.uid) return
      if (!localSessionId || !remoteSessionId) return

      if (remoteSessionId !== localSessionId) {
        clearSessionLocal()
        Toastify({
          text: "Your account was signed in on another device. You have been logged out.",
          backgroundColor: "#e74c3c"
        }).showToast()
        await signOut(auth)
        router.push("/login")
      }
    })
  })
})

onBeforeUnmount(() => {
  if (typeof stopAuthWatch === "function") {
    stopAuthWatch()
    stopAuthWatch = null
  }
  closeProfileWatch()
})
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;   /* 🔥 STOP BODY SCROLL */
}
</style>
