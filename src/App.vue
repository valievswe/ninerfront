<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-links">
        <!-- Links for ANY Logged-In User (Admin OR User) -->
        <router-link v-if="isLoggedIn" to="/dashboard" class="nav-item"
          >Dashboard</router-link
        >

        <!-- Links ONLY for Users with the USER role -->
        <router-link v-if="isUser" to="/tests" class="nav-item"
          >Take a Test</router-link
        >

        <!-- Links ONLY for Users with the ADMIN role -->
        <template v-if="isAdmin">
          <router-link to="/admin" class="nav-item"
            >User Management</router-link
          >
          <router-link to="/admin/tests" class="nav-item"
            >Test Dashboard</router-link
          >
          <router-link to="/admin/tests/builder" class="nav-item"
            >Test Builder</router-link
          >
        </template>
      </div>

      <div class="nav-actions">
        <!-- Show Logout button if Logged In -->
        <template v-if="isLoggedIn">
          <button @click="logout" class="btn-logout">Logout</button>
        </template>
        <!-- Show Login/Register links if Logged Out (Guest) -->
        <template v-else>
          <router-link to="/login" class="nav-item">Login</router-link>
          <router-link to="/register" class="nav-item">Register</router-link>
        </template>
      </div>
    </div>
  </nav>
  <main class="main-content">
    <router-view />
  </main>
</template>

<script>
import { store } from "./store/store"; // Import the central store

export default {
  computed: {
    // These computed properties reactively read from the store.
    // They are simple "getters" with no side effects.
    isLoggedIn() {
      return !!store.user; // '!!' converts the user object (or null) to a boolean
    },
    isAdmin() {
      // Optional chaining '?.' prevents errors if the user object is null
      return store.user?.roles?.includes("ADMIN") || false;
    },
    isUser() {
      return store.user?.roles?.includes("USER") || false;
    },
  },
  methods: {
    logout() {
      store.logout(); // Call the central logout method to clear the state
      // Redirect to the login page AFTER the state has been cleared
      this.$router.push("/login");
    },
  },
};
</script>

<style>
/* Global Styles  */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
  background-color: #f4f4f4;
  color: #333;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* --- Navigation Styling --- */
.navbar {
  background-color: #fff;
  border-bottom: 1px solid #eaeaea;
  padding: 15px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.nav-links,
.nav-actions {
  display: flex;
  align-items: center;
}

.nav-item {
  text-decoration: none;
  color: #333;
  margin: 0 15px;
  padding: 5px 0;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-item:hover {
  color: #000;
}

.nav-item.router-link-exact-active {
  color: #000;
  border-bottom: 2px solid #000;
}

.btn-logout {
  background: none;
  border: 1px solid #333;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s, color 0.2s;
}

.btn-logout:hover {
  background-color: #000;
  color: #fff;
}

/* --- Main Content Area --- */
.main-content {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
}

/* --- Form Styles  --- */
/* A general container for our form pages (Login/Register) */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
}

.auth-form {
  background: #ffffff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.auth-form h2 {
  text-align: center;
  margin-top: 0;
  margin-bottom: 25px;
  color: #000;
}

.form-group {
  margin-bottom: 20px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  transition: border-color 0.2s;
  background-color: white;
}

.form-group input:focus {
  outline: none;
  border-color: #000;
}

button.btn-primary {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  background-color: #000;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

button.btn-primary:hover {
  opacity: 0.8;
}

.form-feedback {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
}
</style>
