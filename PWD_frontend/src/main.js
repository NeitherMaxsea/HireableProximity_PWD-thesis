import { createApp } from "vue";
import App from "./App.vue";
import router from "./routes/index";
import 'bootstrap-icons/font/bootstrap-icons.css'
import Vue3Toastify from "vue3-toastify"
import "vue3-toastify/dist/index.css"


const app = createApp(App);

app.use(router);
app.use(Vue3Toastify);

router.afterEach((to) => {
  document.title = to.meta.title || "Vite App";
});

app.mount("#app");
