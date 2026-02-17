<template>
  <section class="finance-page">
    <div class="header">
      <h2>Job Post Approval</h2>
      <p>Review HR-submitted job posts before they are published to applicants.</p>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Position</th>
            <th>Location</th>
            <th>Requested By</th>
            <th>Salary</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="7" class="empty">No job posts to review.</td>
          </tr>
          <tr v-for="item in rows" :key="item.id">
            <td class="mono">{{ item.id }}</td>
            <td>{{ item.title || "-" }}</td>
            <td>{{ item.location || "-" }}</td>
            <td>{{ item.postedByName || item.postedByEmail || "-" }}</td>
            <td>{{ item.salary || "Negotiable" }}</td>
            <td>
              <span class="badge" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td class="actions">
              <button
                class="btn approve"
                :disabled="busyId === item.id || normalizeStatus(item.status) === 'open'"
                @click="setStatus(item, 'open')"
              >
                Approve
              </button>
              <button
                class="btn hold"
                :disabled="busyId === item.id || normalizeStatus(item.status) === 'on_hold'"
                @click="setStatus(item, 'on_hold')"
              >
                Hold
              </button>
              <button
                class="btn reject"
                :disabled="busyId === item.id || normalizeStatus(item.status) === 'rejected'"
                @click="setStatus(item, 'rejected')"
              >
                Reject
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue"
import { auth, db } from "@/lib/client-platform"
import { onAuthStateChanged } from "@/lib/session-auth"
import Toastify from "toastify-js"
import "toastify-js/src/toastify.css"
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from "@/lib/laravel-data"

const rows = ref([])
const busyId = ref(null)
let unsubscribeJobs = null

onMounted(async () => {
  const actor = await resolveActorMeta()
  if (!actor?.uid) {
    showToast("Cannot load approval queue. Please login again.", "#991b1b")
    return
  }

  let jobsRef = collection(db, "jobs")
  if (actor.companyId) {
    jobsRef = query(jobsRef, where("companyId", "==", actor.companyId))
  }

  unsubscribeJobs = onSnapshot(jobsRef, (snapshot) => {
    rows.value = snapshot.docs
      .map((d) => ({ id: d.id, ...(d.data() || {}) }))
      .filter((job) => ["pending", "on_hold", "rejected", "open"].includes(normalizeStatus(job.status)))
      .sort((a, b) => getCreatedAtMillis(b.createdAt) - getCreatedAtMillis(a.createdAt))
  })
})

onBeforeUnmount(() => {
  if (typeof unsubscribeJobs === "function") {
    unsubscribeJobs()
    unsubscribeJobs = null
  }
})

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
}

function statusClass(status) {
  return normalizeStatus(status).replace(/_/g, "-")
}

function statusLabel(status) {
  const value = normalizeStatus(status)
  if (!value) return "Pending"
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getCreatedAtMillis(ts) {
  if (!ts) return 0
  if (typeof ts?.toMillis === "function") return ts.toMillis()
  if (typeof ts?.seconds === "number") return ts.seconds * 1000
  if (ts instanceof Date) return ts.getTime()
  return 0
}

function waitForAuthUser(timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser)
      return
    }

    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      unsubscribe()
      resolve(auth.currentUser || null)
    }, timeoutMs)

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      unsubscribe()
      resolve(user || null)
    })
  })
}

async function resolveActorMeta() {
  const user = await waitForAuthUser()
  const uid = String(user?.uid || localStorage.getItem("uid") || localStorage.getItem("userUid") || "").trim()
  if (!uid) return null

  let profile = {}
  try {
    const snap = await getDoc(doc(db, "users", uid))
    if (snap.exists()) {
      profile = snap.data() || {}
    }
  } catch {
    // fallback to auth/localStorage
  }

  const email = String(
    profile.email || user?.email || localStorage.getItem("userEmail") || ""
  ).trim()
  const name = String(
    profile.username || profile.name || localStorage.getItem("userName") || email
  ).trim()
  const companyId = String(
    profile.companyId || localStorage.getItem("companyId") || ""
  ).trim()

  return {
    uid,
    email,
    name,
    companyId
  }
}

async function setStatus(job, status) {
  if (!job?.id) return

  const actor = await resolveActorMeta()
  if (!actor) {
    showToast("Cannot identify your account.", "#991b1b")
    return
  }

  busyId.value = job.id
  try {
    await updateDoc(doc(db, "jobs", job.id), {
      status
    })

    if (status === "open") {
      showToast("Job approved and now visible to applicants.", "#166534")
      return
    }
    if (status === "on_hold") {
      showToast("Job moved to on-hold.", "#1d4ed8")
      return
    }
    showToast("Job rejected.", "#991b1b")
  } catch (err) {
    console.error(err)
    showToast(err?.message || "Failed to update job status.", "#991b1b")
  } finally {
    busyId.value = null
  }
}

function showToast(text, background) {
  Toastify({
    text,
    gravity: "top",
    position: "right",
    duration: 3000,
    close: true,
    stopOnFocus: true,
    style: { background }
  }).showToast()
}
</script>

<style scoped>
.finance-page {
  display: grid;
  gap: 14px;
}

.header h2 {
  margin: 0;
}

.header p {
  margin: 6px 0 0;
  color: #64748b;
}

.table-card {
  background: #ffffff;
  border: 1px solid #dbe3f4;
  border-radius: 14px;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid #eef2f7;
  font-size: 14px;
}

th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #64748b;
}

.mono {
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
}

.empty {
  color: #64748b;
  text-align: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}

.badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.badge.on-hold {
  background: #dbeafe;
  color: #1e3a8a;
}

.badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.badge.open {
  background: #dcfce7;
  color: #166534;
}

.actions {
  white-space: nowrap;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  margin-right: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.approve {
  background: #dcfce7;
  color: #166534;
}

.btn.hold {
  background: #dbeafe;
  color: #1d4ed8;
}

.btn.reject {
  background: #fee2e2;
  color: #991b1b;
}
</style>
