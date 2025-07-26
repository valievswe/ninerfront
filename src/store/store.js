// src/store/index.js
import { reactive } from "vue";
import { jwtDecode } from "jwt-decode";
import router from "../router"; // Import the router to redirect

export const store = reactive({
  user: null,

  updateUserFromToken() {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);

        // --- THE EXPIRATION CHECK ---
        // The 'exp' claim is in seconds, so we multiply by 1000 to get milliseconds
        if (decodedToken.exp * 1000 < Date.now()) {
          console.log("Token has expired. Logging out.");
          this.logout(); // If expired, log the user out
          return; // Stop execution
        }
        // --- END OF CHECK ---

        this.user = decodedToken;
      } catch (e) {
        console.error("Invalid token:", e);
        this.logout();
      }
    } else {
      this.user = null;
    }
  },

  logout() {
    localStorage.removeItem("token");
    this.user = null;
    // Redirect to login if not already there to prevent being "stuck"
    if (router.currentRoute.value.path !== "/login") {
      router.push("/login");
    }
  },
});
