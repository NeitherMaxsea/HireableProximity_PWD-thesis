<template>
  <div class="layout">

    <!-- SIDEBAR -->
    <aside class="sidebar-area">
      <component :is="Sidebar" />
    </aside>

    <!-- MAIN CONTENT -->
    <div class="main-content">

      <!-- TOP NAVBAR -->
      <Navbar />

      <!-- PAGE CONTENT -->
      <main class="page-content">
        <transition name="page-fade" mode="out-in">
          <router-view />
        </transition>
      </main>

    </div>

  </div>
</template>

<script setup>
import { computed } from "vue"
import { useRoute } from "vue-router"
import SidebarEmployer from "@/components/sb-employer.vue"
import SidebarOperator from "@/components/sb-employer-operator.vue"
import SidebarFinance from "@/components/sb-employer-finance.vue"
import Navbar from "@/components/nv-employer.vue"

const route = useRoute()
const userRole = String(localStorage.getItem("userRole") || "").trim().toLowerCase()
const isOperationRoute = computed(() => route.path.startsWith("/employer/operation"))
const isFinanceRoute = computed(() => route.path.startsWith("/employer/finance"))
const Sidebar = computed(() => {
  if (isOperationRoute.value || userRole === "operation") return SidebarOperator
  if (isFinanceRoute.value || userRole === "finance") return SidebarFinance
  return SidebarEmployer
})
</script>

<style scoped>
/* ROOT */
.layout {
  display: grid;
  grid-template-columns: auto 1fr;
  height: 100vh;
  overflow: hidden;
}

.sidebar-area {
  height: 100vh;
  min-height: 0;
  overflow: hidden;
}



/* MAIN CONTENT */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: #f5f7fb;
  overflow: hidden;
}

/* PAGE CONTENT */
.page-content {
  flex: 1;
  min-height: 0;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* FADE */
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

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }
}



</style>
