import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login-page.vue";
import Register from "../views/Register-page.vue";
import Dashboard from "../views/Dashboard-page.vue";
import Admin from "../views/Admin-page.vue";
import TestAdminView from "../views/TestAdminView.vue";
import TestRoom from "@/views/TestRoom.vue";
import AvaiableTests from "@/views/AvaiableTests.vue";
import TestBuilderView from "@/views/TestBuilderView.vue";
import { jwtDecode } from "jwt-decode";

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
    path: "/tests/:templateId/attempt/:attemptId",
    name: "TestRoom",
    component: TestRoom,
    meta: { requiresAuth: true },
    props: true, // This allows the component to receive URL params as props
  },
  {
    path: "/admin/tests/builder/:templateId?",
    name: "TestBuilder",
    component: TestBuilderView,
    meta: { requiresAuth: true, requiresAdmin: true },
    props: true, // This is crucial - it passes URL params as component props
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
  const loggedIn = localStorage.getItem("token");

  if (to.meta.requiresAuth && !loggedIn) {
    // If route requires auth and user is not logged in, redirect to login
    return next("/login");
  }

  if (to.meta.requiresAdmin) {
    if (loggedIn) {
      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token);
      if (decodedToken.roles && decodedToken.roles.includes("ADMIN")) {
        return next(); // User is admin, proceed
      }
    }
    // If user is not admin, redirect them (e.g., to dashboard or show an error)
    return next("/dashboard");
  }

  next(); // Otherwise, proceed
});

export default router;
