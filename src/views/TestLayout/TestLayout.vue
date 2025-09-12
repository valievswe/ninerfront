<template>
  <div class="test-container">
    <header class="test-header">
      <div class="header-content">
        <h1>IELTS Mock Test: {{ sharedState.sectionTitle }}</h1>
        <div class="timer" :class="{ 'low-time': sharedState.timeLeft < 300 }">
          <i class="fa-solid fa-clock"></i>
          <span>Time Left: {{ formattedTimeLeft }}</span>
        </div>
      </div>
    </header>

    <main class="test-main-content">
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="$route.path" />
      </router-view>
    </main>

    <footer class="test-footer">
      <div class="question-nav-palette">
        <button
          v-for="question in sharedState.questions"
          :key="question.id"
          class="question-nav-btn"
          :class="{
            'is-active': sharedState.currentQuestionInView === question.id,
            'is-answered': question.status === 'answered',
            'is-flagged': question.isFlagged,
          }"
          @click="handleQuestionNav(question.id)"
        >
          {{ question.displayId }}
          <i v-if="question.isFlagged" class="fa-solid fa-flag flag-icon"></i>
        </button>
      </div>
      <div class="footer-controls">
        <button class="btn-secondary" @click="showHelpModal">Help</button>
        <button class="btn-primary" @click="goToNextSection()">
          Continue to Next Section
        </button>
      </div>
    </footer>

    <!-- Help Modal Overlay -->
    <div
      v-if="isHelpModalVisible"
      class="modal-overlay"
      @click="closeHelpModal"
    >
      <div class="modal-content" @click.stop>
        <h2>Test Interface Help</h2>
        <p>This guide explains how to navigate and use the test interface.</p>
        <ul>
          <li>
            <strong>Timer:</strong> Shows remaining time. The test auto-submits
            when time runs out.
          </li>
          <li>
            <strong>Question Palette:</strong> Navigate to any question.
            Answered questions are marked.
          </li>
          <li>
            <strong>Continue:</strong> Saves your answers and moves to the next
            section.
          </li>
        </ul>
        <button class="btn-primary" @click="closeHelpModal">Close Help</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, computed, watch, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../../services/api";

const route = useRoute();
const router = useRouter();

// =================================================================
//  CENTRALIZED ANSWER STORE
// =================================================================
const allUserAnswers = ref({
  LISTENING: {},
  READING: {},
  WRITING: { task1: "", task2: "" }, // Pre-initialize writing object
});

// Provide this entire reactive object to all children
provide("allUserAnswers", allUserAnswers);

// --- STATE SHARED WITH CHILD COMPONENTS (for UI control) ---
const sharedState = ref({
  sectionTitle: "",
  timeLeft: 0,
  questions: [],
  currentQuestionInView: null,
  startTimer: () => {},
  scrollToQuestion: () => {},
});
provide("testState", sharedState);

// --- LOCAL STATE & HELP MODAL ---
const isHelpModalVisible = ref(false);
let timerId = null;
const showHelpModal = () => {
  isHelpModalVisible.value = true;
};
const closeHelpModal = () => {
  isHelpModalVisible.value = false;
};
// --- TIMER LOGIC ---
const formattedTimeLeft = computed(() => {
  const timeLeft = sharedState.value.timeLeft;
  if (timeLeft <= 0) return "00:00";
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
});

const startTimer = (durationInSeconds) => {
  if (timerId) clearInterval(timerId);
  sharedState.value.timeLeft = durationInSeconds;
  timerId = setInterval(() => {
    if (sharedState.value.timeLeft > 0) {
      sharedState.value.timeLeft--;
    } else {
      clearInterval(timerId);
      alert("Time's up for this section!");
      goToNextSection(true); // Auto-advance when time is up
    }
  }, 1000);
};

// --- NAVIGATION AND SUBMISSION LOGIC (CORRECTED) ---
const handleQuestionNav = (questionId) => {
  sharedState.value.scrollToQuestion(questionId);
};

