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

    <!-- Loop through each section of the original test -->
    <div
      v-for="section in sortedSections"
      :key="section.id"
      class="section-review"
    >
      <h3>{{ section.type }} Section Review</h3>

      <!-- Loop through each "Lego" block -->
      <div
        v-for="block in section.content.blocks"
        :key="block.id"
        class="block-review"
      >
        <p v-if="block.type === 'INSTRUCTION'" class="instruction-text">
          {{ block.text }}
        </p>

        <!-- Display logic for question blocks -->
        <div v-if="isQuestionBlock(block.type)">
          <!-- Render a comparison for each individual question inside the block -->
          <div
            v-for="question in getQuestionsFromBlock(block)"
            :key="question.id"
            class="question-comparison"
            :class="getComparisonClass(section.type, question.id)"
          >
            <div class="question-text">{{ question.text }}</div>
            <div class="answers">
              <div class="user-answer">
                <strong>Your Answer:</strong> {{ getUserAnswer(section.type,
                question.id) || '<em>(No Answer)</em>' }}
              </div>
              <div class="correct-answer">
                <strong>Correct Answer:</strong>
                {{ section.answers[question.id] }}
              </div>
            </div>
          </div>
        </div>

        <!-- You can add display logic for WRITING_PROMPT here to show the student's essays -->
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
    // Helper to ensure sections are always displayed in the correct order
    sortedSections() {
      if (!this.attempt) return [];
      const order = ["LISTENING", "READING", "WRITING"];
      return [...this.attempt.scheduledTest.testTemplate.sections].sort(
        (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
      );
    },
    totalListeningQuestions() {
      if (!this.attempt) return 0;
      const listeningSection =
        this.attempt.scheduledTest.testTemplate.sections.find(
          (s) => s.type === "LISTENING"
        );
      if (!listeningSection?.content.blocks) return 0;

      // We reduce the array of blocks to a single number: the total count of questions
      return listeningSection.content.blocks.reduce((total, block) => {
        if (block.type === "GAP_FILLING") {
          return total + ((block.text || "").match(/\{\{/g) || []).length;
        }
        if (block.type === "MULTIPLE_CHOICE") {
          return total + 1;
        }
        if (block.type === "MATCHING") {
          return total + (block.itemsToMatch?.length || 0);
        }
        if (block.type === "TRUE_FALSE_NOT_GIVEN") {
          return total + (block.statements?.length || 0);
        }
        if (block.type === "MAP_LABELING") {
          return total + (block.labels?.length || 0);
        }
        return total; // For INSTRUCTION, IMAGE, etc., add 0
      }, 0);
    },
    totalReadingQuestions() {
      if (!this.attempt) return 0;
      const readingSection =
        this.attempt.scheduledTest.testTemplate.sections.find(
          (s) => s.type === "READING"
        );
      if (!readingSection?.content.blocks) return 0;

      // The logic is identical to the listening counter
      return readingSection.content.blocks.reduce((total, block) => {
        if (block.type === "GAP_FILLING") {
          return total + ((block.text || "").match(/\{\{/g) || []).length;
        }
        if (block.type === "MULTIPLE_CHOICE") {
          return total + 1;
        }
        if (block.type === "MATCHING") {
          return total + (block.itemsToMatch?.length || 0);
        }
        if (block.type === "TRUE_FALSE_NOT_GIVEN") {
          return total + (block.statements?.length || 0);
        }
        if (block.type === "SUMMARY_COMPLETION") {
          return (
            total + ((block.summaryText || "").match(/\{\{/g) || []).length
          );
        }
        return total;
      }, 0);
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
    // A helper to check if a block contains questions
    isQuestionBlock(type) {
      return [
        "GAP_FILLING",
        "MULTIPLE_CHOICE",
        "MATCHING",
        "TRUE_FALSE_NOT_GIVEN",
        "MAP_LABELING",
      ].includes(type);
    },
    // The "magic" method to extract individual questions from any block type
    getQuestionsFromBlock(block) {
      if (block.type === "GAP_FILLING") {
        const placeholders =
          (block.text || "").match(/\{\{([a-zA-Z0-9]+)\}\}/g) || [];
        return placeholders.map((p) => ({
          id: p.replace(/\{|\}/g, ""),
          text: `Gap: ${p}`,
        }));
      }
      if (block.type === "MULTIPLE_CHOICE")
        return [{ id: block.id, text: block.text }];
      if (block.type === "MATCHING") return block.itemsToMatch;
      if (block.type === "TRUE_FALSE_NOT_GIVEN") return block.statements;
      if (block.type === "MAP_LABELING") return block.labels;
      return [];
    },
    getUserAnswer(sectionType, questionId) {
      return this.attempt.userAnswers[sectionType]?.[questionId];
    },
    // A helper to style the comparison row based on correctness
    getComparisonClass(sectionType, questionId) {
      const userAnswer = this.getUserAnswer(sectionType, questionId);
      const correctAnswer =
        this.attempt.scheduledTest.testTemplate.sections.find(
          (s) => s.type === sectionType
        ).answers[questionId];
      if (userAnswer === correctAnswer) {
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
</style>
