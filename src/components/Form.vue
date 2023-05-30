<script>
import { VueRecaptcha } from 'vue-recaptcha';

const RECAPTCHA_SITE_KEY = '1234567890abcdef';

async function getFormProperties(formId) {
  // See https://docs.solspace.com/craft/freeform/v4/developer/graphql/#how-to-render-a-form
  const response = await fetch(`https://www.example.com/my-module/freeform/form-properties/${formId}`, { headers: { 'Accept': 'application/json' }});

  if (!response.ok) {
    throw new Error('Failed to fetch Freeform form properties');
  }

  return response.json();
}

async function saveKitchenSinkSubmission(params) {
  const { reCaptchaValue, formProperties } = params;
  const { csrf, hash, honeypot, freeform_payload } = formProperties;

  const formData = new FormData();
  formData.append(csrf.name, csrf.token);
  formData.append(honeypot.name, honeypot.value);

  formData.append('formHash', hash);
  formData.append('freeform_payload', freeform_payload);
  formData.append('g-recaptcha-response', reCaptchaValue);

  // Update the form data key/value pairs with your own Freeform Form field names and values
  formData.append('textField', 'Submitted via AJAX');

  const response = await fetch('https://www.example.com/actions/freeform/submit', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrf.token,
      'Cache-Control': 'no-cache',
      'X-Requested-With': 'XMLHttpRequest',
      'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest',
      'X-Craft-Solspace-Freeform-Mode': 'Headless',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to submit Freeform form');
  }

  return response.json();
}

export default {
  name: 'Form',
  data: () => ({
    formProperties: null,
    reCaptchaValue: null,
    sitekey: RECAPTCHA_SITE_KEY,
  }),
  components: {
    VueRecaptcha,
  },
  created() {
    const formId = 3;

    getFormProperties(formId).then(formProperties => {
      this.formProperties = formProperties;
    });
  },
  methods: {
    handleVerify(reCaptchaValue) {
      this.reCaptchaValue = reCaptchaValue;
    },
    async handleSubmit() {
      // Get the reCAPTCHA response value
      const formProperties = this.formProperties;
      const reCaptchaValue = this.reCaptchaValue;

      const response = await saveKitchenSinkSubmission({ reCaptchaValue, formProperties });
      console.log(response);
    },
  },
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <VueRecaptcha
      ref="recaptcha"
      :sitekey="sitekey"
      @verify="handleVerify"
    />
    <button type="submit">Submit</button>
  </form>
</template>

<style scoped>
</style>
