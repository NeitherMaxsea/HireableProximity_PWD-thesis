<template>
  <section class="page">
    <div class="hero">
      <div>
        <h2>Team Account Provisioning</h2>
        <p>Create secure role-based accounts for your internal staff.</p>
      </div>
      <div class="chips">
        <span class="chip">{{ companyName || "Company" }}</span>
        <span class="chip subtle">{{ companyId || "No Company ID" }}</span>
      </div>
    </div>

    <div v-if="loadError" class="error">{{ loadError }}</div>

    <div class="summary-grid">
      <div class="summary-card">
        <span>Total Employees</span>
        <strong>{{ employees.length }}</strong>
      </div>
      <div class="summary-card">
        <span>HR</span>
        <strong>{{ hrCount }}</strong>
      </div>
      <div class="summary-card">
        <span>Finance</span>
        <strong>{{ financeCount }}</strong>
      </div>
      <div class="summary-card">
        <span>Operation</span>
        <strong>{{ operationCount }}</strong>
      </div>
    </div>

    <div class="form-card">
      <h3>Create Employee Account</h3>
      <div class="grid">
        <div class="field">
          <label>Username</label>
          <input v-model="form.username" type="text" placeholder="Enter username" />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="Enter work email" />
        </div>
        <div class="field">
          <label>Role</label>
          <select v-model="form.role">
            <option value="hr">HR</option>
            <option value="finance">Finance</option>
            <option value="operation">Operation</option>
          </select>
        </div>
        <div class="field">
          <label>Temporary Password</label>
          <input v-model="form.tempPassword" type="text" placeholder="At least 8 characters" />
        </div>
      </div>
      <button class="create-btn" :disabled="saving || !canCreate" @click="createEmployee">
        {{ saving ? "Creating..." : "Create Employee Account" }}
      </button>
    </div>

    <div class="table-card">
      <div class="table-head">
        <h3>Company Employees</h3>
        <div class="table-tools">
          <input v-model="search" type="text" placeholder="Search name or email" />
          <select v-model="roleFilter">
            <option value="all">All Roles</option>
            <option value="hr">HR</option>
            <option value="finance">Finance</option>
            <option value="operation">Operation</option>
          </select>
        </div>
      </div>

      <table v-if="filteredEmployees.length">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in filteredEmployees" :key="employee.id">
            <td>
              <input v-if="editingId === employee.id" v-model="editForm.username" type="text" class="cell-input" />
              <span v-else>{{ employee.username || "-" }}</span>
            </td>
            <td>
              <input v-if="editingId === employee.id" v-model="editForm.email" type="email" class="cell-input" />
              <span v-else>{{ employee.email || "-" }}</span>
            </td>
            <td>
              <select v-if="editingId === employee.id" v-model="editForm.role" class="cell-select">
                <option value="hr">HR</option>
                <option value="finance">Finance</option>
                <option value="operation">Operation</option>
              </select>
              <span v-else class="role-badge" :class="String(employee.role || '').toLowerCase()">
                {{ employee.role || "-" }}
              </span>
            </td>
            <td>
              <select v-if="editingId === employee.id" v-model="editForm.status" class="cell-select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <span v-else class="status-badge" :class="String(employee.status || '').toLowerCase()">
                {{ employee.status || "-" }}
              </span>
            </td>
            <td class="actions-cell">
              <template v-if="editingId === employee.id">
                <button class="row-btn save" :disabled="isRowBusy(employee.id)" @click="saveEdit(employee)">
                  {{ isRowBusy(employee.id) ? "Saving..." : "Save" }}
                </button>
                <button class="row-btn cancel" :disabled="isRowBusy(employee.id)" @click="cancelEdit">Cancel</button>
              </template>
              <template v-else>
                <button class="row-btn edit" :disabled="isRowBusy(employee.id)" @click="startEdit(employee)">Edit</button>
                <button class="row-btn delete" :disabled="isRowBusy(employee.id)" @click="removeEmployee(employee)">
                  {{ isRowBusy(employee.id) ? "Deleting..." : "Delete" }}
                </button>
              </template>
            </td>
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
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore"

