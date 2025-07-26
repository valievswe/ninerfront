<template>
  <div class="test-room-view">
    <h1>IELTS Mock Test</h1>
    <div v-if="isLoading">Loading test content...</div>
    <div v-else>
      <!-- Display Sections -->
      <div
        v-for="section in sections"
        :key="section.id"
        class="section-container"
      >
        <h2>{{ section.type }} Section</h2>

        <!-- Listening Section -->
        <div v-if="section.type === 'LISTENING'">
          <p>Listen to the audio and answer the questions below.</p>
          <audio
            :src="section.content.audioUrl"
            controls
            class="test-audio"
          ></audio>
          <div class="questions-list">
            <Question
              v-for="(q, index) in section.content.questions"
              :key="q.id"
              :question="q"
              :question-number="index + 1"
              @answer-selected="updateAnswer('LISTENING', $event)"
            />
          </div>
        </div>

        <!-- Reading Section -->
        <div v-if="section.type === 'READING'">
          <div class="reading-passage">
            <h3>{{ section.content.passageTitle }}</h3>
            <p>{{ section.content.passageText }}</p>
          </div>
          <div class="questions-list">
            <Question
              v-for="(q, index) in section.content.questions"
              :key="q.id"
              :question="q"
              :question-number="index + 1"
              @answer-selected="updateAnswer('READING', $event)"
            />
          </div>
        </div>

        <!-- Writing Section -->
        <div v-if="section.type === 'WRITING'">
          <h3>Task 1</h3>
          <p>{{ section.content.task1.prompt }}</p>
          <img
            v-if="section.content.task1.imageUrl"
            :src="section.content.task1.imageUrl"
            alt="Writing Task 1 Chart"
          />
          <textarea
            v-model="userAnswers.WRITING.task1"
            placeholder="Your answer for Task 1..."
          ></textarea>

          <h3>Task 2</h3>
          <p>{{ section.content.task2.prompt }}</p>
          <textarea
            v-model="userAnswers.WRITING.task2"
            placeholder="Your answer for Task 2..."
          ></textarea>
        </div>
      </div>

      <button @click="submitTest" class="btn-submit">
        Submit Final Answers
      </button>

      <!-- Results Display -->
      <div v-if="results" class="results-container">
        <h2>Your Results</h2>
        <p><strong>Listening Score:</strong> {{ results.listeningScore }}</p>
        <p><strong>Reading Score:</strong> {{ results.readingScore }}</p>
        <p>Your writing will be graded separately.</p>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../services/api";
import Question from "./Question.vue";
export default {
  name: "TestRoomView",
  components: { Question },
  props: ["templateId", "attemptId"], // Received from the router
  data() {
    return {
      sections: [],
      isLoading: false,
      userAnswers: {
        LISTENING: {}, // e.g., { "q_123": "A", "q_456": "Library" }
        READING: {},
        WRITING: { task1: "", task2: "" }, // Specific model for writing
      },
      results: null,
    };
  },
  methods: {
    async fetchSections() {
      this.isLoading = true;
      try {
        const response = await api.getTestSections(this.templateId);
        this.sections = response.data;
      } catch (err) {
        alert("Could not load test content.");
      } finally {
        this.isLoading = false;
      }
    },
    async submitTest() {
      if (
        !confirm(
          "Are you sure you want to submit your test? You cannot make changes after submitting."
        )
      ) {
        return;
      }
      try {
        const response = await api.submitTestAttempt(
          this.attemptId,
          this.userAnswers
        );
        this.results = response.data.results;
        alert("Test submitted successfully! See your results below.");
      } catch (err) {
        alert("Failed to submit test.");
      }
    },
    updateAnswer(sectionType, { questionId, answer }) {
      // This dynamically updates the correct part of the userAnswers object
      this.userAnswers[sectionType][questionId] = answer;
    },
  },
  created() {
    this.fetchSections();
  },
};
</script>

<style scoped>
.test-audio {
  width: 100%;
  margin-bottom: 20px;
}
.reading-passage {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  line-height: 1.6;
}
.questions-list {
  margin-top: 20px;
}
.section-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
}
audio,
img {
  max-width: 100%;
  margin-top: 15px;
}
textarea {
  width: 100%;
  min-height: 200px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-top: 10px;
}
.btn-submit {
  width: 100%;
  padding: 15px;
  font-size: 18px;
  /* (Add styling similar to btn-primary) */
}
.results-container {
  margin-top: 30px;
  padding: 20px;
  background: #e8f5e9;
  border-left: 5px solid #4caf50;
}
</style>
