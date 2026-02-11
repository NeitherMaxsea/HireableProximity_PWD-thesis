<template>
  <section class="page">
    <h2>Add Employee Account</h2>
    <p>Create role accounts for HR, Finance, and Operation using temporary passwords.</p>

    <div v-if="loadError" class="error">{{ loadError }}</div>

    <div class="form-card">
      <div class="grid">
        <div>
          <label>Username</label>
          <input v-model="form.username" type="text" placeholder="Enter username" />
        </div>
        <div>
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="Enter work email" />
        </div>
        <div>
          <label>Role</label>
          <select v-model="form.role">
            <option value="hr">HR</option>
            <option value="finance">Finance</option>
            <option value="operation">Operation</option>
          </select>
        </div>
        <div>
          <label>Temporary Password</label>
          <input v-model="form.tempPassword" type="text" placeholder="At least 8 characters" />
        </div>
      </div>
      <button class="create-btn" :disabled="saving || !canCreate" @click="createEmployee">
        {{ saving ? "Creating..." : "Create Employee Account" }}
      </button>
    </div>

    <div class="table-card">
      <h3>Company Employees</h3>
      <table v-if="employees.length">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in employees" :key="employee.id">
            <td>{{ employee.username || "-" }}</td>
            <td>{{ employee.email || "-" }}</td>
            <td>{{ employee.role || "-" }}</td>
            <td>{{ employee.status || "-" }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">No employees found in this company.</div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import Toastify from "toastify-js"
import "toastify-js/src/toastify.css"
import { createUserWithEmailAndPassword, deleteUser, getAuth, signOut } from "firebase/auth"
import { deleteApp, initializeApp } from "firebase/app"
import app, { auth, db } from "@/firebase"
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore"

const companyId = ref("")
const companyName = ref("")
const usersCollectionName = ref("users")
const saving = ref(false)
const loadError = ref("")
const employees = ref([])
const stopSync = ref(null)

const form = ref({
  username: "",
  email: "",
  role: "hr",
  tempPassword: ""
})

const canCreate = computed(() => {
  return (
    form.value.username.trim() &&
    form.value.email.trim() &&
    form.value.role &&
    form.value.tempPassword.length >= 8
  )
})

onMounted(async () => {
  await bootstrapCompanyScope()
})

onBeforeUnmount(() => {
  if (typeof stopSync.value === "function") {
    stopSync.value()
  }
})

async function bootstrapCompanyScope() {
  const uid = auth.currentUser?.uid
  if (!uid) {
    loadError.value = "Session missing. Please login again."
    return
  }

  let profileSnap = null
  let sourceCollection = "users"

  const lowerSnap = await getDoc(doc(db, "users", uid))
  if (lowerSnap.exists()) {
    profileSnap = lowerSnap
    sourceCollection = "users"
  } else {
    const upperSnap = await getDoc(doc(db, "Users", uid))
    if (upperSnap.exists()) {
      profileSnap = upperSnap
      sourceCollection = "Users"
    }
  }

  if (!profileSnap) {
    loadError.value = "Company admin profile not found."
    return
  }

  usersCollectionName.value = sourceCollection
  const profile = profileSnap.data() || {}
  if (String(profile.role || "").toLowerCase() !== "company_admin") {
    loadError.value = "Access denied. This page is for company admin only."
    return
  }

  companyId.value = String(profile.companyId || "")
  companyName.value = String(profile.companyName || "")

  if (!companyId.value) {
    loadError.value = "Your account has no company assignment."
    return
  }

  localStorage.setItem("companyId", companyId.value)
  localStorage.setItem("companyName", companyName.value)

  const q = query(collection(db, usersCollectionName.value), where("companyId", "==", companyId.value))
  stopSync.value = onSnapshot(q, (snapshot) => {
    employees.value = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((user) => ["hr", "finance", "operation"].includes(String(user.role || "").toLowerCase()))
      .sort((a, b) => String(a.role || "").localeCompare(String(b.role || "")))
  })
}

async function createEmployee() {
  if (!canCreate.value || saving.value) return
  if (!companyId.value) {
    toast("Company context is missing.", "#e74c3c")
    return
  }

  const username = form.value.username.trim()
  const usernameLower = username.toLowerCase()
  const email = form.value.email.trim().toLowerCase()
  const role = form.value.role
  const tempPassword = form.value.tempPassword

  saving.value = true
  try {
    const existingUsername = await getDoc(doc(db, "usernames", usernameLower))
    if (existingUsername.exists()) {
      toast("Username already used.", "#e74c3c")
      return
    }

    const secAppName = `company-admin-${Date.now()}`
    const secApp = initializeApp(app.options, secAppName)
    const secAuth = getAuth(secApp)

    let createdCred = null
    try {
      createdCred = await createUserWithEmailAndPassword(secAuth, email, tempPassword)
      const createdUid = createdCred.user.uid

      await setDoc(doc(db, "usernames", usernameLower), {
        uid: createdUid,
        username
      })

      await setDoc(doc(db, usersCollectionName.value, createdUid), {
        uid: createdUid,
        username,
        usernameLower,
        email,
        emailLower: email,
        role,
        companyId: companyId.value,
        companyName: companyName.value,
        authProvider: "password",
        authLinked: true,
        emailVerified: false,
        isActive: true,
        status: "active",
        forcePasswordChange: true,
        temporaryPasswordIssuedAt: serverTimestamp(),
        createdByCompanyAdminUid: auth.currentUser?.uid || "",
        lastLoginAt: null,
        lastSeenAt: null,
        syncedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      })

      toast(`${role.toUpperCase()} account created.`, "#2ecc71")
      form.value = {
        username: "",
        email: "",
        role: "hr",
        tempPassword: ""
      }
    } catch (err) {
      if (createdCred?.user) {
        try {
          await deleteUser(createdCred.user)
        } catch {
          // no-op
        }
      }
      throw err
    } finally {
      try {
        await signOut(secAuth)
      } catch {
        // no-op
      }
      await deleteApp(secApp)
    }
  } catch (err) {
    if (String(err?.code || "").includes("permission-denied")) {
      toast("Permission denied by Firestore Rules. Allow company admin create/write in users + usernames.", "#e74c3c")
      return
    }
    if (err?.code === "auth/email-already-in-use") {
      toast("Email already registered in Firebase Auth.", "#e74c3c")
      return
    }
    if (err?.code === "auth/invalid-email") {
      toast("Invalid email format.", "#e74c3c")
      return
    }
    if (err?.code === "auth/weak-password") {
      toast("Temporary password is too weak (min 8 chars).", "#e74c3c")
      return
    }
    toast(err?.message || "Failed to create employee account.", "#e74c3c")
  } finally {
    saving.value = false
  }
}

function toast(text, backgroundColor) {
  Toastify({
    text,
    backgroundColor
  }).showToast()
}
</script>

<style scoped>
.page h2 {
  margin: 0;
}

.page p {
  color: #64748b;
  margin: 8px 0 16px;
}

.error {
  background: #fee2e2;
  color: #991b1b;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.form-card,
.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
}

.table-card {
  margin-top: 14px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 5px;
}

input,
select {
  width: 100%;
  height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 10px;
}

.create-btn {
  margin-top: 12px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  padding: 10px 14px;
  cursor: pointer;
}

.create-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}

th {
  font-size: 12px;
  color: #64748b;
}

.empty {
  color: #64748b;
  padding: 10px 0;
}
</style>
