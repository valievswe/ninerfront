<!-- src/views/TestLayout/TestLayout.vue -->
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
        <button class="btn-secondary">Help</button>
        <button class="btn-primary" @click="goToNextSection()">
          Continue to Next Section
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, provide, computed, watch, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../../services/api"; // Ensure this path is correct

const route = useRoute();
const router = useRouter();

// --- STATE SHARED WITH CHILD COMPONENTS ---
const sharedState = ref({
  sectionTitle: "",
  timeLeft: 0,
  questions: [],
  currentQuestionInView: null,
  startTimer: () => {}, // Placeholder
  // eslint-disable-next-line no-unused-vars
  scrollToQuestion: (questionId) => {}, // Placeholder
});

provide("testState", sharedState);

// --- TIMER LOGIC ---
let timerId = null;

const formattedTimeLeft = computed(() => {
  const timeLeft = sharedState.value.timeLeft;
  if (timeLeft <= 0) return "00:00";
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
});

// This function can be called by child components to start the countdown
const startTimer = (durationInSeconds) => {
  if (timerId) clearInterval(timerId); // Clear any old timer just in case

  sharedState.value.timeLeft = durationInSeconds; // Set the initial time

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

// --- NAVIGATION AND SUBMISSION LOGIC ---

const handleQuestionNav = (questionId) => {
  sharedState.value.scrollToQuestion(questionId);
};

const finishTest = async () => {
  try {
    await api.finishTestAttempt(route.params.attemptId);
    alert("Congratulations! You have completed the test.");
    router.push("/dashboard");
  } catch (err) {
    alert("There was an error submitting your test.");
    console.error(err);
  }
};

const goToNextSection = (isAutoAdvance = false) => {
  const sectionOrder = ["Listening", "Reading", "Writing"];
  const currentSectionName = route.name.replace("Section", "");
  const currentIndex = sectionOrder.indexOf(currentSectionName);

  const proceed = (nextAction) => {
    console.log(`Submitting answers for ${currentSectionName}...`);
    // NOTE: You should add your api.submitSectionAnswers(...) call here
    nextAction();
  };

  if (currentIndex < sectionOrder.length - 1) {
    const nextSectionName = sectionOrder[currentIndex + 1];
    if (
      isAutoAdvance ||
      confirm(
        `Are you sure you want to submit the ${currentSectionName} section and continue to ${nextSectionName}?`
      )
    ) {
      proceed(() => router.push({ name: `${nextSectionName}Section` }));
    }
  } else {
    if (
      isAutoAdvance ||
      confirm("Are you sure you want to finish and submit your entire test?")
    ) {
      proceed(() => finishTest());
    }
  }
};

// --- ROUTE CHANGE WATCHER to reset state ---

watch(
  () => route.path,
  () => {
    if (timerId) clearInterval(timerId); // Stop the timer when navigating away

    sharedState.value = {
      sectionTitle: "",
      timeLeft: 0,
      questions: [],
      currentQuestionInView: null,
      startTimer: startTimer, // Provide the startTimer function to the new section
      // eslint-disable-next-line no-unused-vars
      scrollToQuestion: (questionId) => {},
    };
  },
  { immediate: true }
);

// Cleanup timer on component unmount (e.g., user navigates away from the test completely)
onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId);
  }
});
</script>

<style scoped>
/* Your styles are unchanged and correct */
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
</style>
