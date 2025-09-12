<!-- src/views/UserTestTaking/BlockRenderer.vue -->
<template>
  <div class="block-display-container" :id="block.id">
    <!-- INSTRUCTION -->
    <div
      v-if="block.type === 'INSTRUCTION'"
      class="instruction-block"
      v-html="block.text"
    ></div>

    <!-- GAP_FILLING -->
    <div v-else-if="block.type === 'GAP_FILLING'">
      <!-- Assuming you have a GapFilling component that emits `answer-update` -->
      <GapFilling
        :template-string="block.text"
        @answer-update="emitAnswerUpdate"
      />
    </div>

    <!-- MULTIPLE_CHOICE -->
    <div v-else-if="block.type === 'MULTIPLE_CHOICE'" class="question-block">
      <p class="question-text" v-html="block.text"></p>
      <div class="options-container">
        <label v-for="option in block.options" :key="option" class="option">
          <input
            v-if="!block.allowMultiple"
            type="radio"
            :name="block.id"
            :value="option"
            @change="updateAnswer(block.id, option)"
          />
          <input
            v-else
            type="checkbox"
            :value="option"
            @change="
              updateMultipleAnswers(block.id, option, $event.target.checked)
            "
          />
          <span>{{ option }}</span>
        </label>
      </div>
    </div>

    <!-- MATCHING -->
    <div v-else-if="block.type === 'MATCHING'" class="question-block">
      <p class="instruction-text" v-html="block.instruction"></p>
      <div class="matching-grid">
        <div class="options-list-column">
          <h4>Options</h4>
          <div
            class="options-box"
            v-html="formatOptionsList(block.options)"
          ></div>
        </div>
        <div class="items-to-match-column">
          <h4>Questions</h4>
          <div
            v-for="item in block.itemsToMatch"
            :key="item.id"
            :id="item.id"
            class="item-to-match"
          >
            <label :for="`match_q_${item.id}`" v-html="item.text"></label>
            <input
              type="text"
              :id="`match_q_${item.id}`"
              @input="updateAnswer(item.id, $event.target.value.trim())"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- IMAGE -->
    <div v-else-if="block.type === 'IMAGE'" class="image-block">
      <img :src="block.imageUrl" :alt="block.caption || 'Test Image'" />
      <p v-if="block.caption" class="caption" v-html="block.caption"></p>
    </div>

    <!-- TRUE_FALSE_NOT_GIVEN -->
    <div
      v-else-if="block.type === 'TRUE_FALSE_NOT_GIVEN'"
      class="question-block"
    >
      <p class="instruction-text" v-html="block.instruction"></p>
      <div
        v-for="statement in block.statements"
        :key="statement.id"
        :id="statement.id"
        class="statement-item"
      >
        <p class="statement-text" v-html="statement.text"></p>
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

    <div v-else-if="block.type === 'MAP_LABELING'" class="question-block">
      <p class="instruction-text" v-html="block.instruction"></p>
      <div class="map-labeling-grid">
        <div class="map-image-container">
          <img
            v-if="block.imageUrl"
            :src="block.imageUrl"
            alt="Map or Diagram"
            class="display-image"
          />
        </div>
        <div class="labels-container">
          <div class="options-box" v-if="block.options && block.options.length">
            <strong>Word Bank:</strong>
            <p>{{ block.options.join(", ") }}</p>
          </div>
          <h4>Labels to identify:</h4>
          <div
            v-for="label in block.labels"
            :key="label.id"
            :id="label.id"
            class="item-to-match"
          >
            <label :for="`map_q_${label.id}`" v-html="label.text"></label>
            <input
              type="text"
              :id="`map_q_${label.id}`"
              @input="updateAnswer(label.id, $event.target.value.trim())"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- SUMMARY_COMPLETION -->
    <div v-else-if="block.type === 'SUMMARY_COMPLETION'" class="question-block">
      <p class="instruction-text" v-html="block.instruction"></p>
      <div
        v-if="block.options && block.options.length"
        class="options-box word-bank"
      >
        {{ block.options.join(" | ") }}
      </div>
      <div class="summary-text">
        <!-- This assumes a GapFilling component can handle the summary text -->
        <GapFilling
          :template-string="block.text"
          @answer-update="emitAnswerUpdate"
        />
      </div>
    </div>

    <!-- WRITING_PROMPT (Display Only) -->
    <div
      v-else-if="block.type === 'WRITING_PROMPT'"
      class="writing-prompt-block"
    >
      <div class="task-container" v-if="block.task1_prompt">
        <h4>Writing Task 1</h4>
        <p class="prompt-text" v-html="block.task1_prompt"></p>
        <img
          v-if="block.task1_imageUrl"
          :src="block.task1_imageUrl"
          alt="Task 1 Image"
          class="display-image"
        />
      </div>
      <div class="task-container" v-if="block.task2_prompt">
        <h4>Writing Task 2</h4>
        <p class="prompt-text" v-html="block.task2_prompt"></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import GapFilling from "../UserTestTaking/GappFilling.vue";

