<template>
  <div class="test-builder">
    <div v-if="!currentTemplate" class="dashboard-card create-shell-card">
      <h1>Create New Test Template</h1>
      <p>
        First, give your test a title and description. You will add questions
        and content in the next step.
      </p>
      <form @submit.prevent="handleCreateTemplateShell">
        <div class="form-group">
          <label for="template-title">Test Title</label>
          <input
            id="template-title"
            v-model="newTemplate.title"
            type="text"
            placeholder="e.g., IELTS Academic Mock #9"
            required
          />
        </div>
        <div class="form-group">
          <label for="template-desc">Test Description</label>
          <textarea
            id="template-desc"
            v-model="newTemplate.description"
            placeholder="A full-length mock test covering all sections."
          ></textarea>
        </div>
        <button type="submit" class="btn-primary">
          Create and Go to Editor
        </button>
      </form>
    </div>

    <!-- The Main Test Editor -->
    <div v-else class="editor-container">
      <h1>
        Editing: <em>{{ currentTemplate.title }}</em>
      </h1>
      <div class="tabs">
        <button
          v-for="section in currentTemplate.sections"
          :key="section.id"
          @click="activeSectionType = section.type"
          :class="{ active: activeSectionType === section.type }"
        >
          <i :class="getIconForSection(section.type)"></i> {{ section.type }}
        </button>
      </div>

      <div class="dashboard-card section-editor-card">
        <div v-if="activeSection">
          <div class="lego-builder-grid">
            <!-- Left Side: Live Preview & Main Content -->
            <div class="preview-pane">
              <h3>Test Structure & Content</h3>
              <div class="form-group">
                <label v-if="activeSection.type === 'LISTENING'"
                  >Audio URL</label
                >
                <label v-if="activeSection.type === 'READING'"
                  >Reading Passage</label
                >
                <input
                  v-if="activeSection.type === 'LISTENING'"
                  v-model="activeSection.content.audioUrl"
                  type="url"
                  placeholder="Paste your audio URL here"
                />
                <textarea
                  v-if="activeSection.type === 'READING'"
                  v-model="activeSection.content.passageText"
                  rows="8"
                ></textarea>
              </div>
              <hr />
              <div class="block-list-wrapper">
                <div
                  v-if="
                    !activeSection.content.blocks ||
                    activeSection.content.blocks.length === 0
                  "
                  class="no-blocks"
                >
                  <i class="fa-solid fa-cubes"></i>
                  <p>No blocks added yet.</p>
                  <span>Use the palette on the right to build your test.</span>
                </div>
                <div v-else class="block-list">
                  <div
                    v-for="(block, index) in activeSection.content.blocks"
                    :key="block.id"
                    class="block-item"
                    :class="{ 'is-editing': editingBlockIndex === index }"
                    @click="selectBlockForEditing(index)"
                  >
                    <div
                      class="block-preview"
                      v-html="renderBlockPreview(block)"
                    ></div>
                    <div class="block-actions">
                      <button
                        @click.stop="deleteBlock(index)"
                        title="Delete Block"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side: Block Palette & Editor Pane -->
            <div class="editor-pane">
              <div v-if="editingBlock === null" class="palette-container">
                <h3>Question Types</h3>
                <p>Choose a type to add to the test:</p>
                <div class="block-palette">
                  <button @click="addBlock('INSTRUCTION')">
                    <i class="fa-solid fa-align-left"></i> Instruction
                  </button>
                  <button @click="addBlock('GAP_FILLING')">
                    <i class="fa-solid fa-pen-ruler"></i> Gap Filling
                  </button>
                  <button @click="addBlock('MULTIPLE_CHOICE')">
                    <i class="fa-solid fa-list-check"></i> Multiple Choice
                  </button>
                  <button @click="addBlock('MATCHING')">
                    <i class="fa-solid fa-arrows-left-right-to-line"></i>
                    Matching
                  </button>
                  <button @click="addBlock('IMAGE')">
                    <i class="fa-solid fa-image"></i> Image
                  </button>
                </div>
              </div>
              <div v-else class="editor-form-container">
                <h3>Editing Block</h3>
                <div
                  v-if="editingBlock.type === 'INSTRUCTION'"
                  class="block-editor-form"
                >
                  <div class="form-group">
                    <label>Instruction Text</label>
                    <textarea v-model="editingBlock.text" rows="4"></textarea>
                  </div>
                </div>

                <div
                  v-if="editingBlock.type === 'GAP_FILLING'"
                  class="block-editor-form"
                >
                  <div class="form-group">
                    <label>Line Text with Gaps</label>
                    <textarea
                      v-model="editingBlock.text"
                      rows="4"
                      placeholder="e.g., Name: John {{q1}}"
                    ></textarea>
                    <p v-pre class="help-text">
                      Use {{ "name" }} to create gaps.
                    </p>
                  </div>
                  <div class="form-group">
                    <label>Answers for this Line</label>
                    <div
                      v-if="findPlaceholders(editingBlock.text).length === 0"
                      class="help-text"
                    >
                      No gaps found in the text above.
                    </div>
                    <div
                      v-for="placeholder in findPlaceholders(editingBlock.text)"
                      :key="placeholder"
                      class="answer-input"
                    >
                      <label>{{ placeholder }}:</label>
                      <input
                        v-model="editingBlock.answers[placeholder]"
                        type="text"
                      />
                    </div>
                  </div>
                </div>

                <div
                  v-if="editingBlock.type === 'MULTIPLE_CHOICE'"
                  class="block-editor-form"
                >
                  <div class="form-group">
                    <label>Question Text</label>
                    <textarea v-model="editingBlock.text" rows="3"></textarea>
                  </div>
                  <div class="form-group">
                    <label>Options & Correct Answer</label>
                    <p class="help-text">
                      Select the correct answer by clicking the circle. Edit the
                      text for each option.
                    </p>
                    <div
                      v-for="(option, index) in editingBlock.options"
                      :key="index"
                      class="option-editor-item"
                    >
                      <input
                        type="radio"
                        :name="`correct_answer_${editingBlock.id}`"
                        :value="option"
                        v-model="editingBlock.answers[editingBlock.id]"
                      />
                      <input
                        type="text"
                        v-model="editingBlock.options[index]"
                        class="option-input"
                      />
                      <button
                        @click="deleteOption(index)"
                        class="btn-delete-option"
                        title="Delete Option"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div class="add-option-container">
                    <input
                      class="addOption"
                      type="text"
                      v-model="newOptionText"
                      placeholder="Type new option text..."
                      @keyup.enter="addOption"
                    />
                    <button @click.prevent="addOption" class="btn-add-option">
                      Add Option
                    </button>
                  </div>
                </div>

                <!-- -- matching -->
                <div
                  v-if="editingBlock.type === 'MATCHING'"
                  class="block-editor-form"
                >
                  <div class="form-group">
                    <label>Instruction Text</label>
                    <textarea
                      v-model="editingBlock.instruction"
                      rows="3"
                    ></textarea>
                  </div>
                  <div class="form-group">
                    <label>Items to Match (Questions)</label>
                    <div
                      v-for="(item, index) in editingBlock.itemsToMatch"
                      :key="index"
                      class="dynamic-list-item"
                    >
                      <input type="text" v-model="item.text" />
                      <button
                        @click="deleteMatchingItem(index)"
                        class="btn-delete-item"
                      >
                        ×
                      </button>
                    </div>
                    <button
                      @click.prevent="addMatchingItem"
                      class="btn-add-item"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div class="form-group">
                    <label>Options (Choices)</label>
                    <div
                      v-for="(option, index) in editingBlock.options"
                      :key="index"
                      class="dynamic-list-item"
                    >
                      <input
                        type="text"
                        v-model="editingBlock.options[index]"
                      />
                      <button
                        @click="deleteMatchingOption(index)"
                        class="btn-delete-item"
                      >
                        ×
                      </button>
                    </div>
                    <button
                      @click.prevent="addMatchingOption"
                      class="btn-add-item"
                    >
                      + Add Option
                    </button>
                  </div>
                  <div class="form-group">
                    <label>Correct Answers</label>
                    <div
                      v-for="item in editingBlock.itemsToMatch"
                      :key="item.id"
                      class="answer-input"
                    >
                      <label :title="item.text">{{ item.id }}:</label>
                      <input
                        v-model="editingBlock.answers[item.id]"
                        type="text"
                        placeholder="e.g., A"
                      />
                    </div>
                  </div>
                </div>

                <div
                  v-if="editingBlock.type === 'IMAGE'"
                  class="block-editor-form"
                >
                  <div class="form-group">
                    <label>Image URL</label>
                    <input
                      v-model="editingBlock.imageUrl"
                      type="url"
                      placeholder="https://your-r2-bucket.com/image.png"
                      required
                    />
                    <p class="help-text">
                      Upload the image to your cloud storage first, then paste
                      the public URL here.
                    </p>
                  </div>
                  <div class="form-group">
                    <label>Image Caption (Optional)</label>
                    <input
                      v-model="editingBlock.caption"
                      type="text"
                      placeholder="A short description of the image"
                    />
                  </div>
                </div>
                <button
                  @click="clearEditingState"
                  class="btn-secondary block_done"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
          <hr />
          <button @click="handleSaveSection" class="btn-save-section">
            <i class="fa-solid fa-save"></i> Save All Changes to
            {{ activeSection.type }} Section
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../services/api";
import debounce from "lodash.debounce";
export default {
  name: "TestBuilderView",
  // 1. Declare the 'templateId' from the URL as a prop
  props: {
    templateId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      newTemplate: { title: "", description: "" },
      currentTemplate: null,
      activeSectionType: "LISTENING",
      editingBlockIndex: null,
      newOptionText: "",
      isLoading: false,
      isSaving: false,
      debouncedSave: null,
    };
  },
  computed: {
    activeSection() {
      if (!this.currentTemplate) return null;
      return this.currentTemplate.sections?.find(
        (s) => s.type === this.activeSectionType
      );
    },
    editingBlock() {
      if (
        this.editingBlockIndex === null ||
        !this.activeSection?.content.blocks
      )
        return null;
      return this.activeSection.content.blocks[this.editingBlockIndex];
    },
  },
  methods: {
    async handleCreateTemplateShell() {
      try {
        const response = await api.createTestTemplate(this.newTemplate);
        this.$router.push({
          name: "TestBuilder",
          params: { templateId: response.data.id },
        });
      } catch (err) {
        alert("Failed to create template.");
      }
    },
    async fetchTemplateData() {
      if (!this.templateId) {
        this.currentTemplate = null;
        return;
      }
      this.isLoading = true;
      try {
        const response = await api.getTemplateDetails(this.templateId);
        this.currentTemplate = response.data;
      } catch (err) {
        alert("Failed to load test template. It may have been deleted.");
        this.$router.push({ name: "TestBuilder" });
      } finally {
        this.isLoading = false;
      }
    },
    async handleSaveSection(isAutoSave = false) {
      if (!this.activeSection || this.isSaving) return;
      this.isSaving = true;

      const finalAnswers = {};
      if (this.activeSection.content.blocks) {
        for (const block of this.activeSection.content.blocks) {
          if (
            (block.type === "GAP_FILLING" ||
              block.type === "MULTIPLE_CHOICE") &&
            block.answers
          ) {
            Object.assign(finalAnswers, block.answers);
          }
        }
      }

      try {
        await api.updateSection(
          this.currentTemplate.id,
          this.activeSection.type,
          {
            content: this.activeSection.content,
            answers: finalAnswers,
          }
        );
        if (!isAutoSave) {
          alert(`${this.activeSection.type} section saved successfully!`);
        }
      } catch (err) {
        if (!isAutoSave) {
          alert("Failed to save section changes.");
        }
        console.error("Save failed:", err);
      } finally {
        this.isSaving = false;
      }
    },

    addBlock(type) {
      if (!this.activeSection.content.blocks) {
        this.activeSection.content.blocks = [];
      }
      const newBlock = {
        id: `block_${Date.now()}`,
        type: type,
        text: "",
        answers: {},
      };

      if (type === "GAP_FILLING") {
        newBlock.answers = {};
      }

      if (type === "MULTIPLE_CHOICE") {
        newBlock.text = "Which is the correct answer?";
        newBlock.options = ["Option A", "Option B", "Option C"];

        newBlock.answers = { [newBlock.id]: "Option A" };
      }

      //matching
      if (type === "MATCHING") {
        newBlock.instruction = "Match the following items...";
        newBlock.itemsToMatch = [
          { id: `q_${Date.now()}_1`, text: "First item to match" },
        ];
        newBlock.options = ["A) First option", "B) Second option"];
        // Initialize answers object for items
        newBlock.itemsToMatch.forEach((item) => {
          newBlock.answers[item.id] = "";
        });
      }

      if (type === "IMAGE") {
        newBlock.imageURL = "";
        newBlock.IMGcaption = "";
      }
      this.activeSection.content.blocks.push(newBlock);
      this.editingBlockIndex = this.activeSection.content.blocks.length - 1;
    },
    addOption() {
      if (!this.newOptionText.trim()) return;
      if (this.editingBlock?.type !== "MULTIPLE_CHOICE") return;
      if (!Array.isArray(this.editingBlock.options)) {
        this.editingBlock.options = [];
      }
      this.editingBlock.options.push(this.newOptionText.trim());
      this.newOptionText = "";
    },
    deleteOption(index) {
      if (this.editingBlock?.type !== "MULTIPLE_CHOICE") return;
      const deletedOption = this.editingBlock.options[index];
      this.editingBlock.options.splice(index, 1);
      if (this.editingBlock.answers[this.editingBlock.id] === deletedOption) {
        this.editingBlock.answers[this.editingBlock.id] = "";
      }
    },
    selectBlockForEditing(index) {
      this.editingBlockIndex = index;
    },
    clearEditingState() {
      this.editingBlockIndex = null;
    },
    deleteBlock(index) {
      if (!confirm("Are you sure you want to delete this block?")) return;
      this.activeSection.content.blocks.splice(index, 1);
      if (this.editingBlockIndex === index) {
        this.editingBlockIndex = null;
      }
    },
    findPlaceholders(text) {
      if (!text) return [];
      const matches = text.match(/\{\{([a-zA-Z0-9]+)\}\}/g) || [];
      return [...new Set(matches.map((p) => p.replace(/\{|\}/g, "")))];
    },

    renderBlockPreview(block) {
      let hasContent = false;
      switch (block.type) {
        case "INSTRUCTION":
        case "GAP_FILLING":
        case "MULTIPLE_CHOICE":
          // These types are considered to have content if their 'text' property is not empty.
          if (block.text && block.text.trim() !== "") hasContent = true;
          break;
        case "MATCHING":
          // A matching block has content if it has an instruction.
          if (block.instruction && block.instruction.trim() !== "")
            hasContent = true;
          break;
        case "IMAGE":
          // An image block has content if it has a URL.
          if (block.imageUrl && block.imageUrl.trim() !== "") hasContent = true;
          break;
      }

      //      If the block is empty, show a helpful placeholder.
      if (!hasContent) {
        switch (block.type) {
          case "INSTRUCTION":
            return '<span class="placeholder-text">Instruction (click to edit)</span>';
          case "GAP_FILLING":
            return '<span class="placeholder-text">Gap-Fill Line (click to edit)</span>';
          case "MULTIPLE_CHOICE":
            return '<span class="placeholder-text">Multiple Choice (click to edit)</span>';
          case "MATCHING":
            return '<span class="placeholder-text">Matching (click to edit)</span>';
          case "IMAGE":
            return '<span class="placeholder-text">Image Block (click to add URL)</span>';
          default:
            return '<span class="placeholder-text">Click to edit...</span>';
        }
      }

      switch (block.type) {
        case "INSTRUCTION":
          return `<strong class="instruction-preview">${block.text}</strong>`;
        case "GAP_FILLING":
          return block.text.replace(
            /\{\{([a-zA-Z0-9]+)\}\}/g,
            '<span class="blank">_________</span>'
          );
        case "MULTIPLE_CHOICE":
          // eslint-disable-next-line no-case-declarations
          let mcHtml = `<p>${block.text}</p>`;
          if (block.options && block.options.length > 0) {
            mcHtml += '<ul class="preview-options-list">';
            block.options.forEach((opt) => {
              mcHtml += `<li>${opt}</li>`;
            });
            mcHtml += "</ul>";
          }
          return mcHtml;
        case "MATCHING":
          // eslint-disable-next-line no-case-declarations
          let matchHtml = `<strong class="instruction-preview">${block.instruction}</strong>`;
          if (block.options && block.options.length > 0) {
            matchHtml += '<div class="preview-matching-options">';
            block.options.forEach((opt) => {
              matchHtml += `<span>${opt}</span>`;
            });
            matchHtml += "</div>";
          }
          if (block.itemsToMatch && block.itemsToMatch.length > 0) {
            matchHtml += '<ul class="preview-matching-items">';
            block.itemsToMatch.forEach((item) => {
              matchHtml += `<li>${item.text}</li>`;
            });
            matchHtml += "</ul>";
          }
          return matchHtml;
        case "IMAGE":
          // eslint-disable-next-line no-case-declarations
          let imgHtml = `<figure class="preview-image-container">`;
          imgHtml += `<img src="${block.imageUrl}" alt="Test Image Preview" />`;
          if (block.caption) {
            imgHtml += `<figcaption>${block.caption}</figcaption>`;
          }
          imgHtml += `</figure>`;
          return imgHtml;
      }

      return ""; // Default fallback
    },

    addMatchingItem() {
      if (this.editingBlock?.type !== "MATCHING") return;
      const newItem = {
        id: `q_${Date.now()}_item${this.editingBlock.itemsToMatch.length + 1}`,
        text: "New item to match",
      };
      this.editingBlock.itemsToMatch.push(newItem);
      this.editingBlock.answers[newItem.id] = ""; // Initialize answer
    },
    deleteMatchingItem(index) {
      if (this.editingBlock?.type !== "MATCHING") return;
      const itemToDelete = this.editingBlock.itemsToMatch[index];
      this.editingBlock.itemsToMatch.splice(index, 1);
      delete this.editingBlock.answers[itemToDelete.id];
    },
    addMatchingOption() {
      if (this.editingBlock?.type !== "MATCHING") return;
      this.editingBlock.options.push("New option");
    },
    deleteMatchingOption(index) {
      if (this.editingBlock?.type !== "MATCHING") return;
      const optionToDelete = this.editingBlock.options[index];
      this.editingBlock.options.splice(index, 1);
      // If this option was used as an answer, clear those answers
      for (const key in this.editingBlock.answers) {
        if (this.editingBlock.answers[key] === optionToDelete) {
          this.editingBlock.answers[key] = "";
        }
      }
    },

    getIconForSection(type) {
      const icons = {
        LISTENING: "fa-solid fa-headphones",
        READING: "fa-solid fa-book-open",
        WRITING: "fa-solid fa-pen-nib",
      };
      return icons[type] || "fa-solid fa-question-circle";
    },
  },
  created() {
    this.fetchTemplateData();
    // Initialize the debounced save function when the component is created
    this.debouncedSave = debounce(
      (isAutoSave) => this.handleSaveSection(isAutoSave),
      1000
    ); // 1 second delay
  },
  watch: {
    activeSection: {
      handler(newValue, oldValue) {
        // We only trigger auto-save if the component is loaded and not in its initial state
        if (oldValue && this.currentTemplate) {
          this.debouncedSave(true);
        }
      },
      deep: true, // 'deep' tells Vue to watch for changes inside nested objects and arrays
    },
    templateId() {
      this.fetchTemplateData();
    },
  },
};
</script>

