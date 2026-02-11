<template>
  <div class="company-layout">
    <aside class="sidebar">
      <div class="brand">
        <h3>Company Admin</h3>
        <p>{{ companyName }}</p>
      </div>

      <nav class="menu">
        <router-link to="/company-admin/dashboard" class="menu-item">Dashboard</router-link>
        <router-link to="/company-admin/add-employee" class="menu-item">Add Employee</router-link>
      </nav>

      <button class="logout-btn" @click="logout">Logout</button>
    </aside>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { signOut } from "firebase/auth"
import { doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { auth, db } from "@/firebase"

const router = useRouter()
const companyName = ref(localStorage.getItem("companyName") || "My Company")

async function logout() {
  const uid = auth.currentUser?.uid
  if (uid) {
    const payload = {
      status: "inactive",
      isActive: false,
      lastLogoutAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    try {
      await updateDoc(doc(db, "users", uid), payload)
    } catch {
      try {
        await updateDoc(doc(db, "Users", uid), payload)
      } catch {
        // continue
      }
    }
  }

  await signOut(auth)
  localStorage.clear()
  router.push("/login")
}
</script>

<style scoped>
.company-layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.sidebar {
  width: 250px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.brand h3 {
  margin: 0;
}

.brand p {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 13px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  text-decoration: none;
  color: #e2e8f0;
  padding: 10px 12px;
  border-radius: 8px;
}

.menu-item.router-link-active,
.menu-item:hover {
  background: #1e293b;
}

.logout-btn {
  margin-top: auto;
  border: none;
  background: #991b1b;
  color: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
}

.content {
  flex: 1;
  padding: 20px;
}
</style>
