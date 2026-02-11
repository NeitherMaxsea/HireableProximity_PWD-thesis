<template>
  <section class="page">
    <h2>Company Admin Dashboard</h2>
    <p>Manage your company team and role-based accounts.</p>

    <div class="cards">
      <div class="card">
        <span>Company</span>
        <strong>{{ companyName }}</strong>
      </div>
      <div class="card">
        <span>Company ID</span>
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
.page h2 {
  margin: 0;
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
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}

.card span {
  font-size: 12px;
  color: #64748b;
}

.card strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
}
</style>
