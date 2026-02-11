<template>
  <section class="logs-page">
    <header class="logs-header">
      <h2>Company Activity Logs</h2>
      <p>Realtime activity for employee accounts under your company.</p>
    </header>

    <div class="summary-grid">
      <div class="summary-card">
        <span>Total Events</span>
        <strong>{{ events.length }}</strong>
      </div>
      <div class="summary-card">
        <span>Employee Events</span>
        <strong>{{ employeeEventsCount }}</strong>
      </div>
      <div class="summary-card">
        <span>Job Events</span>
        <strong>{{ jobEventsCount }}</strong>
      </div>
      <div class="summary-card">
        <span>Application Events</span>
        <strong>{{ applicationEventsCount }}</strong>
      </div>
      <div class="summary-card">
        <span>Admin Audit Events</span>
        <strong>{{ auditEventsCount }}</strong>
      </div>
    </div>

    <div class="logs-card">
      <div v-if="loading" class="logs-empty">
        <i class="bi bi-hourglass-split"></i>
        <p>Loading logs...</p>
      </div>

      <div v-else-if="loadError && !events.length" class="logs-empty">
        <i class="bi bi-exclamation-triangle"></i>
        <p>{{ loadError }}</p>
      </div>

      <div v-else-if="!events.length" class="logs-empty">
        <i class="bi bi-journal-text"></i>
        <p>No activity yet for this company admin.</p>
      </div>

      <div v-else class="logs-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Event</th>
              <th>Account</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in events" :key="event.id">
              <td class="time">{{ formatDateTime(event.timestampMs) }}</td>
              <td>
                <span class="badge source" :class="event.sourceClass">{{ event.sourceLabel }}</span>
              </td>
              <td>
                <span class="badge event">{{ event.eventLabel }}</span>
              </td>
              <td class="account">{{ event.accountLabel }}</td>
              <td class="details">{{ event.details }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { auth, db } from "@/firebase"
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore"

const loading = ref(true)
const loadError = ref("")
const companyId = ref("")
const companyName = ref("")
const companyAdminUid = ref("")
const employeesLower = ref([])
const employeesUpper = ref([])
const jobs = ref([])
const applications = ref([])
const auditEvents = ref([])
const unsubscribers = []

const employees = computed(() => {
  const merged = new Map()
  ;[...employeesLower.value, ...employeesUpper.value].forEach((user) => {
    merged.set(user.id, user)
  })
  return Array.from(merged.values())
})

const employeeMapByUid = computed(() => {
  const map = new Map()
  employees.value.forEach((item) => map.set(item.id, item))
  return map
})

const employeeMapByEmail = computed(() => {
  const map = new Map()
  employees.value.forEach((item) => {
    const email = String(item.email || "").toLowerCase().trim()
    if (email) map.set(email, item)
  })
  return map
})

const employeeEvents = computed(() => {
  return employees.value.flatMap((employee) => {
    const items = []
    const name = String(employee.username || employee.name || employee.email || employee.id || "Employee")
    const role = String(employee.role || "employee")
    const accountLabel = String(employee.email || employee.id || "Unknown")

    const createdAtMs = toMillis(employee.createdAt)
    if (createdAtMs) {
      items.push({
        id: `employee-created-${employee.id}`,
        timestampMs: createdAtMs,
        sourceLabel: "Employees",
        sourceClass: "employees",
        eventLabel: "Account Created",
        accountLabel,
        details: `${name} (${role}) account created`
      })
    }

    const loginAtMs = toMillis(employee.lastLoginAt)
    if (loginAtMs) {
      items.push({
        id: `employee-login-${employee.id}-${loginAtMs}`,
        timestampMs: loginAtMs,
        sourceLabel: "Employees",
        sourceClass: "employees",
        eventLabel: "Login",
        accountLabel,
        details: `${name} (${role}) signed in`
      })
    }

    const updatedAtMs = toMillis(employee.updatedAt)
    if (updatedAtMs) {
      items.push({
        id: `employee-updated-${employee.id}-${updatedAtMs}`,
        timestampMs: updatedAtMs,
        sourceLabel: "Employees",
        sourceClass: "employees",
        eventLabel: "Profile Updated",
        accountLabel,
        details: `${name} profile/status changed`
      })
    }

    return items
  })
})

const relevantJobsById = computed(() => {
  const map = new Map()
  relevantJobs.value.forEach((job) => map.set(job.id, job))
  return map
})

const relevantJobs = computed(() => {
  return jobs.value.filter((job) => {
    const posterUid = String(job.postedByUid || "").trim()
    if (posterUid && employeeMapByUid.value.has(posterUid)) return true

    const posterEmail = String(job.postedByEmail || "").toLowerCase().trim()
    if (posterEmail && employeeMapByEmail.value.has(posterEmail)) return true

    return false
  })
})

const jobEvents = computed(() => {
  return relevantJobs.value.flatMap((job) => {
    const items = []
    const createdAtMs = toMillis(job.createdAt)
    const updatedAtMs = toMillis(job.updatedAt)
    const poster = resolvePosterLabel(job)
    const accountLabel = poster || "Unknown"
    const title = String(job.title || "Untitled job")
    const status = String(job.status || "open").toLowerCase()

    if (createdAtMs) {
      items.push({
        id: `job-created-${job.id}`,
        timestampMs: createdAtMs,
        sourceLabel: "Jobs",
        sourceClass: "jobs",
        eventLabel: "Job Posted",
        accountLabel,
        details: `${title} (${status})`
      })
    }

    if (updatedAtMs && updatedAtMs !== createdAtMs) {
      items.push({
        id: `job-updated-${job.id}-${updatedAtMs}`,
        timestampMs: updatedAtMs,
        sourceLabel: "Jobs",
        sourceClass: "jobs",
        eventLabel: "Job Updated",
        accountLabel,
        details: `${title} status: ${status}`
      })
    }

    return items
  })
})

const relevantApplications = computed(() => {
  return applications.value.filter((application) => {
    const jobId = String(application.jobId || "").trim()
    return jobId && relevantJobsById.value.has(jobId)
  })
})

const applicationEvents = computed(() => {
  return relevantApplications.value
    .map((application) => {
      const appliedAtMs = toMillis(application.appliedAt)
      if (!appliedAtMs) return null

      const job = relevantJobsById.value.get(String(application.jobId || "")) || {}
      const postedBy = resolvePosterLabel(job)
      const applicant = firstNonEmpty(
        application.applicantEmail,
        application.applicantName,
        application.applicantUid,
        application.userEmail,
        application.userName,
        application.userUid
      )

      return {
        id: `application-${application.id}`,
        timestampMs: appliedAtMs,
        sourceLabel: "Applications",
        sourceClass: "applications",
        eventLabel: "Application Submitted",
        accountLabel: applicant || postedBy || "Unknown",
        details: `${String(application.jobTitle || job.title || "Unknown job")} (${String(application.status || "pending")})`
      }
    })
    .filter(Boolean)
})

const events = computed(() => {
  return [
    ...employeeEvents.value,
    ...jobEvents.value,
    ...applicationEvents.value,
    ...auditEvents.value
  ]
    .filter((item) => item.timestampMs > 0)
    .sort((a, b) => b.timestampMs - a.timestampMs)
    .slice(0, 250)
})

const employeeEventsCount = computed(() => employeeEvents.value.length)
const jobEventsCount = computed(() => jobEvents.value.length)
const applicationEventsCount = computed(() => applicationEvents.value.length)
const auditEventsCount = computed(() => auditEvents.value.length)

onMounted(async () => {
  await bootstrapScope()
  if (!companyId.value || !companyAdminUid.value) return
  subscribeEmployees("users")
  subscribeEmployees("Users")
  subscribeJobs()
  subscribeApplications()
  subscribeCompanyAdminAuditLogs()
})

onBeforeUnmount(() => {
  unsubscribers.forEach((unsub) => unsub && unsub())
})

async function bootstrapScope() {
  const uid = auth.currentUser?.uid
  if (!uid) {
    loadError.value = "Session missing. Please login again."
    loading.value = false
    return
  }

  companyAdminUid.value = uid
  const lowerSnap = await getDoc(doc(db, "users", uid))
  if (lowerSnap.exists()) {
    hydrateProfile(lowerSnap.data())
    return
  }

  const upperSnap = await getDoc(doc(db, "Users", uid))
  if (upperSnap.exists()) {
    hydrateProfile(upperSnap.data())
    return
  }

  loadError.value = "Company admin profile not found."
  loading.value = false
}

function hydrateProfile(profile) {
  const role = String(profile?.role || "").toLowerCase()
  if (role !== "company_admin") {
    loadError.value = "Access denied. Company admin only."
    loading.value = false
    return
  }

  companyId.value = String(profile?.companyId || "").trim()
  companyName.value = String(profile?.companyName || "").trim()
  if (!companyId.value) {
    loadError.value = "No company assignment found."
    loading.value = false
  }
}

function subscribeEmployees(collectionName) {
  const unsub = onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      const list = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((user) => {
          const role = String(user.role || "").toLowerCase()
          const isManagedRole = ["hr", "finance", "operation"].includes(role)
          if (!isManagedRole) return false
          if (String(user.companyId || "") !== companyId.value) return false
          return String(user.createdByCompanyAdminUid || "") === companyAdminUid.value
        })

      if (collectionName === "Users") {
        employeesUpper.value = list
      } else {
        employeesLower.value = list
      }
      loading.value = false
      loadError.value = ""
    },
    () => {
      if (!events.value.length) {
        loadError.value = "Cannot read employee logs. Check Firestore Rules."
      }
      loading.value = false
    }
  )
  unsubscribers.push(unsub)
}

