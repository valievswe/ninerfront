<template>
  <div class="attempts-list-view">
    <h1>Completed Test Attempts</h1>

    <div v-if="isLoading" class="loading-container">Loading attempts...</div>
    <div v-else-if="attempts.length === 0" class="info-text">
      No users have completed any tests yet.
    </div>

    <div v-else class="attempts-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Test Title</th>
            <th>Completed On</th>
            <th>Scores (L/R)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attempt in attempts" :key="attempt.id">
            <td>{{ attempt.user.firstName }} {{ attempt.user.lastName }}</td>
            <td>{{ attempt.user.email }}</td>
            <td>{{ attempt.user.phoneNumber || "N/A" }}</td>
            <td>{{ attempt.scheduledTest.testTemplate.title }}</td>
            <td>{{ formatDateTime(attempt.completedAt) }}</td>
            <td>
              <span v-if="attempt.results" class="score-display">
                {{ attempt.results.listeningScore }} /
                {{ attempt.results.readingScore }}
              </span>
              <span v-else>N/A</span>
            </td>
            <td>
              <router-link
                :to="{
                  name: 'AttemptDetail',
                  params: { attemptId: attempt.id },
                }"
                class="btn-primary"
              >
                View Details
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from "../../services/api";

export default {
  name: "AttemptsListView",
  data() {
    return {
      attempts: [],
      isLoading: false,
    };
  },
  methods: {
    async fetchAttempts() {
      this.isLoading = true;
      try {
        const response = await api.getAllAttempts();
        this.attempts = response.data;
      } catch (err) {
        alert("Could not fetch test attempts.");
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    formatDateTime(isoString) {
      if (!isoString) return "N/A";
      return new Date(isoString).toLocaleString();
    },
  },
  created() {
    this.fetchAttempts();
  },
};
</script>

<style scoped>
.attempts-list-view {
  max-width: 1200px;
  margin: 20px auto;
}
.attempts-list-view h1 {
  margin-bottom: 30px;
}
.attempts-table-container {
  background: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  border-bottom: 1px solid #eaeaea;
  padding: 12px 15px;
  text-align: left;
}
.data-table th {
  background-color: #f9fafb;
  font-weight: 600;
}
.score-display {
  font-weight: bold;
  font-family: monospace;
}
.btn-primary {
  background-color: #3b82f6;
  color: white;
  padding: 8px 12px;
  border-radius: 5px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}
.loading-container,
.info-text {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
