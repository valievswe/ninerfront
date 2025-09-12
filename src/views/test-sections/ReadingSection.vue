<!-- src/views/test-sections/ReadingSection.vue -->
<template>
  <div class="section-content-wrapper">
    <div v-if="isLoading" class="loading-container">
      <p>Loading Reading Section...</p>
    </div>

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
          :block="block"
          :user-answers="allUserAnswers.READING"
          @answer-update="updateUserAnswer"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, nextTick } from "vue";
import api from "../../services/api";
import BlockRenderer from "../UserTestTaking/BlockRenderer.vue";

// eslint-disable-next-line no-undef
const props = defineProps({ attemptId: String });

// --- STATE MANAGEMENT ---
const testState = inject("testState");
const allUserAnswers = inject("allUserAnswers"); // Inject the centralized answer store

const sectionData = ref(null);
const isLoading = ref(true);
let observer = null;

// --- METHODS ---
const updateUserAnswer = (answerObject) => {
  const questionId = Object.keys(answerObject)[0];
  // Write the answer directly to the parent's centralized state
  allUserAnswers.value.READING[questionId] = answerObject[questionId];

  // Update the nav bar status
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
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && testState.value) {
        const firstQuestionInBlock = testState.value.questions.find(
          (q) => q.blockId === entry.target.id
        );
        if (firstQuestionInBlock) {
          testState.value.currentQuestionInView = firstQuestionInBlock.id;
        }
      }
    });
  }, options);

  nextTick(() => {
    if (sectionData.value?.content.blocks) {
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
      testState.value.sectionTitle = "Reading";

      // Automatically start the timer for the Reading section
      if (testState.value.startTimer) {
        testState.value.startTimer(3600); // 60 minutes
      }

      // Logic to populate the nav bar (unchanged and correct)
      let questionCounter = 1;
      testState.value.questions = sectionData.value.content.blocks.reduce(
        (acc, block) => {
          const findIds = (obj) => {
            let ids = [];
            if (obj && typeof obj === "object") {
              if (
                obj.id &&
                (String(obj.id).startsWith("q_") ||
                  block.type === "MULTIPLE_CHOICE")
              ) {
                if (
                  !acc.some((q) => q.id === obj.id) &&
                  !ids.some((i) => i.id === obj.id)
                ) {
                  ids.push({
                    id: obj.id,
                    displayId: questionCounter++,
                    status: "unanswered",
                    blockId: block.id,
                  });
                }
              }
              for (const key in obj) {
                ids = ids.concat(findIds(obj[key]));
              }
            }
            return ids;
          };
          return acc.concat(findIds(block));
        },
        []
      );

      testState.value.scrollToQuestion = (questionId) => {
        const question = testState.value.questions.find(
          (q) => q.id === questionId
        );
        if (question && question.blockId) {
          document
            .getElementById(question.blockId)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };

      setupIntersectionObserver();
    }
  } catch (err) {
    console.error("Failed to load reading section:", err);
    alert("Could not load the Reading section.");
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>
>

<style scoped>
.loading-container {
  text-align: center;
  padding: 50px;
  font-size: 1.2rem;
  color: #6c757d;
}
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
</style>
