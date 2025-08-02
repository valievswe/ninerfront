<template>
  <div class="section-view">
    <div class="section-header">
      <h1>Writing Section</h1>
      <div class="timer" :class="{ 'low-time': timeLeft < 300 }">
        <i class="fa-solid fa-clock"></i> Time Left: {{ formattedTimeLeft }}
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">Loading Section...</div>

    <div v-else-if="sectionData" class="test-content">
      <!-- The BlockRenderer will handle the display of Task 1 and Task 2 -->
      <BlockRenderer
        v-for="block in sectionData.content.blocks"
        :key="block.id"
        :block="block"
        @answer-update="updateUserAnswer"
      />

      <button @click="confirmAndFinish" class="btn-primary submit-btn">
        Finish & Submit Entire Test
      </button>
    </div>
  </div>
</template>

<script>
import api from "../../services/api";
import BlockRenderer from "../../views/UserTestTaking/BlockRenderer.vue";
import testTimerMixin from "./TestTime";

export default {
  name: "WritingView", // <-- CHANGED
  components: { BlockRenderer },
  mixins: [testTimerMixin], // Use the timer logic
  props: ["attemptId"],
  data() {
    return {
      sectionData: null,
      isLoading: false,
      isSubmitting: false,
      userAnswers: {}, // Will hold { task1: '...', task2: '...' }
    };
  },
  methods: {
    async fetchSectionContent() {
      this.isLoading = true;
      try {
        // Fetch WRITING content
        const response = await api.getSectionContent(this.attemptId, "WRITING"); // <-- CHANGED
        this.sectionData = response.data;
        // Start a 60-minute timer (3600 seconds)
        this.startTimer(3600, this.autoFinish); // <-- CHANGED DURATION AND CALLBACK
      } catch (err) {
        alert("Could not load the Writing section.");
        this.$router.push("/dashboard");
      } finally {
        this.isLoading = false;
      }
    },

    updateUserAnswer({ questionId, answer }) {
      // For the writing block, questionId will be 'task1_prompt' etc.
      // We will handle this in the BlockRenderer to emit 'task1' and 'task2'
      this.userAnswers[questionId] = answer;
    },

    confirmAndFinish() {
      if (
        confirm(
          "This is the final section. Are you sure you want to finish and submit your entire test? This cannot be undone."
        )
      ) {
        this.autoFinish();
      }
    },

    async autoFinish() {
      if (this.isSubmitting) return;
      this.isSubmitting = true;

      if (this.timer) clearInterval(this.timer);

      if (this.timeLeft === 0) {
        alert("Time is up! Your test will now be submitted automatically.");
      }

      try {
        // Step 1: Submit the final section's answers
        await api.submitSectionAnswers(
          this.attemptId,
          "WRITING",
          this.userAnswers
        ); // <-- CHANGED

        // Step 2: Call the endpoint to finalize and grade the whole test
        await api.finishTestAttempt(this.attemptId);

        alert(
          "Congratulations! You have completed the test. Your results will be available to the administrator."
        );
        this.$router.push("/dashboard"); // <-- Redirect to dashboard
      } catch (err) {
        alert("There was an error finishing the test.");
        this.$router.push("/dashboard");
      }
    },
  },
  created() {
    this.fetchSectionContent();
  },
};
</script>

<style scoped>
/* Scoped styles from other section views are generally fine here */
.section-view {
  max-width: 900px;
  margin: 20px auto;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 10px;
  z-index: 100;
}
.timer {
  font-size: 1.5em;
  font-weight: bold;
  background-color: #1f2937;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  font-family: monospace;
}
.submit-btn {
  margin-top: 20px;
  background-color: #16a34a; /* Green for the final submit button */
}
</style>
