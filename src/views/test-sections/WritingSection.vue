<template>
  <div class="section-content-wrapper">
    <div v-if="isLoading" class="loading-container">
      <p>Loading Writing Section...</p>
    </div>

    <div
      v-else-if="sectionData && sectionData.content.blocks.length > 0"
      class="split-view-container"
    >
      <!-- Left Pane: Displays the prompts only -->
      <div class="passage-pane">
        <h3>Prompts</h3>
        <BlockRenderer
          v-for="block in sectionData.content.blocks"
          :key="block.id"
          :block="block"
          :is-display-only="true"
        />
      </div>

      <!-- Right Pane: For user input with tabs and word count -->
      <div class="questions-pane">
        <div class="writing-tabs">
          <button
            @click="activeTask = 'task1'"
            :class="{ active: activeTask === 'task1' }"
          >
            Task 1
          </button>
          <button
            @click="activeTask = 'task2'"
            :class="{ active: activeTask === 'task2' }"
          >
            Task 2
          </button>
        </div>

        <!-- Task 1 Answer Area -->
        <div v-show="activeTask === 'task1'" class="writing-answer-box">
          <textarea
            v-model="allUserAnswers.WRITING.task1"
            placeholder="You should spend about 20 minutes on this task. Write at least 150 words."
            spellcheck="false"
          ></textarea>
          <div class="word-count">Word Count: {{ task1WordCount }}</div>
        </div>

        <!-- Task 2 Answer Area -->
        <div v-show="activeTask === 'task2'" class="writing-answer-box">
          <textarea
            v-model="allUserAnswers.WRITING.task2"
            placeholder="You should spend about 40 minutes on this task. Write at least 250 words."
            spellcheck="false"
          ></textarea>
          <div class="word-count">Word Count: {{ task2WordCount }}</div>
        </div>
      </div>
    </div>
    <div v-else class="loading-container">
      No writing prompts found for this test.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, computed, watch } from "vue";
import api from "../../services/api";
import BlockRenderer from "../UserTestTaking/BlockRenderer.vue";

// eslint-disable-next-line no-undef
const props = defineProps({ attemptId: String });

// --- STATE MANAGEMENT ---
const testState = inject("testState");
const allUserAnswers = inject("allUserAnswers"); // Inject the centralized answer store

const sectionData = ref(null);
const isLoading = ref(true);
const activeTask = ref("task1");

// --- COMPUTED PROPERTIES for WORD COUNT ---
const countWords = (text) => {
  if (!text || text.trim() === "") return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Compute directly from the injected, centralized state
const task1WordCount = computed(() =>
  countWords(allUserAnswers.value.WRITING.task1)
);
const task2WordCount = computed(() =>
  countWords(allUserAnswers.value.WRITING.task2)
);

// --- WATCHERS to update nav bar status ---
watch(task1WordCount, (newCount) => {
  const task1InNav = testState.value?.questions.find((q) => q.id === "task1");
  if (task1InNav) {
    task1InNav.status = newCount > 0 ? "answered" : "unanswered";
  }
});
watch(task2WordCount, (newCount) => {
  const task2InNav = testState.value?.questions.find((q) => q.id === "task2");
  if (task2InNav) {
    task2InNav.status = newCount > 0 ? "answered" : "unanswered";
  }
});

// --- LIFECYCLE HOOKS ---
onMounted(async () => {
  try {
    const response = await api.getSectionContent(props.attemptId, "WRITING");
    sectionData.value = response.data;

    if (testState.value && sectionData.value) {
      testState.value.sectionTitle = "Writing";

      if (testState.value.startTimer) {
        testState.value.startTimer(3600); // 60 minutes
      }

      testState.value.questions = [
        {
          id: "task1",
          displayId: "Task 1",
          status: "unanswered",
          isFlagged: false,
        },
        {
          id: "task2",
          displayId: "Task 2",
          status: "unanswered",
          isFlagged: false,
        },
      ];

      testState.value.scrollToQuestion = (taskId) => {
        activeTask.value = taskId;
      };
    }
  } catch (err) {
    console.error("Failed to load writing section:", err);
    alert("Could not load the Writing section.");
  } finally {
    isLoading.value = false;
  }
});
</script>

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
  display: flex;
  flex-direction: column;
}

.passage-pane h3 {
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.writing-tabs {
  display: flex;
  border-bottom: 1px solid #ccc;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.writing-tabs button {
  padding: 10px 20px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #6c757d;
  border-bottom: 3px solid transparent;
}

.writing-tabs button.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.writing-answer-box {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.writing-answer-box textarea {
  width: 100%;
  flex-grow: 1;
  padding: 15px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  resize: none;
  font-size: 1rem;
  line-height: 1.6;
}

.word-count {
  text-align: right;
  padding: 8px 0;
  font-size: 0.9em;
  color: #6c757d;
  flex-shrink: 0;
}
</style>
