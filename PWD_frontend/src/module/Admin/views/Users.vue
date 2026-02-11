<template>
  <div class="users-page">
    <div class="header">
      <div>
        <h2>User Management</h2>
        <p>Employer and applicant accounts with active status</p>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <span>Total Users</span>
        <strong>{{ stats.total }}</strong>
      </div>
      <div class="summary-card">
        <span>Applicants</span>
        <strong>{{ stats.applicant }}</strong>
      </div>
      <div class="summary-card">
        <span>Employers</span>
        <strong>{{ stats.employer }}</strong>
      </div>
      <div class="summary-card">
        <span>Active</span>
        <strong class="good">{{ stats.active }}</strong>
      </div>
      <div class="summary-card">
        <span>Inactive</span>
        <strong class="bad">{{ stats.inactive }}</strong>
      </div>
    </div>

    <div class="toolbar">
      <input
        v-model="search"
        type="text"
        placeholder="Search name or email..."
      />

      <select v-model="roleFilter">
        <option value="all">All Roles</option>
        <option value="applicant">Applicant</option>
        <option value="employer">Employer</option>
      </select>

      <select v-model="statusFilter">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>

    <div class="table-wrap">
      <table v-if="filteredUsers.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Firebase Sync</th>
            <th>Last Login</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td class="id-cell" :title="user.id">{{ user.id }}</td>
            <td>{{ user.displayName }}</td>
            <td>{{ user.email || "-" }}</td>
            <td class="role-cell">
              <span class="role-badge" :class="user.role">
                {{ user.roleLabel }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="user.status">
                {{ user.statusLabel }}
              </span>
            </td>
            <td>
              <span class="sync-badge" :class="user.syncState">
                {{ user.syncLabel }}
              </span>
            </td>
            <td>{{ user.lastLoginLabel }}</td>
            <td>{{ user.createdLabel }}</td>
            <td class="actions-cell">
              <button class="action-btn view" @click="openViewModal(user)">View</button>
              <button class="action-btn edit" @click="openEditModal(user)">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        {{ loading ? "Loading users..." : loadError || "No users found." }}
      </div>
    </div>

    <div v-if="showViewModal && selectedUser" class="modal-overlay" @click.self="showViewModal = false">
      <div class="modal-card">
        <div class="modal-head">
          <h3>User Details</h3>
          <button class="close-btn" @click="showViewModal = false">x</button>
        </div>
        <div class="modal-body">
          <p><strong>ID:</strong> {{ selectedUser.id }}</p>
          <p><strong>Name:</strong> {{ selectedUser.displayName }}</p>
          <p><strong>Email:</strong> {{ selectedUser.email || "-" }}</p>
          <p><strong>Role:</strong> {{ selectedUser.roleLabel }}</p>
          <p><strong>Status:</strong> {{ selectedUser.statusLabel }}</p>
          <p><strong>Firebase Sync:</strong> {{ selectedUser.syncLabel }}</p>
          <p><strong>Last Login:</strong> {{ selectedUser.lastLoginLabel }}</p>
          <p><strong>Created:</strong> {{ selectedUser.createdLabel }}</p>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-card">
        <div class="modal-head">
          <h3>Edit User</h3>
          <button class="close-btn" @click="showEditModal = false">x</button>
        </div>
        <div class="modal-body">
          <label>Name</label>
          <input v-model="editForm.displayName" type="text" />

          <label>Email</label>
          <input v-model="editForm.email" type="email" disabled />

          <label>Role</label>
          <select v-model="editForm.role">
            <option value="applicant">Applicant</option>
            <option value="employer">Employer</option>
          </select>

          <label>Status</label>
          <select v-model="editForm.status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <label>New Password (optional)</label>
          <input
            v-model="editForm.password"
            type="password"
            placeholder="At least 8 characters"
          />

          <label>Confirm Password</label>
          <input
            v-model="editForm.confirmPassword"
            type="password"
            placeholder="Confirm new password"
          />

          <small class="hint">
            If password fields are filled, a password reset email will be sent to this user.
          </small>
        </div>
        <div class="modal-actions">
          <button class="reset-btn" @click="sendResetFromModal">Reset Password</button>
          <button class="cancel-btn" @click="showEditModal = false">Cancel</button>
          <button class="save-btn" @click="saveEditUser">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue"
import { sendPasswordResetEmail } from "firebase/auth"
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc } from "firebase/firestore"
import { auth, db } from "@/firebase"

const users = ref([])
const loading = ref(true)
const loadError = ref("")
const search = ref("")
const roleFilter = ref("all")
const statusFilter = ref("all")
const unsubscribers = []
const showViewModal = ref(false)
const showEditModal = ref(false)
const selectedUser = ref(null)
const editForm = ref({
  id: "",
  collectionName: "users",
  displayName: "",
  email: "",
  role: "applicant",
  status: "inactive",
  password: "",
  confirmPassword: ""
})

onMounted(() => {
  void initUsers()
})

