<template>
  <div class="section-view">
    <div v-if="!sectionData" class="loading-container">Loading Section...</div>

    <div v-else>
      <div v-if="!hasStarted" class="start-overlay">
        <h2>Instructions</h2>
        <p>
          The audio will play only once. You cannot pause or replay it. Click
          below when you are ready to begin.
        </p>
        <button @click="startTest" class="btn-primary start-btn">
          <i class="fa-solid fa-play"></i> Start Listening Section
        </button>
      </div>

      <div v-show="hasStarted">
        <IeltsAudioPlayer
          v-if="sectionData.content.audioUrl"
          ref="audioPlayerRef"
          :src="sectionData.content.audioUrl"
          @ended="onAudioEnded"
        />

        <BlockRenderer
          v-for="block in sectionData.content.blocks"
          :key="block.id"
          :block="block"
          :user-answers="userAnswers"
          @answer-update="updateUserAnswer"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, nextTick } from "vue";
import api from "../../services/api";
import IeltsAudioPlayer from "../../components/IeltsAudioPlayer.vue";
import BlockRenderer from "../../views/UserTestTaking/BlockRenderer.vue";

const props = defineProps({ attemptId: String });

// --- STATE MANAGEMENT ---
const testState = inject("testState");
const sectionData = ref(null);
const userAnswers = ref({});
const hasStarted = ref(false);
const audioPlayerRef = ref(null);
let observer = null; // For IntersectionObserver

// --- METHODS ---

const startTest = () => {
  hasStarted.value = true;

  if (testState.value && testState.value.startTimer) {
    testState.value.startTimer(2400); // Tell the parent to start a 40-min countdown
  }

  nextTick(() => {
    if (audioPlayerRef.value) {
      audioPlayerRef.value.play();
      console.log("Audio playback initiated.");
    }
  });
};

const onAudioEnded = () => {
  alert(
    "The audio has finished. Please use the remaining time to check your answers."
  );
};

const updateUserAnswer = (answerObject) => {
  const questionId = Object.keys(answerObject)[0];
  userAnswers.value[questionId] = answerObject[questionId];

  if (testState.value) {
    const questionInNav = testState.value.questions.find(
      (q) => q.id === questionId
    );
    if (questionInNav) {
      const answerValue = answerObject[questionId];
      questionInNav.status =
        answerValue && String(answerValue).length > 0
          ? "answered"
          : "unanswered";
    }
  }
};

const setupIntersectionObserver = () => {
  const options = {
    root: document.querySelector(".test-main-content"),
    rootMargin: "-40% 0px -40% 0px",
    threshold: 0,
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && testState.value) {
        testState.value.currentQuestionInView = entry.target.id;
      }
    });
  }, options);

  // Use nextTick to ensure elements are in the DOM before observing
  nextTick(() => {
    testState.value.questions.forEach((q) => {
      const el = document.getElementById(q.id);
      if (el) observer.observe(el);
    });
  });
};

// --- LIFECYCLE HOOKS ---

onMounted(async () => {
  try {
    const response = await api.getSectionContent(props.attemptId, "LISTENING");
    sectionData.value = response.data;

    if (testState.value && sectionData.value) {
      testState.value.sectionTitle = "Listening";

      let questionCounter = 1;
      testState.value.questions = sectionData.value.content.blocks.flatMap(
        (block) => {
          // Find all unique question placeholders like {{q1}}, {{q2}}, etc.
          const placeholders =
            JSON.stringify(block).match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
          const questionIds = [
            ...new Set(placeholders.map((p) => p.replace(/\{|\}/g, ""))),
          ];

          // Map them to objects for the nav bar
          return questionIds.map((id) => ({
            id: id,
            displayId: questionCounter++,
            status: "unanswered",
            isFlagged: false,
            blockId: block.id, // So we can scroll to the parent block
          }));
        }
      );

      // Update scrollToQuestion function to scroll to the parent block
      testState.value.scrollToQuestion = (questionId) => {
        const question = testState.value.questions.find(
          (q) => q.id === questionId
        );
        if (question && question.blockId) {
          const element = document.getElementById(question.blockId);
          if (element)
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };

      setupIntersectionObserver();
    }
  } catch (err) {
    console.error("Failed to load listening section:", err);
    alert("Could not load the listening section.");
  }
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
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
