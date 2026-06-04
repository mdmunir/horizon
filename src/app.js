import vuetify from './plugins/vuetify';
import { createApp, h } from 'vue';
import routes from 'virtual:auto-route';
import { createRouter, createWebHashHistory, RouterView } from 'vue-router';
import { registerSW } from 'virtual:pwa-register';

import 'vuetify/lib/styles/main.sass';
import '@mdi/font/css/materialdesignicons.css';
import './assets/css/app.css';
import './plugins/format';
import main from './plugins/main';
import App from './App.vue';

registerSW({ immediate: true });
const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

createApp(App)
    .use(vuetify)
    .use(router)
    .use(main)
    .mount('#app');