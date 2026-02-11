import { createApp } from "vue";
import App from "./App.vue";
import LandingPage from "./Landingpage.vue"
import router from "./routes/index";
import 'bootstrap-icons/font/bootstrap-icons.css'
import Vue3Toastify from "vue3-toastify"
import "vue3-toastify/dist/index.css"


createApp(LandingPage).mount("#app");
const app = createApp(App);

app.use(router);

router.afterEach((to) => {
  document.title = to.meta.title || "Vite App";
});

app.mount("#app");
