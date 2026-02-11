<template>
  <div class="admin-layout">

    <!-- TOP NAVBAR -->
    <NavbarAdmin />

    <!-- BODY -->
    <div class="body">

      <!-- SIDEBAR -->
      <SidebarAdmin />

      <!-- PAGE CONTENT -->
      <main class="content">
        <router-view />
      </main>

    </div>

  </div>
</template>

<script setup>
import NavbarAdmin from '@/components/navbar-admin.vue'
import SidebarAdmin from '@/components/sidebar-admin.vue'
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.body {
  flex: 1;
  display: flex;
}

.content {
  flex: 1;
  padding: 20px;
  background: #f8f9fa;
  overflow-y: auto;
}
</style>
