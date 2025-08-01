<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable no-unused-vars -->
<template>
  <div class="test-room-view">
    <h1>IELTS Mock Test</h1>
    <div v-if="isLoading">Loading test content...</div>
    <div v-else>
      <!-- Loop through each section (Listening, Reading, Writing) -->
      <div
        v-for="section in sections"
        :key="section.id"
        class="section-container"
      >
        <h2>{{ section.type }} Section</h2>

        <!-- Audio for Listening Section -->
        <audio
          v-if="section.type === 'LISTENING' && section.content.audioUrl"
          :src="section.content.audioUrl"
          class="test-audio"
          autoplay
          disableRemotePlayback
          @ended="onAudioEnded(section.id)"
        ></audio>

        <!-- Display Reading Passage -->
        <div
          v-if="section.type === 'READING' && section.content.passageText"
          class="reading-passage"
        >
          <h3>Reading Passage</h3>
          <p>{{ section.content.passageText }}</p>
        </div>

        <!-- Loop through each "Lego" block and render it -->
        <BlockRenderer
          v-for="block in section.content.blocks"
          :key="block.id"
          :block="block"
          :user-answers="userAnswers"
          @answer-update="updateUserAnswer(section.type, $event)"
        />
      </div>

      <button @click="submitTest" class="btn-submit">
        Submit Final Answers
      </button>
    </div>
  </div>
</template>

<script>
import api from "../services/api";
import BlockRenderer from "./UserTestTaking/BlockRenderer.vue";

// Helper to keep track of questions and map block IDs to sequential numbers for the grader
const getQuestionNumberForGrading = (sections) => {
  let count = 0;
  const questionMap = {};
  sections.forEach((section) => {
    if (section.content.blocks) {
      section.content.blocks.forEach((block) => {
        if (
          block.type === "GAP_FILLING" ||
          block.type === "MULTIPLE_CHOICE" ||
          block.type === "MATCHING" ||
          block.type === "TRUE_FALSE_NOT_GIVEN" ||
          block.type === "MAP_LABELING"
        ) {
          // For these types, the "questions" are inside the block itself.
          const questionIds = [];
          if (block.type === "GAP_FILLING") {
            const matches = block.text.match(/\{\{([a-zA-Z0-9]+)\}\}/g) || [];
            matches.forEach((p) => questionIds.push(p.replace(/\{|\}/g, "")));
          } else if (block.type === "MULTIPLE_CHOICE") {
            questionIds.push(block.id); // MC question ID is the block ID
          } else if (block.type === "MATCHING") {
            block.itemsToMatch.forEach((item) => questionIds.push(item.id));
          } else if (block.type === "TRUE_FALSE_NOT_GIVEN") {
            block.statements.forEach((statement) =>
              questionIds.push(statement.id)
            );
          } else if (block.type === "MAP_LABELING") {
            block.labels.forEach((label) => questionIds.push(label.id));
          }

          questionIds.forEach((qId) => {
            count++;
            questionMap[qId] = count;
          });
        }
      });
    }
  });
  return questionMap;
};

