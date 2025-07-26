<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <!-- MODIFIED: Changed from 'email' to 'personalID' -->
        <div class="form-group">
          <input
            v-model="personalID"
            type="text"
            placeholder="Personal ID"
            required
          />
        </div>
        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            required
          />
        </div>
        <button type="submit" class="btn-primary">Login</button>
        <p v-if="error" class="form-feedback error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import api from "../services/api";
import { store } from "../store/store";

export default {
  // Good practice to add a name
  name: "LoginView",
  data() {
    return {
      // MODIFIED: Changed from 'email' to 'personalID'
      personalID: "",
      password: "",
      error: null,
    };
  },
  methods: {
    async handleLogin() {
      this.error = null;
      try {
        // MODIFIED: The object sent to the API now contains personalID
        const response = await api.login({
          personalID: this.personalID,
          password: this.password,
        });

        localStorage.setItem("token", response.data.token);

        store.updateUserFromToken();
        this.$router.push("/dashboard");
      } catch (err) {
        this.error = "Invalid credentials. Please try again.";
        console.error(err);
      }
    },
  },
};
</script>

<style scoped>
.error {
  color: #d93025;
}
</style>
