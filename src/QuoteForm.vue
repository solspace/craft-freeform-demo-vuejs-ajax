<script>
import { useReCaptcha } from 'vue-recaptcha-v3';

const defaultFormData = {
    workPhone: '',
    subject: '',
    message: '',
    lastName: '',
    howMuchDoYouEnjoyEatingPie: '',
    howDidYouHearAboutThisJobPosting: [],
    homePhone: '',
    firstName: '',
    email: '',
    department: '',
    companyName: '',
    cellPhone: '',
    appointmentDate: '',
    acceptTerms: '',
};

const defaultFormProperties = {
    csrf: {
        name: '',
        token: '',
    },
    hash: '',
    honeypot: {
        name: '',
        value: '',
    },
    freeform_payload: '',
    reCaptcha: {
        enabled: false,
        handle: '',
        name: '',
    },
    loadingText: '',
    successMessage: '',
    errorMessage: '',
};

async function getFormProperties(formId) {
    // See https://docs.solspace.com/craft/freeform/v4/developer/graphql/#how-to-render-a-form
    const response = await fetch(`/craft/freeform/form/properties/${formId}`, { headers: { 'Accept': 'application/json' }});

    if (!response.ok) {
        throw new Error('Failed to fetch Craft Freeform Form properties');
    }

    return response.json();
}

async function saveQuoteSubmission(params) {
    const { reCaptchaValue, formData, formProperties } = params;
    const { csrf, hash, honeypot, freeform_payload, reCaptcha } = formProperties;

    const body = new FormData();
    body.append(csrf.name, csrf.token);
    body.append(honeypot.name, honeypot.value);

    body.append('formHash', hash);
    body.append('freeform_payload', freeform_payload);
    body.append(reCaptcha.name, reCaptchaValue);

    body.append('firstName', formData.firstName);
    body.append('lastName', formData.lastName);
    body.append('companyName', formData.companyName);
    body.append('email', formData.email);
    body.append('cellPhone', formData.cellPhone);
    body.append('homePhone', formData.homePhone);
    body.append('workPhone', formData.workPhone);
    body.append('subject', formData.subject);
    body.append('appointmentDate', formData.appointmentDate);
    body.append('department', formData.department);
    body.append('howMuchDoYouEnjoyEatingPie', formData.howMuchDoYouEnjoyEatingPie);
    body.append('message', formData.message);

    for (let i = 0; i < formData.howDidYouHearAboutThisJobPosting.length; i++) {
        body.append('howDidYouHearAboutThisJobPosting[]', formData.howDidYouHearAboutThisJobPosting[i]);
    }

    body.append('acceptTerms', formData.acceptTerms);

    const response = await fetch('/craft/actions/freeform/submit', {
        method: 'POST',
        headers: {
            'X-CSRF-Token': csrf.token,
            'Cache-Control': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest',
            'HTTP_X_REQUESTED_WITH': 'XMLHttpRequest',
            'X-Craft-Solspace-Freeform-Mode': 'Headless',
        },
        body,
    });

    if (!response.ok) {
        throw new Error('Failed to submit Craft Freeform Form');
    }

    return response.json();
}