const finishTest = async () => {
  try {
    await api.finishTestAttempt(route.params.attemptId);
    alert("Congratulations! You have completed the test.");
    router.push("/dashboard");
  } catch (err) {
    alert("There was an error finalizing your test.");
    console.error(err);
  }
};

const goToNextSection = (isAutoAdvance = false) => {
  const sectionOrder = ["Listening", "Reading", "Writing"];
  const currentSectionName = route.name.replace("Section", "");
  const currentIndex = sectionOrder.indexOf(currentSectionName);

  const proceed = (nextAction) => {
    const sectionType = currentSectionName.toUpperCase();
    // Get answers directly from our centralized, reliable store
    const answersToSubmit = allUserAnswers.value[sectionType];

    api
      .submitSectionAnswers(
        route.params.attemptId,
        sectionType,
        answersToSubmit
      )
      .then(() => {
        console.log(`Successfully submitted answers for ${sectionType}`);
        nextAction();
      })
      .catch((err) => {
        console.error(`Failed to submit answers for ${sectionType}`, err);
        alert("Could not save your progress. Please check your connection.");
      });
  };

  if (currentIndex < sectionOrder.length - 1) {
    const nextSectionName = sectionOrder[currentIndex + 1];
    if (
      isAutoAdvance ||
      confirm(
        `Submit ${currentSectionName} and continue to ${nextSectionName}?`
      )
    ) {
      proceed(() => router.push({ name: `${nextSectionName}Section` }));
    }
  } else {
    // This is the final section (Writing)
    if (
      isAutoAdvance ||
      confirm("Are you sure you want to finish and submit your entire test?")
    ) {
      // We still call 'proceed' to save the final section's answers.
      // The 'nextAction' we give it is the 'finishTest' function.
      proceed(() => finishTest());
    }
  }
};

// --- ROUTE CHANGE WATCHER & CLEANUP ---
watch(
  () => route.path,
  () => {
    if (timerId) clearInterval(timerId);
    sharedState.value = {
      sectionTitle: "",
      timeLeft: 0,
      questions: [],
      currentQuestionInView: null,
      startTimer: startTimer,
      scrollToQuestion: () => {},
      // No longer need provideAnswers here
    };
  },
  { immediate: true }
);

onUnmounted(() => {
  if (timerId) clearInterval(timerId);
});
</script>
<style scoped>
/* Your existing styles are correct */
.test-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #f0f2f5;
}
.test-header {
  background-color: #333;
  color: white;
  padding: 0 2rem;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}
.header-content h1 {
  font-size: 1.2rem;
  margin: 0;
}
.timer {
  font-size: 1.3rem;
  font-weight: bold;
  font-family: monospace;
  background-color: #555;
  padding: 8px 16px;
  border-radius: 4px;
}
.timer.low-time {
  background-color: #d93025;
}
.test-main-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
}
.test-footer {
  background-color: #fff;
  border-top: 1px solid #ccc;
  padding: 10px 20px;
  flex-shrink: 0;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.question-nav-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-width: 70%;
}
.question-nav-btn {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 40px;
  height: 35px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  position: relative;
}
.question-nav-btn:hover {
  background-color: #ddd;
  border-color: #999;
}
.question-nav-btn.is-answered {
  border-color: #333;
}
.question-nav-btn.is-active {
  background-color: #007bff;
  color: white;
  border-color: #0056b3;
}
.flag-icon {
  position: absolute;
  top: -5px;
  right: -5px;
  color: #d93025;
  font-size: 0.8rem;
  background: white;
  border-radius: 50%;
  padding: 2px;
}
.footer-controls button {
  margin-left: 10px;
}

/* Help Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}
.modal-content {
  background-color: white;
  padding: 30px 40px;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
}
.modal-content h2 {
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}
.modal-content ul {
  list-style-type: none;
  padding: 0;
}
.modal-content li {
  margin-bottom: 15px;
  line-height: 1.6;
}
.modal-content button {
  margin-top: 20px;
  width: 100%;
}
</style>
