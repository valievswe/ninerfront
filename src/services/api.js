import axios from "axios";
import { store } from "../store/store";

// Create an instance of axios with the base URL of your backend
const apiClient = axios.create({
  baseURL: "http://localhost:3000/api", // backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// request interceptor to include the token in headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Before attaching the token, let's re-validate it using our store's logic
      // This is our "heartbeat" check
      store.updateUserFromToken();

      // If the check resulted in a logout (user is now null), we should stop the request
      if (!store.user) {
        console.warn(
          "Request cancelled because token expired and user was logged out."
        );
        // This cancels the outgoing request
        return Promise.reject(new axios.Cancel("Token expired"));
      }

      // If we're here, the token is still valid, so attach it
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    //logout unauthorized
    if (error.response && error.response.status === 401) {
      console.error("Received 401 Unauthorized. Forcing logout.");
      store.logout();
    }
    return Promise.reject(error);
  }
);

// --- All API Methods ---
export default {
  // -- Auth --
  register(userData) {
    return apiClient.post("/auth/register", userData);
  },
  login(credentials) {
    return apiClient.post("/auth/login", credentials);
  },

  // -- User Management (Admin) --
  assignRole(data) {
    return apiClient.post("/admin/assign-role", data);
  },
  getAllUsers() {
    return apiClient.get("/admin/users");
  },
  revokeRole(userId, roleName) {
    return apiClient.delete(`/admin/users/${userId}/roles/${roleName}`);
  },
  deleteUser(userId) {
    return apiClient.delete(`/admin/users/${userId}`);
  },

  // -- Test Management (Admin) --
  // For the Test Builder
  createTestTemplate(templateData) {
    return apiClient.post("/admin/tests/templates", templateData);
  },
  getTemplateDetails(templateId) {
    return apiClient.get(`/admin/tests/templates/${templateId}`);
  },
  updateSection(templateId, sectionType, sectionData) {
    return apiClient.patch(
      `/admin/tests/templates/${templateId}/sections/${sectionType}`,
      sectionData
    );
  },

  // --- THE ADMIN ROUTES---
  // For the main Test Management Dashboard
  getAllTestTemplates() {
    return apiClient.get("/admin/tests/templates");
  },
  deleteTestTemplate(templateId) {
    return apiClient.delete(`/admin/tests/templates/${templateId}`);
  },
  scheduleTest(scheduleData) {
    return apiClient.post("/admin/tests/schedule", scheduleData);
  },
  getAllScheduledTests() {
    return apiClient.get("/admin/tests/scheduled");
  },

  getAllAttempts() {
    return apiClient.get("/admin/attempts");
  },

  getAttemptDetails(attemptId) {
    return apiClient.get(`/admin/attempts/${attemptId}`);
  },
  getDashboardStats() {
    return apiClient.get("/admin/stats");
  },
  // -- user test room
  getAvailableTests() {
    return apiClient.get("/tests/available");
  },

  startTestAttempt(scheduledTestId) {
    return apiClient.post(`/tests/${scheduledTestId}/start`);
  },

  getSectionContent(attemptId, sectionType) {
    return apiClient.get(`/tests/attempts/${attemptId}/section/${sectionType}`);
  },

  submitSectionAnswers(attemptId, sectionType, answers) {
    return apiClient.post(`/tests/attempts/${attemptId}/submit-section`, {
      sectionType,
      answers,
    });
  },

  finishTestAttempt(attemptId) {
    return apiClient.post(`/tests/attempts/${attemptId}/finish`);
  },
};
