import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login-page.vue";
import Register from "../views/Register-page.vue";
import Dashboard from "../views/Dashboard-page.vue";
import Admin from "../views/Admin-page.vue";
import TestAdminView from "../views/TestAdminView.vue";
import AvaiableTests from "@/views/AvaiableTests.vue";
import TestBuilderView from "@/views/TestBuilderView.vue";
import AttemptsListView from "../views/testresults/AttemptsListView.vue";
import AttemptDetailView from "../views/testresults/AttemptDetailView.vue";
import { store } from "../store/store.js";

// --- CORRECTED IMPORTS ---
import TestLayout from "../views/TestLayout/TestLayout.vue";
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
    meta: { requiresAuth: true },
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/tests",
    name: "TestAdmin",
    component: TestAdminView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/tests/builder/:templateId?",
    name: "TestBuilder",
    component: TestBuilderView,
    meta: { requiresAuth: true, requiresAdmin: true },
    props: true,
  },
  {
    path: "/admin/attempts",
    name: "AttemptsList",
    component: AttemptsListView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/attempts/:attemptId",
    name: "AttemptDetail",
    component: AttemptDetailView,
    meta: { requiresAuth: true, requiresAdmin: true },
    props: true,
  },
  // --- Cleaned up duplicate '/tests' route ---
  {
    path: "/tests",
    name: "AvailableTests",
    component: AvaiableTests,
    meta: { requiresAuth: true, requiresUser: true },
  },

  {
    // The common URL part for all test sections
    path: "/attempt/:attemptId",

    // The component that provides the persistent layout (header, footer)
    component: TestLayout,

    // Ensure both parent and children can get the 'attemptId' prop
    props: true,

    // Protect this entire group of routes
    meta: { requiresAuth: true, requiresUser: true },

    // The individual sections are now NESTED inside the parent
    children: [
      {
        path: "listening",
        name: "ListeningSection",
        component: ListeningSection,
        props: true,
      },
      {
        path: "reading",
        name: "ReadingSection",
        component: ReadingSection,
        props: true,
      },
      {
        path: "writing",
        name: "WritingSection",
        component: WritingSection,
        props: true,
      },
    ],
  },

  // --- Redirect root to login ---
  {
    path: "/",
    redirect: "/login",
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!store.user;
  const isAdmin = store.user?.roles?.includes("ADMIN") || false;
  const isUser = store.user?.roles?.includes("USER") || false;

  if (to.meta.requiresAuth && !isLoggedIn) {
    return next("/login");
  }

  if (to.meta.requiresAdmin && !isAdmin) {
    return next("/dashboard");
  }

  if (to.meta.requiresUser && !isUser) {
    return next("/dashboard");
  }

  next();
});

export default router;