onBeforeUnmount(() => {
  unsubscribers.forEach((fn) => fn && fn())
})

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()

  return users.value.filter((user) => {
    const roleOk = roleFilter.value === "all" || user.role === roleFilter.value
    const statusOk = statusFilter.value === "all" || user.status === statusFilter.value
    const textOk =
      !term ||
      user.displayName.toLowerCase().includes(term) ||
      (user.email || "").toLowerCase().includes(term)

    return roleOk && statusOk && textOk
  })
})

const stats = computed(() => {
  const list = users.value
  return {
    total: list.length,
    applicant: list.filter((u) => u.role === "applicant").length,
    employer: list.filter((u) => u.role === "employer").length,
    active: list.filter((u) => u.status === "active").length,
    inactive: list.filter((u) => u.status === "inactive").length
  }
})

async function initUsers() {
  loading.value = true
  loadError.value = ""

  const first = await fetchUsersOnce()
  users.value = first.list
  loading.value = false

  if (first.error && !first.list.length) {
    loadError.value = "Cannot read Firestore users. Check Firestore Rules/admin access."
  }

  subscribeUsersRealtime(first.source)
}

async function fetchUsersOnce() {
  const candidates = ["users", "Users"]
  let lastError = null

  for (const collectionName of candidates) {
    try {
      const snap = await getDocs(query(collection(db, collectionName)))
      const normalized = normalizeList(snap.docs, collectionName)
      if (normalized.length) {
        return { list: normalized, source: collectionName, error: null }
      }
    } catch (err) {
      lastError = err
    }
  }

  return { list: [], source: "users", error: lastError }
}

function subscribeUsersRealtime(source) {
  const targets = source === "Users" ? ["Users", "users"] : ["users", "Users"]

  targets.forEach((collectionName) => {
    const unsub = onSnapshot(
      query(collection(db, collectionName)),
      (snapshot) => {
        const normalized = normalizeList(snapshot.docs, collectionName)
        if (normalized.length || !users.value.length) {
          users.value = normalized
          loadError.value = ""
        }
      },
      () => {
        if (!users.value.length) {
          loadError.value = "Realtime sync blocked. Showing latest available data."
        }
      }
    )
    unsubscribers.push(unsub)
  })
}

function normalizeList(docs, collectionName = "users") {
  return docs
    .map((docSnap) => normalizeUser(docSnap.id, docSnap.data(), collectionName))
    .filter((user) => user.role === "applicant" || user.role === "employer")
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
}

function openViewModal(user) {
  selectedUser.value = user
  showViewModal.value = true
}

function openEditModal(user) {
  selectedUser.value = user
  editForm.value = {
    id: user.id,
    collectionName: user.collectionName || "users",
    displayName: user.displayName || "",
    email: user.email || "",
    role: user.role || "applicant",
    status: user.status || "inactive",
    password: "",
    confirmPassword: ""
  }
  showEditModal.value = true
}

async function saveEditUser() {
  const wantsPasswordChange =
    !!editForm.value.password?.trim() || !!editForm.value.confirmPassword?.trim()

  if (wantsPasswordChange) {
    if (editForm.value.password.length < 8) {
      alert("Password must be at least 8 characters.")
      return
    }
    if (editForm.value.password !== editForm.value.confirmPassword) {
      alert("Password and confirm password do not match.")
      return
    }
    if (!editForm.value.email) {
      alert("User has no email. Cannot send password reset.")
      return
    }
  }

  const payload = {
    username: editForm.value.displayName || "",
    role: editForm.value.role,
    status: editForm.value.status,
    isActive: editForm.value.status === "active",
    updatedAt: serverTimestamp()
  }

  try {
    await updateDoc(
      doc(db, editForm.value.collectionName, editForm.value.id),
      payload
    )
    if (wantsPasswordChange) {
      await sendPasswordResetEmail(auth, editForm.value.email)
      await updateDoc(doc(db, editForm.value.collectionName, editForm.value.id), {
        passwordResetRequestedAt: serverTimestamp()
      })
      alert("Password reset email sent.")
    }
    showEditModal.value = false
  } catch (err) {
    const altCollection = editForm.value.collectionName === "users" ? "Users" : "users"
    try {
      await updateDoc(doc(db, altCollection, editForm.value.id), payload)
      if (wantsPasswordChange) {
        await sendPasswordResetEmail(auth, editForm.value.email)
        await updateDoc(doc(db, altCollection, editForm.value.id), {
          passwordResetRequestedAt: serverTimestamp()
        })
        alert("Password reset email sent.")
      }
      showEditModal.value = false
    } catch (finalErr) {
      console.error(finalErr)
      alert("Failed to update user. Check Firestore Rules for admin write access.")
    }
  }
}

async function sendResetFromModal() {
  if (!editForm.value.email) {
    alert("User has no email. Cannot send reset link.")
    return
  }

  try {
    await sendPasswordResetEmail(auth, editForm.value.email)
    await updateDoc(doc(db, editForm.value.collectionName, editForm.value.id), {
      passwordResetRequestedAt: serverTimestamp()
    })
    alert("Password reset email sent.")
  } catch (err) {
    const altCollection = editForm.value.collectionName === "users" ? "Users" : "users"
    try {
      await sendPasswordResetEmail(auth, editForm.value.email)
      await updateDoc(doc(db, altCollection, editForm.value.id), {
        passwordResetRequestedAt: serverTimestamp()
      })
      alert("Password reset email sent.")
    } catch (finalErr) {
      console.error(finalErr)
      alert("Failed to send reset email.")
    }
  }
}

