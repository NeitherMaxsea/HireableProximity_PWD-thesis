<template>
  <div class="layout">
    <aside class="sidebar-area">
      <SidebarCompanyAdmin />
    </aside>

    <div class="main-content">
      <NavbarCompanyAdmin />

      <main class="page-content">
        <transition name="page-fade" mode="out-in">
          <router-view />
        </transition>
      </main>
    </div>
  </div>
</template>

<script setup>
import SidebarCompanyAdmin from "@/components/sb-company-admin.vue"
import NavbarCompanyAdmin from "@/components/nv-company-admin.vue"
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f5f7fb;
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.page-fade-enter-active {
  transition: opacity 0.25s ease;
}

.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
