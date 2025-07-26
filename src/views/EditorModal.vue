<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>
        {{ isEditing ? "Edit Question Group" : "Add New Question Group" }}
      </h2>

      <!-- Form for NOTE_COMPLETION -->
      <div v-if="localGroup.type === 'NOTE_COMPLETION'">
        <div class="form-group">
          <label>Instruction Text</label>
          <input
            v-model="localGroup.instruction"
            type="text"
            placeholder="e.g., Questions 1-5. Complete the notes below."
            required
          />
        </div>
        <div class="form-group">
          <label>Template with Placeholders</label>
          <textarea
            v-model="localGroup.template"
            rows="8"
            placeholder="e.g., Name: {{q1}}\nAddress: 221B {{q2}} Street"
          ></textarea>
          <p class="help-text">
            Use double curly braces like {{ q1 }}, {{ q2 }} to create the gaps
            to be filled.
          </p>
        </div>

        <hr />
        <h3>Correct Answers</h3>
        <p v-if="placeholders.length === 0" class="help-text">
          No placeholders found in the template above. Add some to define
          answers.
        </p>
        <div
          v-for="placeholder in placeholders"
          :key="placeholder"
          class="form-group-inline"
        >
          <label>{{ placeholder }}:</label>
          <input v-model="localAnswers[placeholder]" type="text" required />
        </div>
      </div>

      <!-- Add v-if blocks for other question types here in the future -->

      <div class="modal-actions">
        <button @click="$emit('close')" type="button" class="btn-secondary">
          Cancel
        </button>
        <button @click="save" class="btn-primary">Save Group</button>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, computed, onMounted } from "vue";

export default {
  name: "QuestionGroupEditorModal",
  props: {
    group: { type: Object, required: true }, // The group data to edit, or a new shell
  },
  emits: ["close", "save"],
  setup(props, { emit }) {
    // Use Vue 3's Composition API for more complex reactive logic
    const localGroup = reactive({ ...props.group });
    const localAnswers = reactive({});

    // A computed property that automatically finds placeholders like {{q1}} in the template
    const placeholders = computed(() => {
      if (!localGroup.template) return [];
      const matches =
        localGroup.template.match(/\{\{([a-zA-Z0-9]+)\}\}/g) || [];
      // Return unique, clean placeholder names like ["q1", "q2"]
      return [...new Set(matches.map((p) => p.replace(/\{|\}/g, "")))];
    });

    const isEditing = computed(() => !!props.group.id);

    // When the component is created, populate the answers from the prop
    onMounted(() => {
      if (props.group.answers) {
        Object.assign(localAnswers, props.group.answers);
      }
    });

    function save() {
      // Create the final payload to send back to the parent
      const saveData = {
        group: {
          id: localGroup.id || `group_${Date.now()}`,
          type: localGroup.type,
          instruction: localGroup.instruction,
          template: localGroup.template,
        },
        answers: { ...localAnswers },
      };
      emit("save", saveData);
    }

    return { localGroup, localAnswers, placeholders, isEditing, save };
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}
.help-text {
  font-size: 13px;
  color: #666;
  margin-top: 5px;
}
.form-group-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.form-group-inline label {
  font-weight: bold;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}
.note-template {
  line-height: 2;
  white-space: pre-wrap;
}
</style>
