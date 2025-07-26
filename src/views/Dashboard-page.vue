<template>
  <div class="dashboard-page">
    <div class="content">
      <h1>Dashboard</h1>
      <p>Welcome! You are logged in.</p>
    </div>
  </div>
</template>

<script>
// Your script remains the same
export default {
  name: "DashboardPage",
};
</script>

<style scoped>
.dashboard-page {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 80vh;
}

.content h1 {
  font-size: 48px;
  color: #000;
  margin-bottom: 10px;
}

.content p {
  font-size: 20px;
  color: #555;
}
</style>
