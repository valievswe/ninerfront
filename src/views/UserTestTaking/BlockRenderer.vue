<template>
  <div class="block-display-container">
    <!-- INSTRUCTION Block -->
    <div v-if="block.type === 'INSTRUCTION'" class="instruction-block">
      {{ block.text }}
    </div>

    <!-- GAP_FILLING Block -->
    <div v-else-if="block.type === 'GAP_FILLING'" class="gap-filling-block">
      <div class="gap-template" v-html="renderGapTemplate"></div>
    </div>

    <!-- MULTIPLE_CHOICE Block -->
    <div
      v-else-if="block.type === 'MULTIPLE_CHOICE'"
      class="multiple-choice-block"
    >
      <p class="question-text">{{ block.text }}</p>
      <div class="options-container">
        <div v-for="option in block.options" :key="option" class="option">
          <input
            type="radio"
            :id="`mc_q_${block.id}_${option}`"
            :name="`mc_q_${block.id}`"
            :value="option"
            @change="updateAnswer(block.id, option)"
          />
          <label :for="`mc_q_${block.id}_${option}`">{{ option }}</label>
        </div>
      </div>
    </div>

    <!-- MATCHING Block -->
    <div v-else-if="block.type === 'MATCHING'" class="matching-block">
      <p class="instruction-text">{{ block.instruction }}</p>
      <div class="matching-grid">
        <div class="options-list-column">
          <h4>Options</h4>
          <ul>
            <li v-for="option in block.options" :key="option">{{ option }}</li>
          </ul>
        </div>
        <div class="items-to-match-column">
          <h4>Questions</h4>
          <div
            v-for="statement in block.statements"
            :key="statement.id"
            class="statement-item"
          >
            <label :for="`match_q_${item.id}`">{{ item.text }}</label>
            <input
              type="text"
              :id="`match_q_${item.id}`"
              :name="`match_q_${item.id}`"
              @input="updateAnswer(item.id, $event.target.value)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- IMAGE Block -->
    <div v-else-if="block.type === 'IMAGE'" class="image-block">
      <img
        :src="block.imageUrl"
        :alt="block.caption || 'Image'"
        class="display-image"
      />
      <p v-if="block.caption" class="caption">{{ block.caption }}</p>
    </div>

    <!-- TRUE_FALSE_NOT_GIVEN Block -->
    <div v-else-if="block.type === 'TRUE_FALSE_NOT_GIVEN'" class="tfng-block">
      <p class="instruction-text">{{ block.instruction }}</p>
      <div
        v-for="(statement, index) in block.statements"
        :key="statement.id"
        class="statement-item"
      >
        <p class="statement-text">
          <strong>{{ index + 1 }}.</strong> {{ statement.text }}
        </p>
        <div class="tfng-options">
          <input
            type="radio"
            :id="`tfng_q_${statement.id}_true`"
            :name="`tfng_q_${statement.id}`"
            value="TRUE"
            @change="updateAnswer(statement.id, 'TRUE')"
          />
          <label :for="`tfng_q_${statement.id}_true`">True</label>
          <input
            type="radio"
            :id="`tfng_q_${statement.id}_false`"
            :name="`tfng_q_${statement.id}`"
            value="FALSE"
            @change="updateAnswer(statement.id, 'FALSE')"
          />
          <label :for="`tfng_q_${statement.id}_false`">False</label>
          <input
            type="radio"
            :id="`tfng_q_${statement.id}_notgiven`"
            :name="`tfng_q_${statement.id}`"
            value="NOT_GIVEN"
            @change="updateAnswer(statement.id, 'NOT_GIVEN')"
          />
          <label :for="`tfng_q_${statement.id}_notgiven`">Not Given</label>
        </div>
      </div>
    </div>

    <!-- MAP_LABELING Block -->
    <div v-else-if="block.type === 'MAP_LABELING'" class="map-labeling-block">
      <p class="instruction-text">{{ block.instruction }}</p>
      <div class="map-content">
        <img
          :src="block.imageUrl"
          alt="Map/Diagram"
          class="display-map-image"
        />
        <div class="map-labels">
          <div
            v-for="(label, index) in block.labels"
            :key="label.id"
            class="label-item"
          >
            <label :for="`map_q_${label.id}`"
              >{{ index + 1 }}. {{ label.text }}</label
            >
            <input
              type="text"
              :id="`map_q_${label.id}`"
              :name="`map_q_${label.id}`"
              @input="updateAnswer(label.id, $event.target.value)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- WRITING_PROMPT Block -->
    <div
      v-else-if="block.type === 'WRITING_PROMPT'"
      class="writing-prompt-block"
    >
      <div class="task-container">
        <h4>Writing Task 1</h4>
        <p class="prompt-text">{{ block.task1_prompt }}</p>
        <img
          v-if="block.task1_imageUrl"
          :src="block.task1_imageUrl"
          alt="Writing Task 1 Image"
          class="display-image"
        />
        <textarea
          :value="userAnswers.WRITING.task1"
          @input="updateWritingAnswer('task1', $event.target.value)"
          placeholder="Write your Task 1 answer here..."
        ></textarea>
      </div>
      <div class="task-container">
        <h4>Writing Task 2</h4>
        <p class="prompt-text">{{ block.task2_prompt }}</p>
        <textarea
          :value="userAnswers.WRITING.task2"
          @input="updateWritingAnswer('task2', $event.target.value)"
          placeholder="Write your Task 2 answer here..."
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BlockRenderer",
  props: {
    block: { type: Object, required: true },
    // We pass the userAnswers from the parent to pre-fill inputs if needed
    // This is optional and can be used for resuming tests. For now, it's read-only.
    userAnswers: {
      type: Object,
      default: () => ({
        LISTENING: {},
        READING: {},
        WRITING: { task1: "", task2: "" },
      }),
    },
  },
  emits: ["answer-update"], // Custom event to send answers back to parent
  computed: {
    renderGapTemplate() {
      if (!this.block.template) return "";
      // This will replace {{placeholder}} with an input field
      // We use a custom event listener on mounted to capture input values
      return this.block.template
        .replace(/\{\{([a-zA-Z0-9]+)\}\}/g, (match, placeholderId) => {
          // Pre-fill input if answer already exists
          const currentAnswer =
            this.userAnswers[
              this.block.type === "GAP_FILLING" ? "LISTENING" : "READING"
            ][placeholderId] || "";
          return `<input type="text" class="gap-input" data-question-id="${placeholderId}" value="${currentAnswer}" />`;
        })
        .replace(/\n/g, "<br>");
    },
  },
  methods: {
    updateAnswer(questionId, answer) {
      // Emit the answer update to the parent component
      this.$emit("answer-update", {
        questionId,
        answer,
      });
    },
    updateWritingAnswer(taskType, answer) {
      // Special handling for Writing section answers
      this.$emit("answer-update", {
        blockId: this.block.id,
        questionId: taskType,
        answer,
      });
    },
  },
  mounted() {
    // Event listener for dynamically created inputs (like gap-fills)
    if (this.block.type === "GAP_FILLING") {
      this.$el.addEventListener("input", (event) => {
        if (event.target.classList.contains("gap-input")) {
          const questionId = event.target.dataset.questionId;
          const answer = event.target.value;
          this.updateAnswer(questionId, answer);
        }
      });
    }
  },
};
</script>

