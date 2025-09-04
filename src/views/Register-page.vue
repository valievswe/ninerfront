<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>Register</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <input
            v-model="username"
            type="text"
            placeholder="Username"
            required
          />
        </div>
        <div class="form-group">
          <input v-model="email" type="email" placeholder="Email" required />
        </div>
        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            required
          />
        </div>
        <div class="form-group">
          <input
            v-model="firstName"
            type="text"
            placeholder="First Name"
            required
          />
        </div>
        <div class="form-group">
          <input
            v-model="lastName"
            type="text"
            placeholder="Last Name"
            required
          />
        </div>

        <div class="form-group">
          <input
            v-model="personalID"
            required
            type="text"
            placeholder="Personal ID "
          />
        </div>

        <div class="form-group">
          <input
            v-model="phoneNumber"
            type="text"
            placeholder="Phone number"
            required
          />
        </div>

        <button type="submit" class="btn-primary">Register</button>
        <p v-if="error" class="form-feedback error">{{ error }}</p>
        <p v-if="success" class="form-feedback success">{{ success }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import api from "../services/api";

export default {
  name: "RegisterPage",
  data() {
    return {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      personalID: "",
      phoneNumber: "",
      error: null,
      success: null,
    };
  },
  methods: {
    async handleRegister() {
      this.error = null;
      this.success = null;
      try {
        await api.register({
          username: this.username,
          email: this.email,
          password: this.password,
          firstName: this.firstName,
          lastName: this.lastName,
          personalID: this.personalID,
          phoneNumber: this.phoneNumber,
        });

        this.success = "Registration successful! You can now log in.";
        setTimeout(() => {
          this.$router.push("/login");
        }, 1500);
      } catch (err) {
        if (err.response && err.response.data && err.response.data.error) {
          this.error = err.response.data.error;
        } else {
          this.error = "An unexpected error occurred. Please try again.";
        }
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
.success {
  color: #1e8e3e;
}
</style>