export default {
    name: 'QuoteForm',
    data: () => ({
        submitButton: null,
        errorMessage: null,
        successMessage: null,
        reCaptchaValue: null,
        formData: defaultFormData,
        formProperties: defaultFormProperties,
    }),
    setup() {
        const { executeRecaptcha, recaptchaLoaded } = useReCaptcha();

        const getReCaptcha = async () => {
            await recaptchaLoaded();

            return await executeRecaptcha('setup');
        };

        return {
            getReCaptcha,
        };
    },
    created() {
        const formId = 4;

        getFormProperties(formId).then(formProperties => {
            this.formProperties = formProperties;
        });

        this.getReCaptcha().then(reCaptchaValue => {
            this.reCaptchaValue = reCaptchaValue;
        });
    },
    mounted() {
        this.errorMessage = document.querySelector('#errorMessage');
        this.successMessage = document.querySelector('#successMessage');
        this.submitButton = document.querySelector('button[type="submit"]');

        this.hideSubmissionError();
        this.hideSubmissionSuccess();
    },
    methods: {
        handleHowDidYouHearAboutThisJobPosting(event) {
            let howDidYouHearAboutThisJobPosting = [...this.formData.howDidYouHearAboutThisJobPosting];

            if (event.target.checked) {
                howDidYouHearAboutThisJobPosting.push(event.target.value);
            } else {
                howDidYouHearAboutThisJobPosting = howDidYouHearAboutThisJobPosting.filter((value) => value !== event.target.value);
            }

            this.formData = {
                ...this.formData,
                howDidYouHearAboutThisJobPosting,
            };
        },
        startProcessing() {
            this.submitButton.style.cursor = 'not-allowed';
            this.submitButton.innerText = this.formProperties.loadingText;
        },
        stopProcessing() {
            this.submitButton.innerText = 'Submit';
            this.submitButton.style.cursor = 'pointer';
        },
        showSubmissionSuccess() {
            this.successMessage.style.display = 'block';
            this.scrollToTop();
        },
        hideSubmissionSuccess() {
            this.successMessage.style.display = 'none';
        },
        showSubmissionError() {
            this.errorMessage.style.display = 'block';
            this.scrollToTop();
        },
        hideSubmissionError() {
            this.errorMessage.style.display = 'none';

            const errors = document.querySelectorAll('.error-message');
            if (errors) {
                errors.forEach(error => {
                    error.classList.remove('flex');
                    error.classList.add('hidden');
                });
            }
        },
        scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        async handleSubmit(event) {
            this.hideSubmissionError();
            this.hideSubmissionSuccess();
            this.startProcessing();

            const formData = this.formData;
            const formProperties = this.formProperties;
            const reCaptchaValue = this.reCaptchaValue;

            const response = await saveQuoteSubmission({ reCaptchaValue, formData, formProperties });

            if (response && response.success) {
                this.showSubmissionSuccess();
            } else if (response && response.errors) {
                this.showSubmissionError();

                for (const [key, value] of Object.entries(response.errors)) {
                    const element = document.querySelector(`.${key}-field .error-message`);
                    if (element) {
                        element.innerHTML = value[0];
                        element.classList.add('flex');
                        element.classList.remove('hidden');
                    }
                }
            }

            this.stopProcessing();
        },
    },
};
</script>