const companyId = ref("")
const companyName = ref("")
const usersCollectionName = ref("users")
const saving = ref(false)
const loadError = ref("")
const employees = ref([])
const stopSync = ref(null)
const editingId = ref("")
const rowBusyId = ref("")
const editForm = ref({
  username: "",
  email: "",
  role: "hr",
  status: "active"
})

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

const search = ref("")
const roleFilter = ref("all")

const filteredEmployees = computed(() => {
  const term = search.value.trim().toLowerCase()

  return employees.value.filter((employee) => {
    const role = String(employee.role || "").toLowerCase()
    const roleOk = roleFilter.value === "all" || role === roleFilter.value
    const textOk =
      !term ||
      String(employee.username || "").toLowerCase().includes(term) ||
      String(employee.email || "").toLowerCase().includes(term)
    return roleOk && textOk
  })
})

const hrCount = computed(() => employees.value.filter((x) => String(x.role || "").toLowerCase() === "hr").length)
const financeCount = computed(() => employees.value.filter((x) => String(x.role || "").toLowerCase() === "finance").length)
const operationCount = computed(() => employees.value.filter((x) => String(x.role || "").toLowerCase() === "operation").length)

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
        createdByCompanyAdminEmail: String(auth.currentUser?.email || localStorage.getItem("userEmail") || ""),
        createdByCompanyName: companyName.value,
        lastLoginAt: null,
        lastSeenAt: null,
        syncedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      })

      await logAdminActivity(
        "Employee Created",
        { uid: createdUid, email, role },
        `${username} (${role}) account created by company admin`
      )

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

function normalizeRole(role) {
  const value = String(role || "").toLowerCase()
  return ["hr", "finance", "operation"].includes(value) ? value : "hr"
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase() === "inactive" ? "inactive" : "active"
}

function isRowBusy(employeeId) {
  return rowBusyId.value === employeeId
}

function startEdit(employee) {
  if (isRowBusy(employee.id)) return
  editingId.value = employee.id
  editForm.value = {
    username: String(employee.username || ""),
    email: String(employee.email || ""),
    role: normalizeRole(employee.role),
    status: normalizeStatus(employee.status)
  }
}

function cancelEdit() {
  editingId.value = ""
  editForm.value = {
    username: "",
    email: "",
    role: "hr",
    status: "active"
  }
}

async function saveEdit(employee) {
  if (editingId.value !== employee.id || isRowBusy(employee.id)) return

  const username = editForm.value.username.trim()
  const email = editForm.value.email.trim().toLowerCase()
  const role = normalizeRole(editForm.value.role)
  const status = normalizeStatus(editForm.value.status)

  if (!username || !email) {
    toast("Username and email are required.", "#e74c3c")
    return
  }

  rowBusyId.value = employee.id
  try {
    const nextUsernameLower = username.toLowerCase()
    const prevUsernameLower = String(employee.usernameLower || employee.username || "").toLowerCase()

    if (nextUsernameLower !== prevUsernameLower) {
      const taken = await getDoc(doc(db, "usernames", nextUsernameLower))
      if (taken.exists() && taken.data()?.uid !== employee.id) {
        toast("Username already used.", "#e74c3c")
        return
      }
    }

    const batch = writeBatch(db)

    batch.set(
      doc(db, usersCollectionName.value, employee.id),
      {
        username,
        usernameLower: nextUsernameLower,
        email,
        emailLower: email,
        role,
        status,
        isActive: status === "active",
        updatedAt: serverTimestamp(),
        syncedAt: serverTimestamp()
      },
      { merge: true }
    )

    if (prevUsernameLower && prevUsernameLower !== nextUsernameLower) {
      batch.delete(doc(db, "usernames", prevUsernameLower))
    }

    batch.set(
      doc(db, "usernames", nextUsernameLower),
      {
        uid: employee.id,
        username
      },
      { merge: true }
    )

    await batch.commit()
    await logAdminActivity(
      "Employee Updated",
      { uid: employee.id, email, role },
      `${username} (${role}) updated. Status: ${status}`
    )
    toast("Employee updated.", "#2ecc71")
    cancelEdit()
  } catch (err) {
    if (String(err?.code || "").includes("permission-denied")) {
      toast("Permission denied by Firestore Rules for update.", "#e74c3c")
      return
    }
    toast(err?.message || "Failed to update employee.", "#e74c3c")
  } finally {
    rowBusyId.value = ""
  }
}