<style scoped>
.block-display-container {
  padding: 15px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}
.instruction-block {
  font-size: 1.1em;
  font-weight: bold;
  font-style: italic;
  margin-bottom: 15px;
}
.gap-filling-block .gap-template {
  line-height: 2;
  white-space: pre-wrap; /* Preserve line breaks from textarea input */
}
.gap-input {
  border: none;
  border-bottom: 1px solid #333;
  text-align: center;
  width: 150px;
  font-weight: bold;
  padding: 5px;
  margin: 0 5px;
}

.multiple-choice-block .question-text,
.tfng-block .statement-text {
  font-size: 1.05em;
  margin-bottom: 10px;
}
.options-container,
.tfng-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.options-container .option,
.tfng-options div {
  display: flex;
  align-items: center;
  gap: 10px;
}
input[type="radio"],
input[type="checkbox"] {
  /* Standardizing radio/checkbox appearance */
  width: 1.2em;
  height: 1.2em;
  margin: 0;
  cursor: pointer;
}
input[type="text"] {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.matching-block,
.map-labeling-block {
  margin-top: 20px;
}
.matching-grid,
.map-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.matching-grid .options-list-column ul {
  list-style-type: upper-alpha;
  padding-left: 20px;
}
.matching-grid .item-to-match label {
  display: block;
  margin-bottom: 5px;
}
.matching-grid .item-to-match input {
  width: 100%;
}

.image-block .display-image,
.writing-prompt-block .display-image {
  max-width: 100%;
  height: auto;
  border: 1px solid #ddd;
  margin: 15px 0;
}
.image-block .caption {
  text-align: center;
  font-style: italic;
  color: #666;
  font-size: 0.9em;
}

.writing-prompt-block h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
}
.writing-prompt-block .prompt-text {
  line-height: 1.6;
  margin-bottom: 15px;
}
.writing-prompt-block textarea {
  width: 100%;
  min-height: 150px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

/* Specific styles for TFNG radios */
.tfng-options {
  flex-direction: row; /* Make radios horizontal */
  gap: 20px;
  margin-top: 10px;
}
.tfng-options label {
  font-weight: normal;
  cursor: pointer;
}
.map-labeling-block .display-map-image {
  max-width: 100%;
  height: auto;
  border: 1px solid #ddd;
  margin: 10px 0;
}
.map-labels .label-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.map-labels .label-item input {
  flex-grow: 1;
}
</style>
