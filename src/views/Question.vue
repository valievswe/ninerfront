<template>
  <div class="question-container">
    <p class="question-text">
      <strong>Q{{ questionNumber }}:</strong> {{ question.text }}
    </p>
    <img
      v-if="question.imageUrl"
      :src="question.imageUrl"
      class="question-image"
      alt="Question"
    />

    <!-- RENDERER FOR MULTIPLE_CHOICE -->
    <div v-if="question.type === 'MULTIPLE_CHOICE'" class="options-container">
      <div v-for="option in question.options" :key="option" class="option">
        <input
          type="radio"
          :id="`q${question.id}_${option}`"
          :name="`q_${question.id}`"
          :value="option"
          @change="
            $emit('answer-selected', {
              questionId: question.id,
              answer: option,
            })
          "
        />
        <label :for="`q${question.id}_${option}`">{{ option }}</label>
      </div>
    </div>

    <!-- RENDERER FOR FILL_IN_THE_BLANK -->
    <div v-else-if="question.type === 'FILL_IN_THE_BLANK'">
      <input
        type="text"
        class="blank-input"
        @input="
          $emit('answer-selected', {
            questionId: question.id,
            answer: $event.target.value,
          })
        "
      />
    </div>
  </div>
</template>

<script>
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Question",
  props: {
    question: { type: Object, required: true },
    questionNumber: { type: Number, required: true },
  },
  emits: ["answer-selected"], // Declare the custom event
};
</script>

<style scoped>
.question-container {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}
.question-text {
  font-size: 16px;
  line-height: 1.5;
}
.question-image {
  max-width: 200px;
  margin: 10px 0;
}
.options-container .option {
  margin: 5px 0;
}
.blank-input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
