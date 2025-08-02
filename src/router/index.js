import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login-page.vue";
import Register from "../views/Register-page.vue";
import Dashboard from "../views/Dashboard-page.vue";
import Admin from "../views/Admin-page.vue";
import TestAdminView from "../views/TestAdminView.vue";
import AvaiableTests from "@/views/AvaiableTests.vue";
import TestBuilderView from "@/views/TestBuilderView.vue";
import { store } from "../store/store.js";

// / test room

import ListeningSection from "@/views/test-sections/ListeningSection.vue";
import ReadingSection from "@/views/test-sections/ReadingSection.vue";
import WritingSection from "@/views/test-sections/WritingSection.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true }, // This route requires authentication
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true }, // This route requires admin role
  },
  {
    path: "/admin/tests",
    name: "TestAdmin",
    component: TestAdminView,
    meta: { requiresAuth: true, requiresAdmin: true }, // Secure it
  },

  {
    path: "/tests",
    name: "AvailableTests",
    component: AvaiableTests,
    meta: { requiresAuth: true }, // Secure it for any logged-in user
  },

  {
    path: "/admin/tests/builder/:templateId?",
    name: "TestBuilder",
    component: TestBuilderView,
    meta: { requiresAuth: true, requiresAdmin: true },
    props: true, // This is crucial - it passes URL params as component props
  },

  {
    path: "/tests",
    name: "AvailableTests",
    component: AvaiableTests,
    meta: { requiresAuth: true, requiresUser: true }, // Let's make this specific to the USER role
  },

  {
    path: "/attempt/:attemptId/listening",
    name: "ListeningSection",
    component: ListeningSection,
    meta: { requiresAuth: true, requiresUser: true },
    props: true, // This allows the component to receive 'attemptId' as a prop
  },
  {
    path: "/attempt/:attemptId/reading",
    name: "ReadingSection",
    component: ReadingSection,
    meta: { requiresAuth: true, requiresUser: true },
    props: true,
  },
  {
    path: "/attempt/:attemptId/writing",
    name: "WritingSection",
    component: WritingSection,
    meta: { requiresAuth: true, requiresUser: true },
    props: true,
  },
  // Redirect root to login for simplicity
  {
    path: "/",
    redirect: "/login",
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  // We use the store as the single source of truth
  const isLoggedIn = !!store.user;
  const isAdmin = store.user?.roles?.includes("ADMIN") || false;
  const isUser = store.user?.roles?.includes("USER") || false;

  // Check if the route requires authentication
  if (to.meta.requiresAuth && !isLoggedIn) {
    // If not logged in, redirect to login page
    return next("/login");
  }

  // Check for admin-only routes
  if (to.meta.requiresAdmin && !isAdmin) {
    // If not an admin, redirect to their dashboard
    return next("/dashboard");
  }

  // Check for user-only routes
  if (to.meta.requiresUser && !isUser) {
    // If not a user (e.g., an admin trying to take a test), redirect to dashboard
    return next("/dashboard");
  }

  // If all checks pass, proceed
  next();
});

export default router;
