import './main.css';

import { createApp } from 'vue';
import App from './App.vue';
import { VueReCaptcha } from 'vue-recaptcha-v3';

const RECAPTCHA_SITE_KEY = '6Lce6nQmAAAAAO5d4LWC6TkECxNRSG7WNiVj17B1';

const app = createApp(App);

app.use(VueReCaptcha, {
    siteKey: RECAPTCHA_SITE_KEY,
});

app.mount('#app');
