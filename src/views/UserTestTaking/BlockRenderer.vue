<template>
  <div class="block-display-container">
    <!-- INSTRUCTION Block -->
    <div v-if="block.type === 'INSTRUCTION'" class="instruction-block">
      {{ block.text }}
    </div>

    <!-- GAP_FILLING Block -->
    <div v-else-if="block.type === 'GAP_FILLING'" class="gap-filling-block">
      <!-- This component should emit its answers in the correct object format -->
      <GappFilling
        :template-string="block.text"
        @answer-update="$emit('answer-update', $event)"
      />
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
            v-if="!block.allowMultiple"
            type="radio"
            :id="`mc_q_${block.id}_${option}`"
            :name="`mc_q_${block.id}`"
            :value="option"
            @change="updateAnswer(block.id, option)"
          />

          <!-- MULTIPLE ANSWERS (CHECKBOX) -->
          <input
            v-else
            type="checkbox"
            :id="`mc_q_${block.id}_${option}`"
            :value="option"
            @change="
              updateMultipleAnswers(block.id, option, $event.target.checked)
            "
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
            v-for="item in block.itemsToMatch"
            :key="item.id"
            class="item-to-match"
          >
            <label :for="`match_q_${item.id}`">{{ item.text }}</label>
            <input
              type="text"
              class="answer-input-field"
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
        <select
          class="answer-select"
          @change="updateAnswer(statement.id, $event.target.value)"
        >
          <option value="" disabled selected>Select...</option>
          <option value="TRUE">True</option>
          <option value="FALSE">False</option>
          <option value="NOT_GIVEN">Not Given</option>
        </select>
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
      <!-- Task 1 Container -->
      <div class="task-container" v-if="block.task1_prompt">
        <h4>Writing Task 1</h4>
        <p class="prompt-text">{{ block.task1_prompt }}</p>
        <img
          v-if="block.task1_imageUrl"
          :src="block.task1_imageUrl"
          alt="Writing Task 1 Image"
          class="display-image"
        />
        <!-- ========================================================== -->
        <!-- THE FIX: Only show textareas if NOT in display-only mode   -->
        <!-- ========================================================== -->
        <template v-if="!isDisplayOnly">
          <textarea
            class="writing-textarea"
            placeholder="Type your response for Task 1 here..."
            :value="userAnswers.task1"
            @input="updateWritingAnswer('task1', $event.target.value)"
          ></textarea>
        </template>
      </div>

      <!-- Task 2 Container -->
      <div class="task-container" v-if="block.task2_prompt">
        <h4>Writing Task 2</h4>
        <p class="prompt-text">{{ block.task2_prompt }}</p>
        <template v-if="!isDisplayOnly">
          <textarea
            class="writing-textarea"
            placeholder="Type your response for Task 2 here..."
            :value="userAnswers.task2"
            @input="updateWritingAnswer('task2', $event.target.value)"
          ></textarea>
        </template>
      </div>
    </div>
  </div>
</template>

// In: BlockRenderer.vue

<script>
import GappFilling from "./GappFilling.vue";

export default {
  name: "BlockRenderer",
  components: { GappFilling },
  props: {
    block: { type: Object, required: true },
    userAnswers: {
      type: Object,
      default: () => ({}),
    },
    isDisplayOnly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["answer-update"],
  methods: {
    // Universal method for single-value inputs
    updateAnswer(questionId, answer) {
      const payload = { [questionId]: answer };
      console.log(
        `%c[BlockRenderer] Emitting single answer:`,
        "color: blue;",
        payload
      );
      this.$emit("answer-update", payload);
    },

    // Special method for multiple-answer checkboxes
    updateMultipleAnswers(questionId, option, isChecked) {
      if (!this.userAnswers) return;

      const currentAnswers = this.userAnswers[questionId] || [];
      let newAnswers;

      if (isChecked) {
        newAnswers = [...currentAnswers, option];
      } else {
        newAnswers = currentAnswers.filter((ans) => ans !== option);
      }

      const payload = { [questionId]: newAnswers };
      console.log(
        `%c[BlockRenderer] Emitting multiple answers:`,
        "color: blue;",
        payload
      );
      this.$emit("answer-update", payload);
    },

    // Special method for Writing section
    updateWritingAnswer(taskType, answer) {
      const payload = { questionId: taskType, answer: answer };
      console.log(
        `%c[BlockRenderer] Emitting writing answer:`,
        "color: blue;",
        payload
      );
      this.$emit("answer-update", payload);
    },
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
.answer-input-field {
  width: 100%;
}
.answer-select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: white;
}
.multiple-choice-block .question-text,
.tfng-block .statement-text {
  font-size: 1.05em;
  margin-bottom: 10px;
}
.options-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.options-container .option {
  display: flex;
  align-items: center;
  gap: 10px;
}
input[type="radio"] {
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
.writing-prompt-block .writing-textarea {
  width: 100%;
  min-height: 200px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  resize: vertical;
}
.tfng-options {
  flex-direction: row;
  gap: 20px;
  margin-top: 10px;
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
