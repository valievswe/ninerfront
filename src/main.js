import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/index";
import { store } from "./store/store";
store.updateUserFromToken();
createApp(App).use(router).mount("#app");
