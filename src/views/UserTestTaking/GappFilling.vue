<!-- src/components/GapFilling.vue -->
<template>
  <div class="gap-fill-container">
    <!-- 
      This template is smart. It loops through an array of "parts".
      Some parts are plain text, and some are placeholder objects.
    -->
    <template v-for="(part, index) in templateParts" :key="index">
      <!-- If it's just text, render it. v-html is safe here because we create the <br> tags. -->
      <span v-if="!part.isPlaceholder" v-html="part.text"></span>
      <!-- If it's a placeholder, render a REAL, REACTIVE input field. -->
      <input
        v-else
        type="text"
        class="gap-input"
        @input="
          $emit('answer-update', {
            questionId: part.id,
            answer: $event.target.value,
          })
        "
      />
    </template>
  </div>
</template>

<script>
export default {
  name: "GapFillRenderer",
  props: {
    // It receives the raw template string like "Name: {{q1}}"
    templateString: { type: String, required: true },
  },
  emits: ["answer-update"],
  computed: {
    // It parses the string into an array of objects.
    // e.g., "Name: {{q1}}" becomes [{ text: "Name: " }, { isPlaceholder: true, id: "q1" }]
    templateParts() {
      if (!this.templateString) return [];
      const parts = [];
      let lastIndex = 0;
      const regex = /\{\{([a-zA-Z0-9]+)\}\}/g;
      let match;
      while ((match = regex.exec(this.templateString)) !== null) {
        if (match.index > lastIndex) {
          parts.push({
            isPlaceholder: false,
            text: this.formatText(
              this.templateString.substring(lastIndex, match.index)
            ),
          });
        }
        parts.push({ isPlaceholder: true, id: match[1] });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < this.templateString.length) {
        parts.push({
          isPlaceholder: false,
          text: this.formatText(this.templateString.substring(lastIndex)),
        });
      }
      return parts;
    },
  },
  methods: {
    formatText(text) {
      // Helper to convert newline characters to <br> tags for correct display
      return text.replace(/\n/g, "<br>");
    },
  },
};
</script>

<style scoped>
.gap-fill-container {
  line-height: 2;
  white-space: pre-wrap;
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
</style>