<style scoped>
/* --- Main Layout & General --- */
.test-builder h1 {
  margin-bottom: 30px;
  font-weight: 700;
  color: #111827;
}
.create-shell-card {
  max-width: 600px;
  margin: 40px auto;
}
.tabs {
  margin-bottom: -1px;
  position: relative;
  z-index: 2;
}
.tabs button {
  padding: 12px 25px;
  border: 1px solid #d1d5db;
  border-bottom: none;
  background-color: #f3f4f6;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  margin-right: 5px;
  font-size: 16px;
  color: #4b5563;
  transition: all 0.2s ease;
}
.tabs button.active {
  background-color: #fff;
  border-bottom-color: #fff;
  font-weight: 600;
  color: #1f2937;
}
.tabs button i {
  margin-right: 8px;
}
.section-editor-card {
  border-top-left-radius: 0;
  position: relative;
  z-index: 1;
}
hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2rem 0;
}

/* --- Form Styles --- */
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 14px;
  color: #374151;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1b1f25;
  box-shadow: 0 0 0 2px rgba(18, 35, 61, 0.4);
}
.help-text {
  font-size: 13px;
  color: #6b7280;
  margin-top: 5px;
}

/* --- Lego Builder Specific Styles --- */
.lego-builder-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 30px;
}