function normalizeUser(id, data, collectionName = "users") {
  const role = String(data.role || "").toLowerCase()
  const status = resolveStatus(data)
  const createdAtMs = toMillis(data.createdAt)
  const lastLoginAtMs = toMillis(data.lastLoginAt)
  const syncState = resolveSyncState(data)

  return {
    id,
    collectionName,
    email: data.email || "",
    role,
    roleLabel: role === "applicant" ? "Applicant" : role === "employer" ? "Employer" : "Unknown",
    status,
    statusLabel: status === "active" ? "Active" : "Inactive",
    syncState,
    syncLabel: syncState === "synced" ? "Synced" : "Missing Link",
    displayName: data.username || data.name || data.email || "Unknown User",
    lastLoginAtMs,
    lastLoginLabel: lastLoginAtMs ? formatDateTime(lastLoginAtMs) : "-",
    createdAtMs,
    createdLabel: createdAtMs ? formatDate(createdAtMs) : "-"
  }
}

function resolveStatus(data) {
  const lastSeenMs = toMillis(data.lastSeenAt || data.lastLoginAt)
  const activeWindowMs = 15 * 60 * 1000
  const rawStatus = String(data.status || "").toLowerCase()

  if (rawStatus === "inactive" || rawStatus === "disabled" || rawStatus === "suspended") {
    return "inactive"
  }
  if (rawStatus === "active") {
    return "active"
  }

  if (typeof data.isActive === "boolean") {
    return data.isActive ? "active" : "inactive"
  }
  if (typeof data.active === "boolean") {
    return data.active ? "active" : "inactive"
  }

  if (data.disabledAt || data.deactivatedAt) {
    return "inactive"
  }

  if (lastSeenMs && Date.now() - lastSeenMs <= activeWindowMs) {
    return "active"
  }

  return "inactive"
}

function resolveSyncState(data) {
  const hasUid = typeof data.uid === "string" && data.uid.length > 0
  const hasAuthProvider = typeof data.authProvider === "string" && data.authProvider.length > 0
  const linked = data.authLinked === true
  return hasUid && (linked || hasAuthProvider) ? "synced" : "missing"
}

function toMillis(value) {
  if (!value) return 0
  if (typeof value?.toMillis === "function") return value.toMillis()
  if (typeof value === "number") return value
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatDate(ms) {
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

function formatDateTime(ms) {
  return new Date(ms).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}
</script>

<style scoped>
.users-page {
  padding: 8px;
}

.header h2 {
  margin: 0;
}

.header p {
  margin: 4px 0 0;
  color: #64748b;
}

.summary-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}

.summary-card span {
  color: #64748b;
  font-size: 12px;
}

.summary-card strong {
  display: block;
  margin-top: 4px;
  font-size: 20px;
  color: #0f172a;
}

.summary-card .good {
  color: #166534;
}

.summary-card .bad {
  color: #991b1b;
}

.toolbar {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar input,
.toolbar select {
  height: 38px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: 0 12px;
  background: #fff;
}

.toolbar input {
  min-width: 260px;
  flex: 1;
}

.table-wrap {
  margin-top: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 14px;
}

th {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: #f8fafc;
}

.role-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.applicant {
  background: #e0f2fe;
  color: #075985;
}

.role-badge.employer {
  background: #ecfdf5;
  color: #065f46;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.sync-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.sync-badge.synced {
  background: #ecfdf5;
  color: #065f46;
}

.sync-badge.missing {
  background: #fff7ed;
  color: #9a3412;
}

.empty-state {
  padding: 24px;
  color: #64748b;
  text-align: center;
}

.id-cell {
  max-width: 160px;
  font-family: Consolas, monospace;
  font-size: 12px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions-cell {
  min-width: 130px;
}

.action-btn {
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  margin-right: 6px;
}

.action-btn.view {
  background: #dbeafe;
  color: #1d4ed8;
}

.action-btn.edit {
  background: #dcfce7;
  color: #166534;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 16px;
}

.modal-card {
  width: min(520px, 100%);
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.2);
}

.modal-head {
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-head h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: #f1f5f9;
  cursor: pointer;
}

.modal-body {
  padding: 16px;
  display: grid;
  gap: 8px;
}

.modal-body label {
  font-size: 12px;
  color: #64748b;
}

.modal-body input,
.modal-body select {
  height: 38px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: 0 10px;
}

.hint {
  color: #64748b;
  font-size: 12px;
}

.modal-actions {
  padding: 0 16px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn,
.save-btn {
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.reset-btn {
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  background: #fff7ed;
  color: #9a3412;
  margin-right: auto;
}

.cancel-btn {
  background: #e2e8f0;
  color: #1f2937;
}

.save-btn {
  background: #2563eb;
  color: #fff;
}
</style>