async function removeEmployee(employee) {
  if (isRowBusy(employee.id)) return
  const ok = window.confirm(`Delete employee ${employee.username || employee.email || employee.id}?`)
  if (!ok) return

  rowBusyId.value = employee.id
  try {
    const batch = writeBatch(db)
    batch.delete(doc(db, usersCollectionName.value, employee.id))

    const usernameLower = String(employee.usernameLower || employee.username || "").toLowerCase()
    if (usernameLower) {
      batch.delete(doc(db, "usernames", usernameLower))
    }

    await batch.commit()
    await logAdminActivity(
      "Employee Deleted",
      { uid: employee.id, email: employee.email, role: employee.role },
      `${employee.username || employee.email || employee.id} account deleted`
    )
    if (editingId.value === employee.id) {
      cancelEdit()
    }
    toast("Employee deleted.", "#2ecc71")
  } catch (err) {
    if (String(err?.code || "").includes("permission-denied")) {
      toast("Permission denied by Firestore Rules for delete.", "#e74c3c")
      return
    }
    toast(err?.message || "Failed to delete employee.", "#e74c3c")
  } finally {
    rowBusyId.value = ""
  }
}

function toast(text, backgroundColor) {
  Toastify({
    text,
    backgroundColor
  }).showToast()
}

async function logAdminActivity(event, target = {}, details = "") {
  const actor = auth.currentUser
  if (!actor?.uid || !companyId.value) return

  try {
    await addDoc(collection(db, "activity_logs"), {
      event,
      details,
      actorUid: actor.uid,
      actorEmail: String(actor.email || localStorage.getItem("userEmail") || ""),
      companyId: companyId.value,
      companyName: companyName.value || "",
      targetUid: String(target.uid || ""),
      targetEmail: String(target.email || ""),
      targetRole: String(target.role || ""),
      createdAt: serverTimestamp()
    })
  } catch (err) {
    console.warn("activity_logs write failed:", err)
  }
}
</script>

<style scoped>
.page {
  display: grid;
  gap: 12px;
}

.hero {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 48%, #1d4ed8 100%);
  color: #fff;
  border-radius: 16px;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.hero h2 {
  margin: 0;
  font-size: 24px;
}

.hero p {
  margin: 6px 0 0;
  color: #dbeafe;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: #fff;
  color: #1e3a8a;
}

.chip.subtle {
  background: rgba(255, 255, 255, 0.16);
  color: #dbeafe;
}

.error {
  background: #fee2e2;
  color: #991b1b;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

.summary-card {
  background: #fff;
  border: 1px solid #dbe3f4;
  border-radius: 12px;
  padding: 12px;
}

.summary-card span {
  color: #64748b;
  font-size: 12px;
}

.summary-card strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
  font-size: 20px;
}

.form-card,
.table-card {
  background: #ffffff;
  border: 1px solid #dbe3f4;
  border-radius: 14px;
  padding: 14px;
}

.table-card {
  margin-top: 2px;
}

.form-card h3,
.table-card h3 {
  margin: 0 0 12px;
  color: #0f172a;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.field {
  display: grid;
  gap: 4px;
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
  background: #fff;
}

.create-btn {
  margin-top: 12px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
}

.table-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.table-tools {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.table-tools input,
.table-tools select {
  height: 36px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: 0 10px;
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
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.role-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}

.role-badge.hr {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.finance {
  background: #ede9fe;
  color: #5b21b6;
}

.role-badge.operation {
  background: #dcfce7;
  color: #166534;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.empty {
  color: #64748b;
  padding: 10px 0;
}

.cell-input,
.cell-select {
  width: 100%;
  height: 34px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 10px;
}

.actions-cell {
  white-space: nowrap;
}

.row-btn {
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  margin-right: 6px;
}

.row-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.row-btn.edit {
  background: #dbeafe;
  color: #1e40af;
}

.row-btn.save {
  background: #dcfce7;
  color: #166534;
}

.row-btn.cancel {
  background: #e2e8f0;
  color: #334155;
}

.row-btn.delete {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
