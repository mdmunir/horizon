import vuetify from './plugins/vuetify';
import { createApp, h } from 'vue';
import routes from 'virtual:auto-route';
import { createRouter, createWebHashHistory, RouterView } from 'vue-router';

import 'vuetify/lib/styles/main.sass';
import '@mdi/font/css/materialdesignicons.css';
import './assets/css/app.css';
import './plugins/format';

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

const App = { render: () => h(RouterView) };
createApp(App)
    .use(vuetify)
    .use(router)
    .mount('#app');