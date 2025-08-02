<template>
  <div class="available-tests-view">
    <h1>Available Mock Tests</h1>
    <div v-if="isLoading">Loading tests...</div>
    <div v-else-if="availableTests.length === 0">
      No tests are currently available. Please check back later.
    </div>
    <div v-else class="test-list">
      <div v-for="test in availableTests" :key="test.id" class="test-card">
        <h2>{{ test.testTemplate.title }}</h2>
        <p>{{ test.testTemplate.description }}</p>
        <button @click="startTest(test)" class="btn-primary">Start Test</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../services/api";

export default {
  name: "AvailableTestsView",
  data() {
    return {
      availableTests: [],
      isLoading: false,
    };
  },
  methods: {
    async fetchAvailableTests() {
      this.isLoading = true;
      try {
        const response = await api.getAvailableTests();
        this.availableTests = response.data;
      } catch (err) {
        if (err.response?.status !== 403) {
          alert("Could not fetch available tests.");
        }
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    // -- / UPDATED METHOD ---
    async startTest(test) {
      // Ask for confirmation before starting
      if (
        !confirm(
          `Are you sure you want to start the test: "${test.testTemplate.title}"? Once started, the timer will begin.`
        )
      ) {
        return;
      }

      try {
        // 1. Call the API to create the TestAttempt record in the database
        const response = await api.startTestAttempt(test.id);
        const attemptId = response.data.id;

        this.$router.push({ name: "ListeningSection", params: { attemptId } });
      } catch (err) {
        alert(
          "Failed to start the test. You may have already started this attempt."
        );
        console.error(err);
      }
    },
  },
  created() {
    this.fetchAvailableTests();
  },
};
</script>

<style scoped>
.test-list {
  display: grid;
  gap: 20px;
}
.test-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
