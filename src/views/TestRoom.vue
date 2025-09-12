<template>
  <div class="test-room-view">
    <div v-if="isLoading" class="loading-container">
      <h1>Preparing your test...</h1>
      <p>Please wait a moment.</p>
    </div>

    <div v-else class="test-layout">
      <div class="test-header">
        <h1>IELTS Mock Test</h1>
        <div v-if="listeningTimeLeft > 0" class="timer">
          Time Left: {{ formattedTimeLeft }}
        </div>
      </div>

      <!-- This is the main content area -->
      <div class="test-content-area">
        <!-- Loop through each section (Listening, Reading, Writing) -->
        <div
          v-for="section in sections"
          :key="section.id"
          class="section-container"
        >
          <h2>{{ section.type }} Section</h2>

          <!-- Audio for Listening Section -->
          <audio
            v-if="section.type === 'LISTENING' && section.content.audioUrl"
            ref="audioPlayer"
            :src="section.content.audioUrl"
            controls
            controlslist="nodownload"
            class="test-audio"
            @ended="onAudioEnded(section.id)"
          ></audio>

          <!-- Display Reading Passage -->
          <div
            v-if="section.type === 'READING' && section.content.passageText"
            class="reading-passage"
          >
            <h3>Reading Passage</h3>
            <p
              v-html="section.content.passageText.replace(/\n/g, '<br />')"
            ></p>
          </div>

          <!-- Loop through each "Lego" block and render it -->
          <!-- THIS IS A CRITICAL LINE: Passing the correct slice of userAnswers -->
          <BlockRenderer
            v-for="block in section.content.blocks"
            :key="block.id"
            :block="block"
            :user-answers="userAnswers[section.type]"
            @answer-update="updateUserAnswer(section.type, $event)"
          />
        </div>
      </div>

      <div class="test-footer">
        <button @click="submitTest" class="btn-submit">
          Submit Final Answers
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../services/api";
import BlockRenderer from "./UserTestTaking/BlockRenderer.vue";

export default {
  name: "TestRoomView",
  components: { BlockRenderer },
  props: ["templateId", "attemptId"],
  data() {
    return {
      sections: [],
      isLoading: false,
      // This is the correct initial state for userAnswers
      userAnswers: {
        LISTENING: {},
        READING: {},
        WRITING: { task1: "", task2: "" },
      },
      listeningTimer: null,
      listeningTimeLeft: 0,
    };
  },
  computed: {
    // Computed property to format the time left for display
    formattedTimeLeft() {
      const minutes = Math.floor(this.listeningTimeLeft / 60);
      const seconds = this.listeningTimeLeft % 60;
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}`;
    },
  },
  methods: {
    // This is the final, simplified, and correct version of fetchSections
    async fetchSections() {
      this.isLoading = true;
      try {
        // We need the full template details for the test content.
        // Assuming templateId is passed correctly as a prop.
        const response = await api.getTemplateDetails(this.templateId);

        const correctSectionOrder = ["LISTENING", "READING", "WRITING"];
        this.sections = response.data.sections.sort((a, b) => {
          return (
            correctSectionOrder.indexOf(a.type) -
            correctSectionOrder.indexOf(b.type)
          );
        });

        // The problematic initialization loop has been removed.
        // The component will now rely on its initial data and the child component's events.

        if (this.sections.some((s) => s.type === "LISTENING")) {
          // You might want to get duration from the template data in the future
          this.startListeningTimer(1800); // 30 minutes
        }
      } catch (err) {
        alert("Could not load test content.");
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    // This method correctly receives the event object and updates the state
    updateUserAnswer(sectionType, answerObject) {
      if (sectionType === "WRITING") {
        this.userAnswers.WRITING[answerObject.questionId] = answerObject.answer;
      } else {
        // Merges the new answer (e.g., { 'q5': ['B', 'D'] }) into the correct section
        this.userAnswers[sectionType] = {
          ...this.userAnswers[sectionType],
          ...answerObject,
        };
      }
    },

    // This method correctly sends the final answers to the backend
    async submitTest() {
      if (
        !confirm(
          "Are you sure you want to submit your test? You cannot make changes after submitting."
        )
      ) {
        return;
      }
      try {
        await api.finishTestAttempt(this.attemptId, this.userAnswers);
        alert(
          "Your test has been submitted successfully! Your results will be available soon."
        );
        this.$router.push("/dashboard");
      } catch (err) {
        alert("Failed to submit test.");
        console.error(err);
      }
    },

    // --- Timer and Audio Methods ---
    onAudioEnded(sectionId) {
      console.log(`Audio for section ${sectionId} ended.`);
      if (this.listeningTimer) {
        clearInterval(this.listeningTimer);
        this.listeningTimer = null;
        alert(
          "Listening audio has ended. You have 10 minutes to transfer your answers."
        );
        // Start a 10-minute transfer timer
        this.startListeningTimer(600);
      }
    },

    startListeningTimer(durationInSeconds) {
      if (this.listeningTimer) {
        clearInterval(this.listeningTimer);
      }
      this.listeningTimeLeft = durationInSeconds;
      this.listeningTimer = setInterval(() => {
        if (this.listeningTimeLeft > 0) {
          this.listeningTimeLeft--;
        } else {
          clearInterval(this.listeningTimer);
          this.listeningTimer = null;
          alert("Time's up for this section!");
        }
      }, 1000);
    },
  },
  created() {
    this.fetchSections();
  },
  beforeUnmount() {
    if (this.listeningTimer) {
      clearInterval(this.listeningTimer);
    }
  },
};
</script>

<style scoped>
.test-room-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f4f5;
}
.loading-container {
  text-align: center;
  padding-top: 100px;
}
.test-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 30px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.timer {
  font-size: 1.2rem;
  font-weight: bold;
  font-family: monospace;
}
.test-content-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px 40px;
}
.section-container {
  background-color: #ffffff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}
.section-container h2 {
  margin-top: 0;
}
.reading-passage {
  background-color: #f8fafc;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 25px;
  line-height: 1.7;
}
.test-footer {
  padding: 15px 30px;
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
  text-align: center;
  flex-shrink: 0;
}
.btn-submit {
  padding: 12px 40px;
  font-size: 1.1rem;
  font-weight: bold;
  background-color: #16a34a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn-submit:hover {
  background-color: #15803d;
}
.test-audio {
  width: 100%;
  margin-bottom: 20px;
}
</style>
