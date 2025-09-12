export default {
  data() {
    return {
      timer: null,
      timeLeft: 0, // in seconds
    };
  },
  computed: {
    formattedTimeLeft() {
      if (this.timeLeft <= 0) return "00:00";
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    },
  },
  methods: {
    // THIS IS THE NEW "MASTER" FUNCTION TO START A TIMER
    // It checks localStorage first before deciding what to do.
    initializePersistentTimer(durationInSeconds, timerKey, onTimeUpCallback) {
      window.addEventListener("beforeunload", this.handleBeforeUnload);

      const savedEndTime = localStorage.getItem(timerKey);

      if (savedEndTime) {
        // A timer was previously started. We need to RESUME it.
        const endTime = parseInt(savedEndTime, 10);
        const remainingSeconds = Math.round((endTime - Date.now()) / 1000);

        if (remainingSeconds > 0) {
          // If there's time left, start the countdown from the remaining time.
          this.startCountdown(remainingSeconds, timerKey, onTimeUpCallback);
        } else {
          // The timer expired while the user was away.
          this.timeLeft = 0;
          if (onTimeUpCallback) onTimeUpCallback();
        }
      } else {
        // This is the FIRST time this timer is being started.
        // Calculate the exact end time and save it.
        const newEndTime = Date.now() + durationInSeconds * 1000;
        localStorage.setItem(timerKey, newEndTime);
        // Now start the countdown with the full duration.
        this.startCountdown(durationInSeconds, timerKey, onTimeUpCallback);
      }
    },

    // This is your original `startTimer` method, slightly renamed.
    // It's the core countdown logic.
    startCountdown(duration, timerKey, onTimeUpCallback) {
      if (this.timer) clearInterval(this.timer);

      this.timeLeft = duration;
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          // When time is up, clear everything and call the callback.
          this.clearPersistentTimer(timerKey);
          if (onTimeUpCallback) onTimeUpCallback();
        }
      }, 1000);
    },

    clearPersistentTimer(timerKey) {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      window.removeEventListener("beforeunload", this.handleBeforeUnload);
      localStorage.removeItem(timerKey);
    },
  },

  handleBeforeUnload(event) {
    // Standard way to show the browser's native confirmation dialog.
    event.preventDefault();
    // Most modern browsers will show a generic message, but this is required for older ones.
    event.returnValue =
      "Are you sure you want to leave? Your test progress for this section will be submitted.";
    return event.returnValue;
  },

  beforeUnmount() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
};
