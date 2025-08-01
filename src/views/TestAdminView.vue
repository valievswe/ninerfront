<template>
  <div class="test-admin-view">
    <h1>Test Management Dashboard</h1>

    <div class="dashboard-grid">
      <!-- Card 1: Link to the Test Builder -->
      <div class="dashboard-card">
        <h2>Create or Edit a Test</h2>
        <p>
          Use the Test Builder to create new test templates from scratch or to
          edit the content of existing ones.
        </p>
        <router-link to="/admin/tests/builder" class="btn-primary">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Launch Test Builder
        </router-link>
      </div>

      <!-- Card 2: View Existing Templates & Schedule -->
      <div class="dashboard-card">
        <h2>Existing Templates & Scheduling</h2>

        <div v-if="isLoadingTemplates" class="loading-text">
          Loading templates...
        </div>
        <div v-else-if="templates.length === 0" class="info-text">
          No test templates have been created yet.
        </div>
        <div v-else>
          <!-- List of existing templates with delete button -->
          <div
            v-for="template in templates"
            :key="template.id"
            class="template-item"
          >
            <div class="template-info">
              <strong>{{ template.title }}</strong>
              <span
                >(ID: <code>{{ template.id }}</code
                >)</span
              >
            </div>
            <div class="template-actions">
              <!-- This is the new Edit button -->
              <router-link
                :to="{
                  name: 'TestBuilder',
                  params: { templateId: template.id },
                }"
                class="btn-edit"
                title="Edit Template"
              >
                <i class="fa-solid fa-pencil"></i>
              </router-link>
              <!-- This is your existing Delete button -->
              <button
                @click.stop="handleDeleteTemplate(template)"
                class="btn-delete"
                title="Delete Template"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Scheduling Form -->
        <form @submit.prevent="handleScheduleTest" class="schedule-form">
          <h3>Schedule a Test</h3>
          <div class="form-group">
            <label>Test Template ID</label>
            <input
              v-model="schedule.testTemplateId"
              type="text"
              placeholder="Copy ID from list above"
              required
            />
          </div>
          <div class="form-group-inline">
            <div class="form-group">
              <label>Start Time</label>
              <input
                v-model="schedule.startTime"
                type="datetime-local"
                required
              />
            </div>
            <div class="form-group">
              <label>End Time</label>
              <input
                v-model="schedule.endTime"
                type="datetime-local"
                required
              />
            </div>
          </div>
          <button type="submit" class="btn-primary">Schedule Test</button>
        </form>
      </div>

      <!-- Card 3: Scheduled Test Log -->
      <div class="dashboard-card scheduled-list-card">
        <h2>Scheduled Test Log</h2>
        <div v-if="isLoadingSchedules" class="loading-text">
          Loading scheduled tests...
        </div>
        <div v-else-if="scheduledTests.length === 0" class="info-text">
          No tests have been scheduled yet.
        </div>
        <div v-else class="scheduled-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Test Title</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="test in scheduledTests" :key="test.id">
                <td>{{ test.testTemplate.title }}</td>
                <td>{{ formatDateTime(test.startTime) }}</td>
                <td>{{ formatDateTime(test.endTime) }}</td>
                <td>
                  <span v-if="test.isActive" class="status-tag active"
                    >Active</span
                  >
                  <span v-else class="status-tag inactive">Inactive</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../services/api";

export default {
  name: "TestAdminView",
  data() {
    return {
      // Data for viewing templates
      templates: [],
      isLoadingTemplates: false,
      // Data for scheduling
      schedule: {
        testTemplateId: "",
        startTime: "",
        endTime: "",
      },
      // Data for viewing schedule log
      scheduledTests: [],
      isLoadingSchedules: false,
    };
  },
  methods: {
    async fetchTemplates() {
      this.isLoadingTemplates = true;
      try {
        const response = await api.getAllTestTemplates();
        this.templates = response.data;
      } catch (err) {
        alert("Failed to fetch templates.");
      } finally {
        this.isLoadingTemplates = false;
      }
    },
    async handleDeleteTemplate(template) {
      if (
        !confirm(
          `Are you sure you want to permanently delete the template "${template.title}"? This cannot be undone.`
        )
      ) {
        return;
      }
      try {
        await api.deleteTestTemplate(template.id);
        alert("Template deleted successfully!");
        this.fetchTemplates(); // Refresh the list
      } catch (err) {
        alert(err.response?.data?.error || "Failed to delete template.");
      }
    },
    async handleScheduleTest() {
      try {
        await api.scheduleTest(this.schedule);
        alert("Test scheduled successfully!");
        this.fetchScheduledTests(); // Refresh the schedule log
        // Reset form
        this.schedule.testTemplateId = "";
        this.schedule.startTime = "";
        this.schedule.endTime = "";
      } catch (err) {
        alert("Failed to schedule test.");
      }
    },
    async fetchScheduledTests() {
      this.isLoadingSchedules = true;
      try {
        const response = await api.getAllScheduledTests();
        this.scheduledTests = response.data;
      } catch (err) {
        alert("Failed to fetch scheduled tests.");
      } finally {
        this.isLoadingSchedules = false;
      }
    },
    formatDateTime(isoString) {
      if (!isoString) return "N/A";
      const date = new Date(isoString);
      return date.toLocaleString();
    },
  },
  created() {
    this.fetchTemplates();
    this.fetchScheduledTests();
  },
};
</script>

<style scoped>
.test-admin-view h1 {
  margin-bottom: 30px;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 25px;
}
.dashboard-card {
  background: #ffffff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.dashboard-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.form-group-inline {
  display: flex;
  gap: 15px;
}
.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9f9f9;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 10px;
}
.template-info span {
  font-size: 14px;
  color: #666;
  margin-left: 10px;
}
.btn-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: #ffbb00;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}
.btn-edit:hover {
  background-color: #ffe6003e;
}

.btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: #ef4444;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}
.btn-delete:hover {
  background-color: #fee2e2;
}
.schedule-form {
  border-top: 1px dashed #ccc;
  margin-top: 20px;
  padding-top: 20px;
}
.scheduled-list-card {
  grid-column: 1 / -1;
}
.scheduled-table-container {
  max-height: 400px;
  overflow-y: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}
.data-table th,
.data-table td {
  border-bottom: 1px solid #eaeaea;
  padding: 10px 12px;
  text-align: left;
}
.data-table th {
  background-color: #f9f9f9;
  font-weight: 600;
}
.status-tag {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}
.status-tag.active {
  background-color: #1e8e3e;
}
.status-tag.inactive {
  background-color: #6c757d;
}
.loading-text,
.info-text {
  text-align: center;
  color: #666;
  padding: 20px;
}
</style>
