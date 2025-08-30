<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1>Welcome, {{ userFirstName || "User" }}!</h1>
      <p>This is your central dashboard. What would you like to do today?</p>
    </div>
    <div v-if="isAdmin" class="dashboard-grid">
      <!-- Admin Quick Actions -->
      <div class="dashboard-card action-card">
        <h3>Quick Actions</h3>
        <div class="action-buttons">
          <router-link to="/admin" class="btn-dashboard">
            <i class="fa-solid fa-users"></i>
            <span>User Management</span>
          </router-link>
          <router-link to="/admin/tests/builder" class="btn-dashboard">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>Launch Test Builder</span>
          </router-link>
          <router-link to="/admin/attempts" class="btn-dashboard">
            <i class="fa-solid fa-square-poll-vertical"></i>
            <span>View Results</span>
          </router-link>
        </div>
      </div>
      <!-- Admin Stats-->
      <div class="dashboard-card stats-card">
        <h3>System Stats</h3>
        <div v-if="isLoadingStats" class="info-text">Loading stats...</div>

        <div v-else-if="stats" class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ stats.totalUsers }}</span>
            <span class="stat-label">Total Users</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.totalTestTemplates }}</span>
            <span class="stat-label">Tests Created</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.totalTestAttempts }}</span>
            <span class="stat-label">Tests Completed</span>
          </div>
        </div>

        <div v-else class="info-text">Could not load system statistics.</div>
      </div>
    </div>

    <!-- === REGULAR USER DASHBOARD VIEW === -->
    <div v-else class="dashboard-grid">
      <!-- User Quick Action -->
      <div class="dashboard-card action-card primary-action">
        <h3>Ready for your test?</h3>
        <p>Take a full-length mock test under exam conditions.</p>
        <router-link to="/tests" class="btn-primary start-test-btn">
          <i class="fa-solid fa-play"></i> Go to Available Tests
        </router-link>
      </div>
      <!-- User Past Results (placeholder for now) -->
      <div class="dashboard-card">
        <h3>Your Past Attempts</h3>
        <div class="info-text">
          Your completed test results will appear here.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { store } from "../store/store";
import api from "../services/api";

export default {
  name: "DashboardPage",
  data() {
    return {
      // Initialize stats to null or defaults
      stats: null,
      isLoadingStats: false,
    };
  },
  computed: {
    isAdmin() {
      return store.user?.roles?.includes("ADMIN") || false;
    },
    userFirstName() {
      return store.user?.firstName;
    },
  },
  methods: {
    async fetchDashboardStats() {
      this.isLoadingStats = true;
      try {
        const response = await api.getDashboardStats();
        this.stats = response.data;
        console.log("Fetched dashboard stats:", this.stats);
      } catch (err) {
        // Handle error (e.g., if API call fails for non-admin user)
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        this.isLoadingStats = false;
      }
    },
  },
  created() {
    // Only fetch stats if the logged-in user is an admin
    if (this.isAdmin) {
      this.fetchDashboardStats();
    }
  },
};
</script>

<style scoped>
.dashboard-page {
  max-width: 1200px;
  margin: 20px auto;
}
.dashboard-header {
  text-align: center;
  margin-bottom: 40px;
}
.dashboard-header h1 {
  font-size: 2.5rem;
  color: #111827;
}
.dashboard-header p {
  font-size: 1.1rem;
  color: #4b5563;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
}

.dashboard-card {
  background: #ffffff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.dashboard-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
}

/* Admin Card Styles */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.btn-dashboard {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  text-decoration: none;
  color: #374151;
  font-weight: 500;
  transition: all 0.2s ease;
}
.btn-dashboard:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
  color: #1d4ed8;
}
.btn-dashboard i {
  font-size: 1.2em;
  width: 20px;
  text-align: center;
}
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  text-align: center;
}
.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
}
.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
}

/* User Card Styles */
.primary-action {
  background-color: #1f2937;
  color: white;
  text-align: center;
}
.primary-action h3 {
  color: white;
  border-bottom-color: #4b5563;
}
.primary-action p {
  font-size: 1.1em;
  margin-bottom: 25px;
}
.start-test-btn {
  display: inline-block;
  padding: 12px 25px;
  font-size: 1.1em;
  background-color: #3b82f6;
  /* Add other btn-primary styles if needed */
}
.info-text {
  text-align: center;
  color: #666;
  padding: 20px;
}
</style>
