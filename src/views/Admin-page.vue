<template>
  <div class="admin-dashboard">
    <h1>{{}}</h1>

    <div class="dashboard-grid">
      <!-- Card 1: Role Assignment - Add a 'ref' for scrolling -->
      <div class="dashboard-card" ref="assignRoleCard">
        <h2>Assign Roles</h2>
        <form @submit.prevent="handleAssignRole">
          <div class="form-group">
            <label for="user-id">User ID:</label>
            <input
              id="user-id"
              v-model="userId"
              type="text"
              placeholder="Click a user below to select"
              required
              readonly
            />
          </div>
          <div class="form-group">
            <label for="role-select">Select Role:</label>
            <select id="role-select" v-model="roleName">
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button type="submit" class="btn-primary">Assign Role</button>
          <p v-if="successMessage" class="form-feedback success">
            {{ successMessage }}
          </p>
          <p v-if="errorMessage" class="form-feedback error">
            {{ errorMessage }}
          </p>
        </form>
      </div>

      <!-- Card 2: User Management Table -->
      <div class="dashboard-card user-management">
        <h2>User Management</h2>
        <div v-if="isLoading" class="loading">Loading users...</div>
        <div v-else-if="fetchError" class="form-feedback error">
          {{ fetchError }}
        </div>
        <div v-else-if="filteredUsers.length > 0" class="user-table-container">
          <table class="user-table">
            <!-- Table Header Section -->
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Current Roles</th>
                <th>Phone Number</th>
                <th>Actions</th>
              </tr>
            </thead>

            <!-- Table Body Section -->
            <tbody>
              <!-- The v-for loop goes on the <tr> here -->
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                @click="selectUser(user)"
                :class="{ 'selected-row': user.id === userId }"
              >
                <td>{{ user.firstName }} {{ user.lastName }}</td>
                <td>{{ user.email }}</td>

                <td>
                  <span
                    title="assign role"
                    v-if="!user.roles || user.roles.length === 0"
                    class="no-role-tag"
                    >None</span
                  >
                  <span
                    title="revoke"
                    v-else
                    v-for="role in user.roles"
                    :key="role"
                    class="role-tag clickable-role"
                    @click.stop="handleRevokeRole(user, role)"
                  >
                    {{ role }} <i class="fa-solid fa-xmark"></i>
                  </span>
                </td>
                <td>{{ user.phoneNumber || "N/A" }}</td>
                <td>
                  <button
                    title="delete user"
                    @click.stop="handleDeleteUser(user)"
                    class="btn-delete"
                  >
                    <i class="fa-solid fa-user-slash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else>No users found.</div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../services/api";

export default {
  name: "AdminPage",
  data() {
    return {
      userId: "",
      roleName: "USER",
      successMessage: null,
      errorMessage: null,
      users: [],
      isLoading: false,
      fetchError: null,
    };
  },
  computed: {
    filteredUsers() {
      return this.users.filter(Boolean);
    },
  },
  methods: {
    async handleAssignRole() {
      if (!this.userId) {
        this.errorMessage = "Please select a user from the table first.";
        return;
      }
      this.successMessage = null;
      this.errorMessage = null;
      try {
        const response = await api.assignRole({
          userId: this.userId,
          roleName: this.roleName,
        });
        this.successMessage = response.data.message;

        this.fetchUsers();
      } catch (err) {
        this.errorMessage = err.response?.data?.error || "An error occurred.";
      }
    },

    async handleDeleteUser(user) {
      if (
        confirm(
          `Are you sure you want permanently delete the user "${user.firstName} ${user.lastName}"? This cannot be undone`
        )
      ) {
        try {
          await api.deleteUser(user.id);

          alert(`User ${user.firstName} ${user.lastName} has been deleted`);
          this.fetchUsers();
        } catch (error) {
          alert(error.response?.data?.error || "Failed to delete user.");
        }
      }
    },

    async fetchUsers() {
      this.isLoading = true;
      this.fetchError = null;
      try {
        const response = await api.getAllUsers();
        this.users = response.data;
      } catch (err) {
        this.fetchError = "Failed to load users.";
      } finally {
        this.isLoading = false;
      }
    },

    selectUser(user) {
      this.userId = user.id;
      this.successMessage = null;
      this.errorMessage = null;

      this.$refs.assignRoleCard.scrollIntoView({ behavior: "smooth" });
    },
    async handleRevokeRole(user, roleName) {
      if (
        confirm(
          `Are you sure you want to revoke the "${roleName}" role from user "${user.username}"?`
        )
      ) {
        try {
          await api.revokeRole(user.id, roleName);
          // Refresh the user list to show the role is gone
          this.fetchUsers();
          // Provide feedback to the admin
          alert(`Role "${roleName}" revoked successfully.`);
        } catch (err) {
          alert(err.response?.data?.error || "Failed to revoke role.");
        }
      }
    },
  },
  created() {
    this.fetchUsers();
  },
};
</script>

<style scoped>
form {
  width: 500px;
}

.user-management {
  grid-column: span 2;
}

.user-table-container {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.user-table th,
.user-table td {
  border-bottom: 1px solid #eaeaea;
  padding: 12px 15px;
  text-align: left;
}

.user-table th {
  background-color: #f9f9f9;
  font-weight: 600;
  color: #333;
}

.user-table tbody tr:hover {
  background-color: #f5f5f5;
}

.role-tag {
  display: inline-block;
  background-color: #000;
  color: #fff;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  margin-right: 5px;
  text-transform: uppercase;
}

.no-role-tag {
  display: inline-block;
  background-color: #eee;
  color: #666;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-style: italic;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
.user-table tbody tr {
  cursor: pointer;
}

.selected-row {
  background-color: #e0f2f1 !important;
}
.clickable-role {
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.clickable-role:hover {
  background-color: #d93025;
  color: white;
}
.btn-delete {
  background: rgba(255, 0, 0, 0.348);
  color: rgb(110, 0, 0);
  padding: 0.5rem 0.7rem;
  outline: none;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: all ease 0.4s;
}
.btn-delete:hover {
  background-color: rgba(255, 0, 0, 0.647);
}
</style>
