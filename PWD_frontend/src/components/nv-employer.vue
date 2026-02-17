<template>
  <header class="topbar" :class="{ 'topbar-dark': isDark }">
    <div class="breadcrumb">
      <span class="parent">{{ parent }}</span>
      <span v-if="child" class="separator">|</span>
      <span v-if="child" class="child">{{ child }}</span>
    </div>

    <div class="datetime-row">
      <div v-if="showNotifications" class="notif-wrap" ref="notifRef">
        <button class="notif-btn" type="button" @click="toggleNotifications" aria-label="Notifications">
          <i class="bi bi-bell"></i>
          <span v-if="unreadCount > 0" class="notif-count">{{ unreadCount > 99 ? "99+" : unreadCount }}</span>
        </button>

        <div v-if="showNotifDropdown" class="notif-dropdown">
          <div class="notif-head">
            <strong>Notifications</strong>
          </div>
          <div v-if="notifications.length === 0" class="notif-empty">
            No new notifications.
          </div>
          <div v-else class="notif-list">
            <div v-for="item in notifications" :key="item.key" class="notif-item">
              <p class="notif-msg">{{ item.message }}</p>
              <small class="notif-time">{{ item.timeLabel }}</small>
            </div>
          </div>
        </div>
      </div>

      <span class="datetime">
        {{ formattedDate }} | {{ formattedTime }}
      </span>
    </div>
  </header>
</template>

<script>
import api from "@/services/api"