function subscribeJobs() {
  const unsub = onSnapshot(
    collection(db, "jobs"),
    (snapshot) => {
      jobs.value = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      loading.value = false
    },
    () => {
      loading.value = false
    }
  )
  unsubscribers.push(unsub)
}

function subscribeApplications() {
  const unsub = onSnapshot(
    collection(db, "applications"),
    (snapshot) => {
      applications.value = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      loading.value = false
    },
    () => {
      loading.value = false
    }
  )
  unsubscribers.push(unsub)
}

function subscribeCompanyAdminAuditLogs() {
  const unsub = onSnapshot(
    collection(db, "activity_logs"),
    (snapshot) => {
      auditEvents.value = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((entry) => {
          if (String(entry.actorUid || "").trim() !== companyAdminUid.value) return false
          if (String(entry.companyId || "").trim() !== companyId.value) return false
          return true
        })
        .map((entry) => ({
          id: `audit-${entry.id}`,
          timestampMs: toMillis(entry.createdAt),
          sourceLabel: "Company Admin",
          sourceClass: "admin",
          eventLabel: String(entry.event || "Action"),
          accountLabel: firstNonEmpty(entry.targetEmail, entry.targetUid, entry.actorEmail, companyName.value, "Company"),
          details: String(entry.details || "")
        }))
        .filter((entry) => entry.timestampMs > 0)
      loading.value = false
    },
    () => {
      loading.value = false
    }
  )
  unsubscribers.push(unsub)
}