export default {
  name: "TestRoomView",
  components: { BlockRenderer }, // Register the new component
  props: ["templateId", "attemptId"],
  data() {
    return {
      sections: [],
      isLoading: false,
      userAnswers: {
        LISTENING: {},
        READING: {},
        WRITING: { task1: "", task2: "" }, // Specific model for writing
      },
      results: null,
      questionNumberMap: {}, // To map block IDs to sequential question numbers
      // Add a timer for the listening section
      listeningTimer: null,
      listeningTimeLeft: 0, // In seconds
    };
  },
  methods: {
    async fetchSections() {
      this.isLoading = true;
      try {
        const response = await api.getTestSections(this.templateId);
        // Ensure sections are sorted correctly (Listening, Reading, Writing)
        const correctSectionOrder = ["LISTENING", "READING", "WRITING"];
        this.sections = response.data.sort((a, b) => {
          return (
            correctSectionOrder.indexOf(a.type) -
            correctSectionOrder.indexOf(b.type)
          );
        });

        // Generate the question number map
        this.questionNumberMap = getQuestionNumberForGrading(this.sections);

        // Initialize user answers for existing questions on load if resuming a test
        // This is a basic initialization. For a full resume, you'd fetch saved answers.
        this.sections.forEach((section) => {
          if (section.type === "WRITING") {
            this.userAnswers.WRITING.task1 = "";
            this.userAnswers.WRITING.task2 = "";
          } else if (section.content.blocks) {
            section.content.blocks.forEach((block) => {
              // For all question blocks, initialize their answers
              if (
                block.type === "GAP_FILLING" ||
                block.type === "MULTIPLE_CHOICE" ||
                block.type === "MATCHING" ||
                block.type === "TRUE_FALSE_NOT_GIVEN" ||
                block.type === "MAP_LABELING"
              ) {
                // For gap-filling, initialize multiple inputs
                if (block.type === "GAP_FILLING") {
                  const placeholders =
                    block.text.match(/\{\{([a-zA-Z0-9]+)\}\}/g) || [];
                  placeholders.forEach((p) => {
                    const qId = p.replace(/\{|\}/g, "");
                    this.userAnswers[section.type][qId] = "";
                  });
                } else if (block.type === "MULTIPLE_CHOICE") {
                  this.userAnswers[section.type][block.id] = "";
                } else if (block.type === "MATCHING") {
                  block.itemsToMatch.forEach((item) => {
                    this.userAnswers[section.type][item.id] = "";
                  });
                } else if (block.type === "TRUE_FALSE_NOT_GIVEN") {
                  block.statements.forEach((statement) => {
                    this.userAnswers[section.type][statement.id] = "";
                  });
                } else if (block.type === "MAP_LABELING") {
                  block.labels.forEach((label) => {
                    this.userAnswers[section.type][label.id] = "";
                  });
                }
              }
            });
          }
        });

        // Start Listening Timer (typically 30 mins = 1800 seconds)
        // This is a placeholder. In a real app, this timer would be linked to the audio duration
        // and a 10-minute transfer time.
        if (this.sections.some((s) => s.type === "LISTENING")) {
          this.startListeningTimer(1800); // 30 minutes for listening
        }
      } catch (err) {
        alert("Could not load test content.");
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },

    updateUserAnswer(sectionType, { questionId, answer }) {
      // For writing, questionId will be 'task1' or 'task2'
      if (sectionType === "WRITING") {
        this.userAnswers.WRITING[questionId] = answer;
      } else {
        // For other sections, questionId is the unique identifier within the block.
        this.userAnswers[sectionType][questionId] = answer;
      }
    },

    async submitTest() {
      if (
        !confirm(
          "Are you sure you want to submit your test? You cannot make changes after submitting."
        )
      ) {
        return;
      }
      try {
        await api.submitTestAttempt(this.attemptId, this.userAnswers);
        alert(
          "Your test has been submitted successfully! Your results will be available soon."
        );
        this.$router.push("/dashboard");
      } catch (err) {
        alert("Failed to submit test.");
        console.error(err);
      }
    },

    // --- Phase 2: Audio Control & Timer ---
    onAudioEnded(sectionId) {
      // Find the Listening section to mark it as completed or enable next section
      console.log(`Audio for section ${sectionId} ended.`);
      // In a real app, after listening audio ends, you'd typically start a 10-minute transfer time.
      // For simplicity, we'll just stop the timer if it's running.
      if (this.listeningTimer) {
        clearInterval(this.listeningTimer);
        this.listeningTimer = null;
        this.listeningTimeLeft = 0;
        // You might add logic here to automatically move to the Reading section.
        alert(
          "Listening audio has ended. Please review your answers (you have 10 minutes for transfer)."
        );
      }
    },

    startListeningTimer(durationInSeconds) {
      this.listeningTimeLeft = durationInSeconds;
      this.listeningTimer = setInterval(() => {
        if (this.listeningTimeLeft > 0) {
          this.listeningTimeLeft--;
        } else {
          clearInterval(this.listeningTimer);
          this.listeningTimer = null;
          alert("Time's up for the Listening section! Moving to next section.");
          // Automatically submit the test after listening time, if required.
          // For now, let's just alert. Full auto-submit should be at the end of entire test.
        }
      }, 1000); // Update every second
    },
    // You'd add a main test timer here for overall test duration if needed.
  },
  created() {
    this.fetchSections();
  },
  // Optionally, clear the timer if the component is destroyed
  beforeUnmount() {
    if (this.listeningTimer) {
      clearInterval(this.listeningTimer);
    }
  },
};
</script>

<style scoped>
/* --- General Test Room Styling --- */
.test-room-view {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}
.test-room-view h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #1f2937;
}
.section-container {
  background: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}
.section-container h2 {
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 15px;
  margin-top: 0;
  margin-bottom: 20px;
  color: #374151;
}
.test-audio {
  width: 100%;
  margin-bottom: 20px;
  /* Make audio controls unpausable/unskippable for authenticity */
  /* These are HTML5 attributes, not CSS. */
}
.reading-passage {
  background-color: #f9fafb;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 25px;
  line-height: 1.6;
  font-size: 1.05em;
  border: 1px solid #e5e7eb;
}
.reading-passage h3 {
  margin-top: 0;
  color: #111827;
}
.btn-submit {
  width: 100%;
  padding: 15px;
  font-size: 1.1rem;
  background-color: #1f2937;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.btn-submit:hover {
  background-color: #374151;
}
.results-container {
  margin-top: 30px;
  padding: 25px;
  background: #e8f5e9;
  border-left: 5px solid #16a34a;
  border-radius: 8px;
  color: #16a34a;
}
.results-container h2 {
  color: #16a34a;
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(22, 163, 74, 0.3);
  padding-bottom: 10px;
}
.results-container p {
  font-size: 1.1em;
  margin-bottom: 8px;
}
.results-container strong {
  font-weight: 700;
}
</style>