/* Left Side: Preview Pane */
.preview-pane h3,
.editor-pane h3 {
  font-size: 1.2rem;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
  margin-top: 0;
}
.block-list-wrapper {
  min-height: 400px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
}
.no-blocks {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}
.no-blocks i {
  font-size: 32px;
  margin-bottom: 15px;
  display: block;
}
.block-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fff;
}
.block-item:hover {
  border-color: #9ca3af;
}
.block-item.is-editing {
  border-color: #1b1f25;
  box-shadow: 0 0 0 3px rgba(18, 35, 61, 0.4);
  background-color: #eff6ff;
}
.block-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.block-item:hover .block-actions,
.block-item.is-editing .block-actions {
  opacity: 1;
}
.block-actions button {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 5px;
}
.block-actions button:hover {
  color: #1f2937;
}

/* Right Side: Editor Pane */
.editor-pane {
  background-color: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.palette-container,
.editor-form-container {
  height: 100%;
}
.no-selection {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.no-selection i {
  font-size: 24px;
  margin-bottom: 10px;
  display: block;
}
.block-palette button {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 10px;
  background-color: #fff;
  border: 1px solid #d1d5db;
  cursor: pointer;
  padding: 12px 15px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.block-palette button:hover {
  border-color: #1c1c1c;
  color: #1b1f25;
}
.block-palette i {
  margin-right: 10px;
}
.answer-input {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.answer-input label {
  font-weight: bold;
  font-family: monospace;
}

.option-editor-item {
  display: grid;
  grid-template-columns: auto 1fr auto; /* Radio | Text Input | Delete Button */
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.option-editor-item input[type="radio"] {
  /* Style radio buttons to look nicer */
  appearance: none;
  background-color: #fff;
  margin: 0;
  font: inherit;
  color: currentColor;
  width: 1.15em;
  height: 1.15em;
  border: 0.15em solid currentColor;
  border-radius: 5px;
  transform: translateY(-0.075em);
  display: grid;
  place-content: center;
  cursor: pointer;
}
.option-editor-item input[type="radio"]::before {
  content: "";
  width: 0.65em;
  height: 0.65em;
  border-radius: 50%;
  transform: scale(0);
  transition: 120ms transform ease-in-out;
  box-shadow: inset 1em 1em #2563eb;
}
.option-editor-item input[type="radio"]:checked::before {
  transform: scale(1);
}
.option-input {
  flex-grow: 1;
}
.btn-delete-option {
  background-color: transparent;
  color: #9ca3af;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  font-size: 20px;
  line-height: 1;
}
.btn-delete-option:hover {
  background-color: #fee2e2;
  color: #ef4444;
}
.add-option-container {
  display: flex;
  gap: 10px;
  margin: 15px 0;
  border-top: 1px dashed #e5e7eb;
  padding-top: 15px;
}
.add-option-container input {
  flex-grow: 1;
  padding: 0.5rem;
  border-radius: 5px;
}
.btn-add-option {
  background-color: #495057;
  color: #e9ecef;
  border: 1px solid #dee2e6;
  font-weight: 500;
  padding: 0 15px;
  cursor: pointer;
  border-radius: 5px;
}
/* --matching */
.dynamic-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.dynamic-list-item input {
  flex-grow: 1;
}
.btn-delete-item {
  background-color: #fee2e2;
  color: #ef4444;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  line-height: 1;
}
.btn-add-item {
  background-color: #f0f0f0;
  border: 1px dashed #ccc;
  width: 100%;
  padding: 8px;
  cursor: pointer;
  margin-top: 5px;
  border-radius: 4px;
}

/* --- Buttons --- */
.btn-primary {
  background-color: #121418;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
.btn-secondary {
  background-color: #494e57;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
.btn-save-section {
  margin-top: 20px;
  width: 100%;
  padding: 15px;
  font-size: 16px;
  background-color: #1b1f25;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.block_done {
  width: 100%;
}
</style>

<style>
/* Global styles are needed for v-html to correctly style the preview */
.block-preview strong {
  font-style: italic;
  display: block;
  color: #4b5563;
  margin-bottom: 8px;
}
.block-preview .blank {
  font-weight: 600;
  color: #292a2a;
  background-color: #dbeafe;
  padding: 0 4px;
  border-bottom: 1px solid #344252;
  border-radius: 2px;
}
.placeholder-text {
  font-style: italic;
  color: #55585e;
}
.preview-options-list {
  list-style-type: upper-alpha;
  padding-left: 20px;
  margin: 5px 0 0 0;
  font-size: 14px;
}
.preview-matching-options {
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
}
.preview-matching-options span {
  display: block;
  font-size: 14px;
}
.preview-matching-items {
  list-style-type: decimal;
  padding-left: 20px;
}
.preview-image-container {
  margin: 10px 0;
  padding: 0;
  text-align: center;
}
.preview-image-container img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}
.preview-image-container figcaption {
  font-size: 13px;
  color: #6b7280;
  margin-top: 5px;
  font-style: italic;
}
</style>