<template>
    <form class="text-center flex flex-col items-left justify-left" @submit.prevent="handleSubmit">
        <h3 class="mb-4 text-xl font-normal text-left">Quote Form</h3>
        <div id="successMessage" class="w-full bg-green-100 border border-green-400 text-sm text-left text-green-700 px-4 py-2 rounded-md mb-8" style="display: none;">
            <p>{{ this.formProperties.successMessage }}</p>
        </div>
        <div id="errorMessage" class="w-full bg-red-100 border border-red-400 text-sm text-left text-red-700 px-4 py-2 rounded-md mb-8" style="display: none;">
            <p>{{ this.formProperties.errorMessage }}</p>
        </div>
        <div class="flex flex-col w-full space-y-3">
            <div class="form-row">
                <div class="field-wrapper firstName-field">
                    <label for="firstName">First Name <span class="ml-1 text-[red]">*</span></label>
                    <input class="form-input field-input" name="firstName" type="text" id="firstName" v-model="formData.firstName" v-on:change="event => (formData = { ...formData, firstName: event.target.value })" />
                    <span class="field-error error-message hidden"></span>
                </div>
                <div class="field-wrapper lastName-field">
                    <label for="lastName">Last Name <span class="ml-1 text-[red]">*</span></label>
                    <input class="form-input field-input" name="lastName" type="text" id="lastName" v-model="formData.lastName" v-on:change="event => (formData = { ...formData, lastName: event.target.value })" />
                    <span class="field-error error-message hidden"></span>
                </div>
            </div>
            <div class="form-row">
                <div class="field-wrapper">
                    <label for="companyName">Organization Name</label>
                    <input class="form-input field-input" name="companyName" type="text" id="companyName" v-model="formData.companyName" v-on:change="event => (formData = { ...formData, companyName: event.target.value })" />
                </div>
            </div>
            <div class="form-row">
                <div class="field-wrapper email-field">
                    <label for="email">Email <span class="ml-1 text-[red]">*</span></label>
                    <div class="text-xs italic text-slate-400">We&apos;ll never share your email with anyone else.</div>
                    <input class="form-input field-input" name="email" type="email" id="email" v-model="formData.email" v-on:change="event => (formData = { ...formData, email: event.target.value })" />
                    <span class="field-error error-message hidden"></span>
                </div>
            </div>
            <div class="form-row">
                <div class="field-wrapper cellPhone-field">
                    <label for="cellPhone">Cell Phone <span class="ml-1 text-[red]">*</span></label>
                    <input class="form-input field-input" name="cellPhone" type="tel" id="cellPhone" v-model="formData.cellPhone" v-on:change="event => (formData = { ...formData, cellPhone: event.target.value })" />
                    <span class="field-error error-message hidden"></span>
                </div>
                <div class="field-wrapper">
                    <label for="homePhone">Home Phone</label>
                    <input class="form-input field-input" name="homePhone" type="tel" id="homePhone" v-model="formData.homePhone" v-on:change="event => (formData = { ...formData, homePhone: event.target.value })" />
                </div>
                <div class="field-wrapper">
                    <label for="workPhone">Work Phone</label>
                    <input class="form-input field-input" name="workPhone" type="tel" id="workPhone" v-model="formData.workPhone" v-on:change="event => (formData = { ...formData, workPhone: event.target.value })" />
                </div>
            </div>
            <div class="form-row">
                <div class="field-wrapper subject-field">
                    <label for="subject">Subject <span class="ml-1 text-[red]">*</span></label>
                    <select class="form-select field-input" name="subject" id="subject" v-model="formData.subject" v-on:change="event => (formData = { ...formData, subject: event.target.value })">
                        <option value="">I need some help with...</option>
                        <option value="myHomework">My homework</option>
                        <option value="practicingMyHammerDance">Practicing my hammer dance</option>
                        <option value="findingMyBellyButton">Finding my belly button</option>
                    </select>
                    <span class="field-error error-message hidden"></span>
                </div>
                <div class="field-wrapper">
                    <label for="appointmentDate">Appointment Date</label>
                    <input class="form-input field-input" name="appointmentDate" type="text" id="appointmentDate" placeholder="YYYY/MM/DD" autoComplete="off" v-model="formData.appointmentDate" v-on:change="event => (formData = { ...formData, appointmentDate: event.target.value })"  />
                </div>
                <div class="field-wrapper department-field">
                    <label for="department">Department <span class="ml-1 text-[red]">*</span></label>
                    <select class="form-select field-input" name="department" id="department" v-model="formData.department" v-on:change="event => (formData = { ...formData, department: event.target.value })">
                        <option value="">Please choose...</option>
                        <option value="sales@example.com">Sales</option>
                        <option value="service@example.com">Service</option>
                        <option value="support@example.com">Support</option>
                    </select>
                    <span class="field-error error-message hidden"></span>
                </div>
            </div>
            <div class="form-row">
                <div class="field-wrapper">
                    <label for="howMuchDoYouEnjoyEatingPie-1" class="flex flex-row">How much do you enjoy eating pie?</label>
                    <div class="flex flex-row space-x-4">
                        <label for="howMuchDoYouEnjoyEatingPie-1" class="flex flex-row items-center justify-center">
                            <input class="field-input-radio" name="howMuchDoYouEnjoyEatingPie" type="radio" id="howMuchDoYouEnjoyEatingPie-1" value="1" v-on:change="event => (formData = { ...formData, howMuchDoYouEnjoyEatingPie: event.target.value })" /> 1
                        </label>
                        <label for="howMuchDoYouEnjoyEatingPie-2" class="flex flex-row items-center justify-center">
                            <input class="field-input-radio" name="howMuchDoYouEnjoyEatingPie" type="radio" id="howMuchDoYouEnjoyEatingPie-2" value="2" v-on:change="event => (formData = { ...formData, howMuchDoYouEnjoyEatingPie: event.target.value })" /> 2
                        </label>
                        <label for="howMuchDoYouEnjoyEatingPie-3" class="flex flex-row items-center justify-center">
                            <input class="field-input-radio" name="howMuchDoYouEnjoyEatingPie" type="radio" id="howMuchDoYouEnjoyEatingPie-3" value="3" v-on:change="event => (formData = { ...formData, howMuchDoYouEnjoyEatingPie: event.target.value })" /> 3
                        </label>
                        <label for="howMuchDoYouEnjoyEatingPie-4" class="flex flex-row items-center justify-center">
                            <input class="field-input-radio" name="howMuchDoYouEnjoyEatingPie" type="radio" id="howMuchDoYouEnjoyEatingPie-4" value="4" v-on:change="event => (formData = { ...formData, howMuchDoYouEnjoyEatingPie: event.target.value })" /> 4
                        </label>
                        <label for="howMuchDoYouEnjoyEatingPie-5" class="flex flex-row items-center justify-center">
                            <input class="field-input-radio" name="howMuchDoYouEnjoyEatingPie" type="radio" id="howMuchDoYouEnjoyEatingPie-5" value="5" v-on:change="event => (formData = { ...formData, howMuchDoYouEnjoyEatingPie: event.target.value })" /> 5
                        </label>
                    </div>
                </div>
            </div>
            <div class="form-row">
                <div class="field-wrapper message-field">
                    <label for="message">Message <span class="ml-1 text-[red]">*</span></label>
                    <textarea class="form-textarea field-input" name="message" id="message" rows={5} v-model="formData.message" v-on:change="event => (formData = { ...formData, message: event.target.value })"></textarea>
                    <span class="field-error error-message hidden"></span>
                </div>
            </div>
            <div class="form-row">
                <div class="field-wrapper">
                    <label for="howDidYouHearAboutThisJobPosting-Newspaper">How did you hear about us?</label>
                    <label class="flex flex-row items-center justify-center">
                        <input class="field-input-checkbox" name="howDidYouHearAboutThisJobPosting[]" type="checkbox" id="howDidYouHearAboutThisJobPosting-Newspaper" value="Newspaper" v-on:change="handleHowDidYouHearAboutThisJobPosting" /> Newspaper
                    </label>
                    <label class="flex flex-row items-center justify-center">
                        <input class="field-input-checkbox" name="howDidYouHearAboutThisJobPosting[]" type="checkbox" id="howDidYouHearAboutThisJobPosting-Radio" value="Radio" v-on:change="handleHowDidYouHearAboutThisJobPosting" /> Radio
                    </label>
                    <label class="flex flex-row items-center justify-center">
                        <input class="field-input-checkbox" name="howDidYouHearAboutThisJobPosting[]" type="checkbox" id="howDidYouHearAboutThisJobPosting-CarrierPigeon" value="Carrier Pigeon" v-on:change="handleHowDidYouHearAboutThisJobPosting" /> Carrier Pigeon
                    </label>
                    <label class="flex flex-row items-center justify-center">
                        <input class="field-input-checkbox" name="howDidYouHearAboutThisJobPosting[]" type="checkbox" id="howDidYouHearAboutThisJobPosting-Other" value="Other" v-on:change="handleHowDidYouHearAboutThisJobPosting" /> Other
                    </label>
                </div>
            </div>
            <div class="form-row">
                <div class="field-wrapper acceptTerms-fields">
                    <label for="acceptTerms" class="flex flex-row items-center justify-center">
                        <input class="field-input-checkbox" name="acceptTerms" type="checkbox" id="acceptTerms" value="yes" v-on:change="event => (formData = { ...formData, acceptTerms: event.target.checked ? event.target.value : '' })" />
                        I agree to the <a href="https://solspace.com" class="mx-1 underline">terms &amp; conditions</a> required by this site. <span class="ml-1 text-[red]">*</span>
                    </label>
                    <span class="field-error error-message hidden"></span>
                </div>
            </div>
            <div class="form-row">
                <div class="flex flex-row items-left justify-left space-y-2 w-full">
                    <button class="btn-primary" type="submit">Submit</button>
                </div>
            </div>
        </div>
    </form>
</template>

<style scoped>
</style>
