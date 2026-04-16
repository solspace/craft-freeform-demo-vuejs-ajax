import './main.css';

import { createApp } from 'vue';
import App from './App.vue';
import { VueReCaptcha } from 'vue-recaptcha-v3';

// ENTER YOUR FORM ID HERE
const RECAPTCHA_SITE_KEY = '';

const app = createApp(App);

app.use(VueReCaptcha, {
    siteKey: RECAPTCHA_SITE_KEY,
});

app.mount('#app');
