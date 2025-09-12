<!-- src/views/test-sections/WritingSection.vue -->
<template>
  <div class="section-content-wrapper">
    <div v-if="isLoading" class="loading-container">Loading Section...</div>

    <div
      v-else-if="sectionData && sectionData.content.blocks.length > 0"
      class="split-view-container"
    >
      <!-- Left Side: Writing Prompts (Display Only) -->
      <div class="passage-pane">
        <h3>Prompts</h3>
        <BlockRenderer
          v-for="block in sectionData.content.blocks"
          :key="block.id"
          :block="block"
          :is-display-only="true"
        />
      </div>

      <!-- Right Side: Answer Textareas -->
      <div class="questions-pane">
        <h3>Your Answers</h3>
        <div class="writing-answer-box">
          <label>Task 1 Answer</label>
          <textarea
            v-model="userAnswers.task1"
            placeholder="You should spend about 20 minutes on this task..."
            spellcheck="false"
          ></textarea>
        </div>
        <div class="writing-answer-box">
          <label>Task 2 Answer</label>
          <textarea
            v-model="userAnswers.task2"
            placeholder="You should spend about 40 minutes on this task..."
            spellcheck="false"
          ></textarea>
        </div>
      </div>
    </div>
    <div v-else class="loading-container">
      No writing prompts found for this test.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import api from "../../services/api"; // Adjust path if needed
import BlockRenderer from "../../views/UserTestTaking/BlockRenderer.vue"; // Adjust path if needed

const props = defineProps({ attemptId: String });

// --- STATE MANAGEMENT ---
const testState = inject("testState");
const sectionData = ref(null);
const isLoading = ref(true); // Start in loading state
const userAnswers = ref({
  task1: "",
  task2: "",
});

// --- LIFECYCLE HOOKS ---
onMounted(async () => {
  try {
    const response = await api.getSectionContent(props.attemptId, "WRITING");
    sectionData.value = response.data;

    if (testState.value && sectionData.value) {
      // 1. Set the title for the header
      testState.value.sectionTitle = "Writing";

      // 2. Automatically start the 60-minute timer
      if (testState.value.startTimer) {
        testState.value.startTimer(3600);
      }

      // 3. Populate the bottom navigation bar for the two tasks
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

      testState.value.scrollToQuestion = () => {
        /* Not needed for Writing */
      };
    }
  } catch (err) {
    console.error("Failed to load writing section:", err);
    alert("Could not load the Writing section.");
  } finally {
    isLoading.value = false; // Stop loading state
  }
});
</script>

<style scoped>
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

.passage-pane h3,
.questions-pane h3 {
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.writing-answer-box {
  margin-bottom: 20px;
}
.writing-answer-box label {
  display: block;
  font-weight: bold;
  margin-bottom: 10px;
}
.writing-answer-box textarea {
  width: 100%;
  min-height: 250px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

.loading-container {
  text-align: center;
  padding: 50px;
}
</style>
