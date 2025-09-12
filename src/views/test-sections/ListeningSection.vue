<template>
  <div class="section-content-wrapper">
    <div v-if="isLoading" class="loading-container">
      <p>Loading Listening Section...</p>
    </div>

    <div v-else>
      <!-- "Start Section" Overlay -->
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

      <!-- Main Test Content -->
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
          :user-answers="allUserAnswers.LISTENING"
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
import BlockRenderer from "../UserTestTaking/BlockRenderer.vue";

// eslint-disable-next-line no-undef
const props = defineProps({ attemptId: String });

// --- STATE MANAGEMENT ---
const testState = inject("testState");
const allUserAnswers = inject("allUserAnswers"); // Inject the centralized answer store

const sectionData = ref(null);
const isLoading = ref(true);
const hasStarted = ref(false);
const audioPlayerRef = ref(null);
let observer = null;

// --- METHODS ---
const startTest = () => {
  hasStarted.value = true;
  if (testState.value && testState.value.startTimer) {
    testState.value.startTimer(2400); // 40 minutes
  }
  nextTick(() => {
    if (audioPlayerRef.value) {
      audioPlayerRef.value.play();
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
  // Write the answer directly to the parent's centralized state
  allUserAnswers.value.LISTENING[questionId] = answerObject[questionId];

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
    const response = await api.getSectionContent(props.attemptId, "LISTENING");
    sectionData.value = response.data;

    if (testState.value && sectionData.value) {
      testState.value.sectionTitle = "Listening";

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
    console.error("Failed to load listening section:", err);
    alert("Could not load the listening section.");
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>
<style scoped>
.loading-container {
  text-align: center;
  padding: 50px;
  font-size: 1.2rem;
  color: #6c757d;
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
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.start-btn {
  font-size: 1.2em;
  padding: 12px 25px;
}
</style>