function resolvePosterLabel(job) {
  const uid = String(job.postedByUid || "").trim()
  if (uid && employeeMapByUid.value.has(uid)) {
    const employee = employeeMapByUid.value.get(uid) || {}
    return firstNonEmpty(employee.email, employee.username, uid)
  }

  const email = String(job.postedByEmail || "").trim()
  if (email && employeeMapByEmail.value.has(email.toLowerCase())) {
    return email
  }

  return firstNonEmpty(job.postedByEmail, job.postedByName, job.postedByUid)
}

function toMillis(value) {
  if (!value) return 0
  if (typeof value?.toMillis === "function") return value.toMillis()
  if (typeof value === "number") return value
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value || "").trim()
    if (text) return text
  }
  return ""
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
.logs-page {
  padding: 10px;
}

.logs-header h2 {
  margin: 0;
}

.logs-header p {
  color: #6b7280;
  margin: 8px 0 20px;
}

.summary-grid {
  margin-bottom: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
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

.logs-card {
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
}

.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #6b7280;
  min-height: 180px;
  text-align: center;
}

.logs-empty i {
  font-size: 2rem;
  color: #0d6efd;
}

.logs-empty p {
  margin: 0;
}

.logs-table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

th,
td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}

th {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: #f8fafc;
}

.time {
  white-space: nowrap;
  color: #334155;
}

.details {
  color: #0f172a;
}

.account {
  color: #334155;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.badge.source.employees {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge.source.jobs {
  background: #dcfce7;
  color: #166534;
}

.badge.source.applications {
  background: #fff7ed;
  color: #9a3412;
}

.badge.source.admin {
  background: #ede9fe;
  color: #5b21b6;
}

.badge.event {
  background: #e2e8f0;
  color: #334155;
}
</style>