// eslint-disable-next-line no-undef
const props = defineProps({
  block: { type: Object, required: true },
  userAnswers: { type: Object, default: () => ({}) },
  isDisplayOnly: { type: Boolean, default: false }, // Crucial for the Writing section
});

// eslint-disable-next-line no-undef
const emit = defineEmits(["answer-update"]);

// Universal emitter for GapFilling component
const emitAnswerUpdate = (payload) => {
  emit("answer-update", payload);
};

const updateAnswer = (questionId, answer) => {
  emit("answer-update", { [questionId]: answer });
};

const updateMultipleAnswers = (questionId, option, isChecked) => {
  const currentAnswers = props.userAnswers[questionId] || [];
  let newAnswers;
  if (isChecked) {
    newAnswers = [...new Set([...currentAnswers, option])];
  } else {
    newAnswers = currentAnswers.filter((ans) => ans !== option);
  }
  emit("answer-update", { [questionId]: newAnswers });
};

const formatOptionsList = (options) => {
  if (!options) return "";
  return "<ul>" + options.map((opt) => `<li>${opt}</li>`).join("") + "</ul>";
};
</script>

<style scoped>
.block-display-container {
  padding: 15px 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 20px;
}
.instruction-block {
  font-size: 1.1em;
  font-weight: bold;
  font-style: italic;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  line-height: 1.6;
}
.question-block {
  margin-top: 20px;
}
.question-text,
.statement-text,
.instruction-text,
.prompt-text {
  font-size: 1rem;
  margin-bottom: 15px;
  line-height: 1.7;
}
.options-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 5px;
  border: 1px solid #dee2e6;
  cursor: pointer;
  transition: background-color 0.2s;
}
.option:hover {
  background-color: #f1f3f5;
}
.option input {
  cursor: pointer;
  transform: scale(1.2);
}
.statement-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 20px;
  padding: 12px 0;
  border-top: 1px solid #f1f3f5;
}
.matching-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
}
.options-box {
  background-color: #f8f9fa;
  padding: 5px 15px;
  border-radius: 5px;
  border: 1px solid #e9ecef;
}
.options-box ul {
  padding-left: 20px;
  margin: 10px 0;
}
.item-to-match {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}
.item-to-match label {
  margin-bottom: 8px;
}
.item-to-match input,
.answer-select {
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}
.word-bank {
  font-style: italic;
  color: #495057;
  padding: 15px;
  margin-bottom: 20px;
}
.summary-text {
  line-height: 2;
}
.image-block img,
.writing-prompt-block img {
  max-width: 100%;
  border-radius: 5px;
  border: 1px solid #dee2e6;
  margin: 15px 0;
}
.image-block .caption {
  font-style: italic;
  color: #6c757d;
  text-align: center;
  margin-top: -5px;
}
.writing-prompt-block h4 {
  margin-top: 25px;
  margin-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 10px;
}
</style>
