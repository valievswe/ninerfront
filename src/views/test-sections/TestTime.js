export default {
  data() {
    return {
      timer: null,
      timeLeft: 0,
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
    startTimer(durationInSeconds, onTimeUpCallback) {
      // Clear any existing timer before starting a new one
      if (this.timer) clearInterval(this.timer);

      this.timeLeft = durationInSeconds;
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          clearInterval(this.timer);
          this.timer = null;
          // If a callback function was provided, call it when time is up
          if (onTimeUpCallback) onTimeUpCallback();
        }
      }, 1000);
    },
  },

  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
};
