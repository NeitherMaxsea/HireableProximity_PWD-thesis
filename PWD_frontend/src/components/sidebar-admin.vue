<template>
  
  <aside class="sidebar">

    <!-- Brand / System -->
    <div class="brand-box">
      <img src="@/assets/whitelogo.png" class="logo" alt="System Logo" />

      <div class="brand-text">
        <h4>Admin Panel</h4>
        <small>System Management</small>
      </div>
    </div>

    <!-- Menu -->
    <nav class="menu">

      <RouterLink to="/admin/dashboard" class="item">
        <i class="bi bi-grid"></i>
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink to="/admin/users" class="item">
        <i class="bi bi-people"></i>
        <span>Users</span>
      </RouterLink>

      <RouterLink to="/admin/jobs" class="item">
        <i class="bi bi-briefcase"></i>
        <span>Job Management</span>
      </RouterLink>

      <RouterLink to="/admin/applications" class="item">
        <i class="bi bi-file-earmark-text"></i>
        <span>Applications</span>
      </RouterLink>

      <RouterLink to="/admin/reports" class="item">
        <i class="bi bi-bar-chart"></i>
        <span>Reports</span>
      </RouterLink>

      <RouterLink to="/admin/notifications" class="item">
        <i class="bi bi-bell"></i>
        <span>Notifications</span>
      </RouterLink>

      <RouterLink to="/admin/help" class="item">
        <i class="bi bi-question-circle"></i>
        <span>Help</span>
      </RouterLink>

    </nav>

    <!-- Admin Info -->
    <div class="admin-box">
      <div class="admin-info">
        <strong>{{ adminName }}</strong>
        <small>Administrator</small>
      </div>
    </div>

    <!-- Logout -->
    <div class="logout" @click="logout">
      <i class="bi bi-box-arrow-right"></i>
      <span>Logout</span>
    </div>

  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const adminName = ref('System Admin')

function logout() {
  localStorage.clear()
  router.push('/login')
}
</script>

<style scoped>

.sidebar {
  width: 260px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
}

/* Brand */

.brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.logo {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.brand-text h4 {
  margin: 0;
  font-size: 15px;
}

.brand-text small {
  color: gray;
}

/* Menu */

.menu {
  flex: 1;
  padding: 12px 0;
}


.item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 22px;
  color: #333;
  text-decoration: none;
  font-size: 15px;
  border-radius: 6px;
}

.item:hover {
  background: #f3f3f3;
}

.router-link-active {
  background: #e6f0ff;
  color: #0d6efd;
  font-weight: 600;
}

/* Admin Info */

.admin-box {
  padding: 15px 20px;
  border-top: 1px solid #eee;
}

.admin-info strong {
  display: block;
}

.admin-info small {
  color: gray;
}

/* Logout */

.logout {
  padding: 14px 20px;
  border-top: 1px solid #eee;
  cursor: pointer;
  display: flex;
  gap: 12px;
}

.logout:hover {
  background: #ffecec;
  color: #d93025;
}

</style>
