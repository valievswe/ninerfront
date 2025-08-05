<template>
  <div class="section-view">
    <div class="section-header">
      <h1>Reading Section</h1>
      <div class="timer" :class="{ 'low-time': timeLeft < 300 }">
        <i class="fa-solid fa-clock"></i> Time Left: {{ formattedTimeLeft }}
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">Loading Section...</div>

    <div v-else-if="sectionData" class="split-view-container">
      <!-- Left Side: Reading Passage -->
      <div class="passage-pane">
        <div v-if="sectionData.content.passageText" class="reading-passage">
          <h3>Reading Passage</h3>
          <p v-html="formattedPassageText"></p>
        </div>
      </div>

      <!-- Right Side: Questions -->
      <div class="questions-pane">
        <h3>Questions</h3>
        <BlockRenderer
          v-for="block in sectionData.content.blocks"
          :key="block.id"
          :block="block"
          @answer-update="updateUserAnswer"
        />
        <button @click="confirmAndSubmit" class="btn-primary submit-btn">
          Submit Reading & Continue
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../../services/api";
import BlockRenderer from "../../views/UserTestTaking/BlockRenderer.vue";
import testTimerMixin from "./TestTime";

export default {
  name: "ReadingView",
  components: { BlockRenderer },
  mixins: [testTimerMixin], // Use the timer logic
  props: ["attemptId"],
  data() {
    return {
      sectionData: null,
      isLoading: false,
      isSubmitting: false,
      userAnswers: {},
    };
  },
  computed: {
    // A helper to format the passage text to respect line breaks
    formattedPassageText() {
      return this.sectionData.content.passageText.replace(/\n/g, "<br />");
    },
  },
  methods: {
    async fetchSectionContent() {
      this.isLoading = true;
      try {
        // Fetch READING content
        const response = await api.getSectionContent(this.attemptId, "READING");
        this.sectionData = response.data;
        // Start a 60-minute timer (3600 seconds)
        this.startTimer(3600, this.autoSubmit);
      } catch (err) {
        alert("Could not load the Reading section.");
        this.$router.push("/dashboard");
      } finally {
        this.isLoading = false;
      }
    },

    updateUserAnswer({ questionId, answer }) {
      this.userAnswers[questionId] = answer;
    },

    confirmAndSubmit() {
      if (
        confirm(
          "Are you sure you want to submit the Reading section? You cannot return to it."
        )
      ) {
        this.autoSubmit();
      }
    },

    async autoSubmit() {
      if (this.isSubmitting) return;
      this.isSubmitting = true;

      // Stop the timer manually
      if (this.timer) clearInterval(this.timer);

      if (this.timeLeft === 0) {
        alert(
          "Time is up for the Reading section. Your answers will be submitted."
        );
      }

      try {
        await api.submitSectionAnswers(
          this.attemptId,
          "READING",
          this.userAnswers
        );
        this.$router.push({
          name: "WritingSection",
          params: { attemptId: this.attemptId },
        });
      } catch (err) {
        alert("There was an error submitting your answers.");
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
/* Scoped styles from ListeningView.vue are good here, plus some specifics */
.section-view {
  max-width: 90%;
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
.reading-passage {
  background-color: #f9fafb;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 25px;
  line-height: 1.7;
  font-size: 1.05em;
  border: 1px solid #e5e7eb;
}
.reading-passage h3 {
  margin-top: 0;
  color: #111827;
}
.split-view-container {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Two equal columns */
  gap: 30px;
  height: calc(100vh - 150px); /* Full viewport height minus header/padding */
}

.passage-pane,
.questions-pane {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  overflow-y: auto;
}

.passage-pane h3,
.questions-pane h3 {
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.reading-passage {
  line-height: 1.7;
  font-size: 1.05em;
}

.submit-btn {
  margin-top: 20px;
  width: 100%;
}
</style>
