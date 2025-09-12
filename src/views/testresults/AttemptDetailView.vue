<template>
  <div class="attempt-detail-view" v-if="attempt">
    <h1>
      Results for {{ attempt.user.firstName }} {{ attempt.user.lastName }}
    </h1>
    <h2>Test: {{ attempt.scheduledTest.testTemplate.title }}</h2>
    <div class="scores-summary">
      <div class="score-box">
        Listening Score
        <span
          >{{ attempt.results.listeningScore }} /
          {{ totalListeningQuestions }}</span
        >
      </div>
      <div class="score-box">
        Reading Score
        <span
          >{{ attempt.results.readingScore }} /
          {{ totalReadingQuestions }}</span
        >
      </div>
    </div>

    <!-- This is the single, corrected loop -->
    <div
      v-for="section in sortedSections"
      :key="section.id"
      class="section-review"
    >
      <h3>{{ section.type }} Section Review</h3>

      <!-- Display for WRITING Section -->
      <div v-if="section.type === 'WRITING'">
        <!-- Loop through each block -->
        <div v-for="block in section.content.blocks" :key="block.id">
          <!-- ONLY create the review block IF it's a writing prompt block -->
          <div v-if="block.type === 'WRITING_PROMPT'" class="block-review">
            <!-- Task 1 Content -->
            <div class="task-container" v-if="block.task1_prompt">
              <h4>Writing Prompt (Task 1)</h4>
              <p class="writing-prompt">{{ block.task1_prompt }}</p>
              <div class="user-writing-response">
                <h4>Your Response (Task 1)</h4>
                <p v-html="writingResponseTask1" class="writing-answer"></p>
              </div>
            </div>

            <!-- Task 2 Content -->
            <div class="task-container" v-if="block.task2_prompt">
              <h4>Writing Prompt (Task 2)</h4>
              <p class="writing-prompt">{{ block.task2_prompt }}</p>
              <div class="user-writing-response">
                <h4>Your Response (Task 2)</h4>
                <p v-html="writingResponseTask2" class="writing-answer"></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Display for LISTENING and READING Sections -->
      <div v-else>
        <div
          v-for="block in section.content.blocks"
          :key="block.id"
          class="block-review"
        >
          <p v-if="block.type === 'INSTRUCTION'" class="instruction-text">
            {{ block.text }}
          </p>
          <div v-if="isQuestionBlock(block.type)">
            <div
              v-for="question in getQuestionsFromBlock(block)"
              :key="question.id"
              class="question-comparison"
              :class="getComparisonClass(section.type, question.id)"
            >
              <div
                class="question-text"
                v-html="
                  question.text.replace(
                    /\{\{([a-zA-Z0-9]+)\}\}/g,
                    '<strong>___</strong>'
                  )
                "
              ></div>
              <div class="answers">
                <div class="user-answer">
                  <strong>Your Answer:</strong>
                  <!-- Use the new formatter -->
                  <span
                    v-html="
                      formatAnswerForDisplay(
                        getUserAnswer(section.type, question.id)
                      )
                    "
                  ></span>
                </div>
                <div class="correct-answer">
                  <strong>Correct Answer:</strong>
                  {{ formatAnswerForDisplay(section.answers[question.id]) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="isLoading">Loading results...</div>
</template>

<script>
import api from "../../services/api";

export default {
  name: "AttemptDetailView",
  props: ["attemptId"],
  data() {
    return {
      attempt: null,
      isLoading: false,
    };
  },
  computed: {
    // ... sortedSections, total counters, and writing getters are all correct and unchanged ...
    sortedSections() {
      if (!this.attempt) return [];
      const order = ["LISTENING", "READING", "WRITING"];
      return [...this.attempt.scheduledTest.testTemplate.sections].sort(
        (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
      );
    },
    totalListeningQuestions() {
      const listeningSection = this.sortedSections.find(
        (s) => s.type === "LISTENING"
      );
      return listeningSection
        ? Object.keys(listeningSection.answers || {}).length
        : 0;
    },
    totalReadingQuestions() {
      const readingSection = this.sortedSections.find(
        (s) => s.type === "READING"
      );
      return readingSection
        ? Object.keys(readingSection.answers || {}).length
        : 0;
    },
    writingResponseTask1() {
      const answer = this.attempt?.userAnswers?.WRITING?.task1;
      if (!answer) return "<em>(No answer provided)</em>";
      return String(answer).replace(/\n/g, "<br />");
    },
    writingResponseTask2() {
      const answer = this.attempt?.userAnswers?.WRITING?.task2;
      if (!answer) return "<em>(No answer provided)</em>";
      return String(answer).replace(/\n/g, "<br />");
    },
  },
  methods: {
    async fetchAttemptDetails() {
      this.isLoading = true;
      try {
        const response = await api.getAttemptDetails(this.attemptId);
        this.attempt = response.data;
      } catch (err) {
        alert("Could not load attempt details.");
      } finally {
        this.isLoading = false;
      }
    },
    isQuestionBlock(type) {
      return !["INSTRUCTION", "IMAGE", "WRITING_PROMPT"].includes(type);
    },
    formatAnswerForDisplay(answer) {
      if (answer === undefined || answer === null || answer === "") {
        return "<em>(No Answer)</em>";
      }
      if (Array.isArray(answer)) {
        if (answer.length === 0) return "<em>(No Answer)</em>";
        return answer.join(", ");
      }
      return String(answer);
    },

    // ====================================================================
    //  THE NEW, CORRECT getQuestionsFromBlock METHOD
    // ====================================================================
    getQuestionsFromBlock(block) {
      const section = this.sortedSections.find((s) =>
        s.content.blocks.some((b) => b.id === block.id)
      );
      if (!section || !section.answers) return [];

      // Get all question IDs from the correct answers for this section
      const questionIds = Object.keys(section.answers);

      // Now, find the text associated with each ID within the block
      const questions = questionIds
        .map((id) => {
          // This is a helper to find the text for a given ID within the block's structure
          const findText = (obj) => {
            if (!obj || typeof obj !== "object") return null;
            if (obj.id === id && obj.text) return obj.text; // For Matching, T/F/NG items
            if (block.type === "MULTIPLE_CHOICE" && block.id === id)
              return block.text; // For MCQs
            // For GapFilling, the question text is the entire block text
            if (
              ["GAP_FILLING", "SUMMARY_COMPLETION"].includes(block.type) &&
              block.answers[id]
            )
              return block.text;

            for (const key in obj) {
              const found = findText(obj[key]);
              if (found) return found;
            }
            return null;
          };
          const text = findText(block);
          // Only return questions that actually belong to this block
          return text ? { id, text } : null;
        })
        .filter(Boolean); // Filter out any nulls

      return questions;
    },

    getUserAnswer(sectionType, questionId) {
      return this.attempt?.userAnswers?.[sectionType]?.[questionId];
    },
    getComparisonClass(sectionType, questionId) {
      const userAnswer = this.getUserAnswer(sectionType, questionId);
      const correctAnswer =
        this.attempt.scheduledTest.testTemplate.sections.find(
          (s) => s.type === sectionType
        )?.answers?.[questionId];

      const format = (ans) => {
        if (ans === undefined || ans === null) return "null";
        if (Array.isArray(ans)) return [...ans].sort().join(",").toLowerCase();
        return String(ans).trim().toLowerCase();
      };

      if (format(userAnswer) === format(correctAnswer)) {
        return "correct";
      }
      return "incorrect";
    },
  },
  created() {
    this.fetchAttemptDetails();
  },
};
</script>

<style scoped>
.attempt-detail-view {
  max-width: 1200px;
  margin: 20px auto;
}
.scores-summary {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}
.score-box {
  background: #f3f4f6;
  padding: 20px;
  border-radius: 8px;
  flex-grow: 1;
  text-align: center;
  font-size: 1.2em;
}
.score-box span {
  display: block;
  font-size: 1.8em;
  font-weight: bold;
  margin-top: 5px;
}
.section-review {
  margin-bottom: 30px;
}
.block-review {
  border: 1px solid #e5e7eb;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}
.instruction-text {
  font-style: italic;
  font-weight: bold;
}
.question-comparison {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #f3f4f6;
}
.question-comparison.correct {
  border-left: 4px solid #16a34a;
}
.question-comparison.incorrect {
  border-left: 4px solid #ef4444;
}
.answers {
  text-align: right;
}
.task-container {
  margin-bottom: 30px;
}
.writing-prompt {
  background-color: #eef2ff;
  padding: 15px;
  border-radius: 6px;
  line-height: 1.6;
  color: #374151;
}
.user-writing-response {
  margin-top: 20px;
}
.writing-answer {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 15px;
  border-radius: 6px;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
