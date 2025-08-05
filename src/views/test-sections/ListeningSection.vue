<template>
  <div class="section-view">
    <div class="section-header">
      <h1>Listening Section</h1>
      <div class="timer" :class="{ 'low-time': timeLeft < 300 }">
        <i class="fa-solid fa-clock"></i> Time Left: {{ formattedTimeLeft }}
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">Loading Section...</div>

    <div v-else-if="sectionData" class="test-content">
      <!-- Start Button Overlay -->
      <div v-if="!hasStarted" class="start-overlay">
        <h2>Instructions</h2>
        <p>
          This is the Listening section. The audio will begin playing
          automatically and will play only once. You will have 40 minutes to
          complete this section.
        </p>
        <button @click="startTest" class="btn-primary start-btn">
          <i class="fa-solid fa-play"></i> I am ready to begin
        </button>
      </div>

      <!-- Main Test Content (shown after start) -->
      <div v-show="hasStarted">
        <audio
          ref="audioPlayer"
          :src="sectionData.content.audioUrl"
          controlslist="nodownload"
        ></audio>

        <BlockRenderer
          v-for="block in sectionData.content.blocks"
          :key="block.id"
          :block="block"
          @answer-update="updateUserAnswer"
        />
        <button
          @click="confirmAndSubmit"
          class="btn-primary submit-btn"
          :disabled="isSubmitting"
        >
          {{
            isSubmitting
              ? "Submitting..."
              : "Submit Reading Section and Continue"
          }}
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
  name: "ListeningView",
  components: { BlockRenderer },
  mixins: [testTimerMixin], // Use the timer logic
  props: ["attemptId"],
  data() {
    return {
      sectionData: null,
      isLoading: false,
      isSubmitting: false,
      userAnswers: {},
      hasStarted: false, // Controls the start overlay
    };
  },
  methods: {
    async fetchSectionContent() {
      this.isLoading = true;
      try {
        const response = await api.getSectionContent(
          this.attemptId,
          "LISTENING"
        );
        this.sectionData = response.data;
        console.log("Data received by TestRoom:", response.data);
      } catch (err) {
        alert(
          "Could not load the Listening section. You may not have permission, or the test has ended."
        );
        this.$router.push("/dashboard"); // Redirect on error
      } finally {
        this.isLoading = false;
      }
    },

    async startTest() {
      this.hasStarted = true;

      await this.$nextTick();

      const player = this.$refs.audioPlayer;
      if (player) {
        try {
          await player.play();

          this.startTimer(2400, this.autoSubmit);
          console.log("Audio playback started successfully.");
        } catch (error) {
          console.error("Audio playback failed:", error);
          alert(
            "Could not start the audio. Please check your browser permissions and try again."
          );

          this.hasStarted = false;
        }
      }
    },

    updateUserAnswer({ questionId, answer }) {
      this.userAnswers[questionId] = answer;
    },

    async autoSubmit() {
      if (this.isSubmitting) return;
      this.isSubmitting = true;

      if (this.timer) clearInterval(this.timer);

      if (this.timeLeft === 0) {
        alert(
          "Time is up for the Listening section. Your answers have been saved. You will now proceed to the Reading section."
        );
      }

      try {
        await api.submitSectionAnswers(
          this.attemptId,
          "LISTENING",
          this.userAnswers
        );
        this.$router.push({
          name: "ReadingSection",
          params: { attemptId: this.attemptId },
        });
      } catch (err) {
        alert("Failed to submit listening answers.");
        this.$router.push("/dashboard");
      } finally {
        this.isSubmitting = false;
      }
    },

    confirmAndSubmit() {
      if (
        confirm(
          "Are you sure you want to submit the Listening section? You cannot return to it later."
        )
      ) {
        this.autoSubmit();
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
.timer.low-time {
  background-color: #ef4444;
}
.start-overlay {
  text-align: center;
  padding: 60px 30px;
  background-color: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
}
.start-overlay h2 {
  margin-top: 0;
}
.start-overlay p {
  font-size: 1.1em;
  color: #4b5563;
  margin-bottom: 30px;
}
.start-btn {
  font-size: 1.2em;
  padding: 12px 25px;
}
.submit-btn {
  margin-top: 30px;
  width: 100%;
}
audio {
  width: 100%;
  margin-bottom: 20px;
}
</style>
