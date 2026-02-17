<template>
  <section class="finance-page">
    <div class="header">
      <h2>Finance Dashboard</h2>
      <p>Snapshot of payroll, hiring budget and approval workload.</p>
    </div>

    <div class="cards">
      <div class="card">
        <span>Monthly Payroll</span>
        <strong>$125,400.00</strong>
      </div>
      <div class="card">
        <span>Pending Job Approvals</span>
        <strong>3</strong>
      </div>
      <div class="card">
        <span>Budget Utilization (Q1)</span>
        <strong>72.4%</strong>
      </div>
    </div>

    <div class="panel">
      <h3>Recent Expense Entries</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Reference</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in expenses" :key="item.reference">
            <td>{{ item.date }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.reference }}</td>
            <td>{{ item.amount }}</td>
            <td>
              <span class="badge" :class="item.status.toLowerCase()">{{ item.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
const expenses = [
  {
    date: "2026-02-10",
    category: "Training Accommodation",
    reference: "EXP-5501",
    amount: "$820.00",
    status: "Posted"
  },
  {
    date: "2026-02-11",
    category: "Assistive Equipment",
    reference: "EXP-5502",
    amount: "$1,460.00",
    status: "Review"
  },
  {
    date: "2026-02-13",
    category: "Payroll Adjustment",
    reference: "EXP-5503",
    amount: "$510.00",
    status: "Posted"
  }
]
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
  color: #64748b;
  margin: 6px 0 0;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.card {
  background: #fff;
  border: 1px solid #dbe3f4;
  border-radius: 12px;
  padding: 14px;
}

.card span {
  font-size: 12px;
  color: #64748b;
}

.card strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
  font-size: 20px;
}

.panel {
  background: #ffffff;
  border: 1px solid #dbe3f4;
  border-radius: 14px;
  padding: 14px;
}

.panel h3 {
  margin: 0 0 10px;
  color: #0f172a;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px 8px;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
}

th {
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

td {
  font-size: 14px;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}

.badge.posted {
  background: #dcfce7;
  color: #166534;
}

.badge.review {
  background: #fef3c7;
  color: #92400e;
}
</style>
