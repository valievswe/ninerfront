<template>
  <div class="section-content-wrapper">
    <div v-if="!sectionData" class="loading-container">Loading Section...</div>

    <div v-else class="split-view-container">
      <!-- Left Side: Reading Passage -->
      <div class="passage-pane">
        <div
          v-if="sectionData.content.passageText"
          class="reading-passage"
          v-html="sectionData.content.passageText.replace(/\n/g, '<br />')"
        ></div>
      </div>

      <!-- Right Side: Questions -->
      <div class="questions-pane">
        <BlockRenderer
          v-for="block in sectionData.content.blocks"
          :key="block.id"
          :id="block.id"
          :block="block"
          :user-answers="userAnswers"
          @answer-update="updateUserAnswer"
        />
        <!-- The submit button is now in the parent TestLayout, so it's removed from here -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, nextTick } from "vue";
import api from "../../services/api"; // Adjust path if needed
import BlockRenderer from "../../views/UserTestTaking/BlockRenderer.vue"; // Adjust path if needed

const props = defineProps({ attemptId: String });

// --- STATE MANAGEMENT ---
const testState = inject("testState");
const sectionData = ref(null);
const userAnswers = ref({});
let observer = null; // To hold our IntersectionObserver instance

// --- METHODS ---

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

  nextTick(() => {
    if (sectionData.value && sectionData.value.content.blocks) {
      sectionData.value.content.blocks.forEach((block) => {
        const el = document.getElementById(block.id);
        if (el) observer.observe(el);
      });
    }
  });
};

// --- LIFECYCLE HOOKS ---

onMounted(async () => {
  try {
    const response = await api.getSectionContent(props.attemptId, "READING");
    sectionData.value = response.data;

    if (testState.value && sectionData.value) {
      // 1. Set the title for the header in the parent layout
      testState.value.sectionTitle = "Reading";

      // 2. Automatically start the timer via the parent layout
      if (testState.value.startTimer) {
        testState.value.startTimer(3600); // 60 minutes for Reading
      }

      // 3. Populate the question list for the bottom navigation bar
      let questionCounter = 1;
      testState.value.questions = sectionData.value.content.blocks
        .filter(
          (block) => block.type !== "INSTRUCTION" && block.type !== "IMAGE"
        )
        .map((block) => ({
          id: block.id,
          displayId: questionCounter++, // Display simple numbers 1, 2, 3...
          status: "unanswered",
          isFlagged: false,
        }));

      // 4. Provide the scroll-to function to the parent layout
      testState.value.scrollToQuestion = (blockId) => {
        const element = document.getElementById(blockId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };

      // 5. Initialize the scroll-tracking observer
      setupIntersectionObserver();
    }
  } catch (err) {
    console.error("Failed to load reading section:", err);
    alert("Could not load the Reading section.");
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
/* Scoped styles are now much cleaner */
.split-view-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.passage-pane,
.questions-pane {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: calc(100vh - 160px); /* Adjust based on your header/footer height */
  overflow-y: auto;
}

.reading-passage {
  line-height: 1.7;
  font-size: 1.05em;
}

.loading-container {
  text-align: center;
  padding: 50px;
}
</style>
