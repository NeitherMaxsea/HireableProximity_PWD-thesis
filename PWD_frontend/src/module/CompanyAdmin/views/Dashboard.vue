<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h2>Company Admin Dashboard</h2>
        <p>Manage your company team and role-based accounts.</p>
      </div>
    </div>

    <div class="cards">
      <div class="card">
        <span class="label">Company</span>
        <strong>{{ companyName }}</strong>
      </div>
      <div class="card">
        <span class="label">Company ID</span>
        <strong>{{ companyId || "-" }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup>
const companyName = localStorage.getItem("companyName") || "My Company"
const companyId = localStorage.getItem("companyId") || ""
</script>

<style scoped>
.page {
  padding: 4px;
}

.page-header {
  margin-bottom: 16px;
}

.page h2 {
  margin: 0;
  color: #111827;
}

.page p {
  color: #64748b;
  margin: 8px 0 18px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.card strong {
  display: block;
  margin-top: 8px;
  color: #111827;
  font-size: 18px;
}
</style>
