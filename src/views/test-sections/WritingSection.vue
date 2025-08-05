<template>
  <div class="section-view">
    <div class="section-header">
      <h1>Writing Section</h1>
      <div class="timer" :class="{ 'low-time': timeLeft < 300 }">
        <i class="fa-solid fa-clock"></i> Time Left: {{ formattedTimeLeft }}
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">Loading Section...</div>

    <div
      v-else-if="sectionData && sectionData.content.blocks.length > 0"
      class="split-view-container"
    >
      <!-- Left Side: Writing Prompts -->
      <div class="passage-pane">
        <div v-for="block in sectionData.content.blocks" :key="block.id">
          <!-- The BlockRenderer will display the prompts and images -->
          <BlockRenderer :block="block" />
        </div>
      </div>

      <!-- Right Side: Answer Textareas -->
      <div class="questions-pane">
        <h3>Your Answers</h3>
        <div class="writing-answer-box">
          <label>Task 1 Answer</label>
          <textarea v-model="userAnswers.task1" spellcheck="false"></textarea>
        </div>
        <div class="writing-answer-box">
          <label>Task 2 Answer</label>
          <textarea v-model="userAnswers.task2" spellcheck="false"></textarea>
        </div>
        <button @click="confirmAndFinish" class="btn-primary submit-btn">
          Finish & Submit Test
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../../services/api";
import BlockRenderer from "../UserTestTaking/BlockRenderer.vue";
import testTimerMixin from "./TestTime";

export default {
  name: "WritingView",
  components: { BlockRenderer },
  mixins: [testTimerMixin], // Use the timer logic
  props: ["attemptId"],
  data() {
    return {
      sectionData: null,
      isLoading: false,
      isSubmitting: false,

      userAnswers: {
        task1: "",
        task2: "",
      },
    };
  },
  methods: {
    async fetchSectionContent() {
      this.isLoading = true;
      try {
        // Fetch WRITING content
        const response = await api.getSectionContent(this.attemptId, "WRITING");
        this.sectionData = response.data;
        // Start a 60-minute timer (3600 seconds)
        this.startTimer(3600, this.autoFinish);
      } catch (err) {
        alert("Could not load the Writing section.");
        this.$router.push("/dashboard");
      } finally {
        this.isLoading = false;
      }
    },

    updateUserAnswer({ questionId, answer }) {
      if (questionId in this.userAnswers) {
        this.userAnswers[questionId] = answer;
      }
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

      try {
        await api.submitSectionAnswers(
          this.attemptId,
          "WRITING",
          this.userAnswers
        );
        await api.finishTestAttempt(this.attemptId);

        alert("Congratulations! You have completed the test.");
        this.$router.push("/dashboard");
      } catch (err) {
        alert("Failed to finish the test.");
      } finally {
        this.isSubmitting = false;
      }
    },
  },
  created() {
    this.fetchSectionContent();
  },
};
</script>

<style scoped>
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
.split-view-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  height: calc(100vh - 150px);
}
.passage-pane,
.questions-pane {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
}
.questions-pane h3 {
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.writing-answer-box {
  margin-bottom: 20px;
}
.writing-answer-box label {
  display: block;
  font-weight: bold;
  margin-bottom: 10px;
}
.writing-answer-box textarea {
  width: 100%;
  min-height: 250px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.submit-btn {
  margin-top: 20px;
  width: 100%;
}
</style>