export default {
  name: "NavbarAdmin",

  data() {
    return {
      formattedDate: "",
      formattedTime: "",
      isDark: false,
      themeInterval: null,
      clockInterval: null,
      notifInterval: null,
      showNotifDropdown: false,
      notifications: [],
      seenNotificationKeys: {},
    }
  },

  computed: {
    userRole() {
      return String(localStorage.getItem("userRole") || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
    },

    userUid() {
      return String(localStorage.getItem("uid") || localStorage.getItem("userUid") || "").trim()
    },

    companyId() {
      return String(localStorage.getItem("companyId") || "").trim()
    },

    showNotifications() {
      return this.userRole === "hr" || this.userRole === "finance"
    },

    unreadCount() {
      return this.notifications.filter((n) => n.unread).length
    },

    parent() {
      const path = this.$route.path

      if (path.includes("/employer/finance/")) return "Finance"
      if (path.includes("/job-management/")) return "Job Management"
      if (path.includes("/dashboard")) return "Dashboard"
      if (path.includes("/applicant")) return "Applicants"
      if (path.includes("/employee")) return "Employees"
      if (path.includes("/reports")) return "Reports"

      return "Dashboard"
    },

    child() {
      const path = this.$route.path

      if (path.includes("/employer/finance/job-approval")) return "Job Approval"
      if (path.includes("/employer/finance/dashboard")) return "Dashboard"
      if (path.includes("/job-management/job-list")) return "Job Listings"
      if (path.includes("/job-management/job-post")) return "Job Post"

      return ""
    },
  },

  mounted() {
    this.updateDateTime()
    this.clockInterval = setInterval(this.updateDateTime, 1000)

    this.syncTheme()
    this.themeInterval = setInterval(this.syncTheme, 300)

    document.addEventListener("click", this.handleClickOutside)
    if (this.showNotifications) {
      this.refreshNotifications()
      this.notifInterval = setInterval(this.refreshNotifications, 15000)
    }
  },

  beforeUnmount() {
    clearInterval(this.clockInterval)
    clearInterval(this.themeInterval)
    clearInterval(this.notifInterval)
    document.removeEventListener("click", this.handleClickOutside)
  },

  methods: {
    toggleNotifications() {
      this.showNotifDropdown = !this.showNotifDropdown
      if (this.showNotifDropdown) {
        this.markVisibleNotificationsAsRead()
      }
    },

    handleClickOutside(event) {
      if (!this.showNotifDropdown) return
      const box = this.$refs.notifRef
      if (box && !box.contains(event.target)) {
        this.showNotifDropdown = false
      }
    },

    markVisibleNotificationsAsRead() {
      this.notifications = this.notifications.map((item) => {
        this.seenNotificationKeys[item.key] = true
        return { ...item, unread: false }
      })
    },

    normalizeStatus(status) {
      return String(status || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
    },

    toTimeLabel(value) {
      if (!value) return "Just now"
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return "Just now"
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    },

    async refreshNotifications() {
      try {
        const params = {}
        if (this.companyId) {
          params.companyId = this.companyId
        } else if (this.userUid && this.userRole === "hr") {
          params.postedByUid = this.userUid
        }

        const res = await api.get("/jobs", { params })
        const jobs = Array.isArray(res.data) ? res.data : []
        const role = this.userRole

        let list = []
        if (role === "finance") {
          list = jobs
            .filter((job) => this.normalizeStatus(job.status) === "pending")
            .map((job) => {
              const status = this.normalizeStatus(job.status)
              const stamp = String(job.createdAt || job.updatedAt || "")
              const key = `finance-${job.id}-${status}-${stamp}`
              return {
                key,
                message: `HR submitted "${job.title || "Untitled job"}" for approval.`,
                timeLabel: this.toTimeLabel(job.createdAt || job.updatedAt),
              }
            })
        } else if (role === "hr") {
          list = jobs
            .filter((job) => {
              const status = this.normalizeStatus(job.status)
              if (!["open", "on_hold", "rejected"].includes(status)) return false
              const ownerUid = String(job.postedByUid || "").trim()
              return !this.userUid || ownerUid === this.userUid
            })
            .map((job) => {
              const status = this.normalizeStatus(job.status)
              const stamp = String(job.updatedAt || job.createdAt || "")
              const key = `hr-${job.id}-${status}-${stamp}`
              let action = "updated"
              if (status === "open") action = "approved"
              if (status === "on_hold") action = "put on hold"
              if (status === "rejected") action = "rejected"
              return {
                key,
                message: `Finance ${action} "${job.title || "Untitled job"}".`,
                timeLabel: this.toTimeLabel(job.updatedAt || job.createdAt),
              }
            })
        }

        list.sort((a, b) => b.timeLabel.localeCompare(a.timeLabel))
        this.notifications = list.slice(0, 20).map((item) => ({
          ...item,
          unread: !this.seenNotificationKeys[item.key],
        }))
      } catch (err) {
        console.error("Notification refresh failed:", err)
      }
    },

    syncTheme() {
      this.isDark = localStorage.getItem("sidebarDark") === "true"
    },

    updateDateTime() {
      const now = new Date()

      this.formattedDate = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      this.formattedTime = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    },
  },
}
</script>

<style scoped>
.topbar {
  height: 56px;
  background-color: #ffffff;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.topbar,
.topbar * {
  transition:
    background-color 0.35s ease,
    color 0.35s ease,
    border-color 0.35s ease;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
}

.parent {
  color: #000000;
  font-weight: 500;
}

.separator {
  color: rgba(0, 0, 0, 0.4);
  font-size: 18px;
}

.child {
  color: #000000;
  font-weight: 600;
}

.datetime-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.datetime {
  font-size: 13px;
  color: #000000;
  font-weight: bold;
  letter-spacing: 0.3px;
}

.notif-wrap {
  position: relative;
}

.notif-btn {
  position: relative;
  width: 34px;
  height: 34px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  color: #0f172a;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.notif-btn i {
  font-size: 16px;
}

.notif-btn:hover {
  transform: translateY(-1px);
  border-color: #cbd5e1;
  background: #f8fafc;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.14);
}

.notif-count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #dc2626;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.notif-dropdown {
  position: absolute;
  top: 42px;
  right: 0;
  width: 330px;
  max-height: 340px;
  overflow: auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
  z-index: 1200;
}

.notif-head {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}

.notif-empty {
  padding: 14px 12px;
  color: #64748b;
  font-size: 13px;
}

.notif-list {
  display: grid;
}

.notif-item {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.16s ease;
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-msg {
  margin: 0;
  font-size: 13px;
  color: #0f172a;
}

.notif-time {
  color: #64748b;
  font-size: 11px;
}

.topbar-dark {
  background-color: #020617;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.topbar-dark .parent {
  color: #94a3b8;
}

.topbar-dark .child {
  color: #f8fafc;
}

.topbar-dark .datetime {
  color: #cbd5f5;
}

.topbar-dark .separator {
  color: rgba(255, 255, 255, 0.25);
}

.topbar-dark .notif-btn {
  background: #0f172a;
  color: #e2e8f0;
  border-color: #334155;
}

.topbar-dark .notif-btn:hover {
  background: #1e293b;
  border-color: #475569;
  box-shadow: 0 8px 16px rgba(2, 6, 23, 0.45);
}

.topbar-dark .notif-dropdown {
  background: #0b1220;
  border-color: #334155;
}

.topbar-dark .notif-head {
  border-bottom-color: #334155;
  color: #e2e8f0;
}

.topbar-dark .notif-item {
  border-bottom-color: #1e293b;
}

.topbar-dark .notif-item:hover {
  background: #111827;
}

.topbar-dark .notif-msg {
  color: #e2e8f0;
}

.topbar-dark .notif-time,
.topbar-dark .notif-empty {
  color: #94a3b8;
}
</style>
