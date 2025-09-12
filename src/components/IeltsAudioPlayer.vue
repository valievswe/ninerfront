<!-- src/components/IeltsAudioPlayer.vue -->
<template>
  <div class="audio-player-ielts">
    <!-- The actual audio element is hidden and controlled by our script -->
    <audio
      ref="audioElement"
      :src="src"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoaded"
      @ended="$emit('ended')"
    ></audio>

    <!-- The non-interactive progress bar -->
    <div class="progress-container">
      <div class="time-display">{{ formatTime(currentTime) }}</div>
      <progress
        class="audio-progress"
        :value="currentTime"
        :max="duration"
      ></progress>
      <div class="time-display">{{ formatTime(duration) }}</div>
    </div>

    <!-- The ONLY user control: Volume -->
    <div class="volume-container">
      <i class="fa-solid fa-volume-high"></i>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        class="volume-slider"
        v-model="volume"
        @input="onVolumeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

// Define what the component accepts (props) and what it sends out (emits)
defineProps({ src: String });
defineEmits(["ended"]);

// Internal state
const audioElement = ref(null);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(1); // Default to full volume

// This is the function the parent component will call to start the audio.
// It can only be called once.
const play = () => {
  if (audioElement.value) {
    audioElement.value.play();
  }
};

// Expose the 'play' function so the parent can call it
defineExpose({
  play,
});

// Event handlers to update the UI
const onTimeUpdate = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime;
  }
};

const onLoaded = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration;
  }
};

const onVolumeChange = () => {
  if (audioElement.value) {
    audioElement.value.volume = volume.value;
  }
};

// Helper function to format time nicely
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};
</script>

<style scoped>
.audio-player-ielts {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  background-color: #e9ecef;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  border: 1px solid #dee2e6;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-grow: 1; /* Take up available space */
}

.audio-progress {
  width: 100%;
  /* This makes the progress bar non-clickable */
  pointer-events: none;
}

.time-display {
  font-family: monospace;
  font-size: 0.9em;
  color: #495057;
}

.volume-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-slider {
  cursor: pointer;
}
</style>
