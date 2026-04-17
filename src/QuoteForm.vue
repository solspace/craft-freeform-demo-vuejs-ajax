<script>
import { useReCaptcha } from 'vue-recaptcha-v3';

// ENTER YOUR FORM ID HERE
const FORM_ID = undefined;

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
    settings: {
        behavior: {
            processingText: '',
            successMessage: '',
            errorMessage: '',
        },
    },
};

async function getFormProperties() {
    // See https://docs.solspace.com/craft/freeform/v5/developer/graphql/#how-to-render-a-form
    const response = await fetch(`/craft/freeform/form/properties/${FORM_ID}`, {
        headers: {
            'Accept': 'application/json',
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Craft Freeform Form properties');
    }

    return response.json();
}

async function saveQuoteSubmission(params) {
    const { captchaValue, formData, formProperties } = params;
    const { csrf, hash, honeypot, freeform_payload } = formProperties;

    const body = new FormData();
    body.append(csrf.name, csrf.token);
    body.append(honeypot.name, honeypot.value);

    body.append('formHash', hash);
    body.append('freeform_payload', freeform_payload);
    body.append('g-recaptcha-response', captchaValue);

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
        formData: { ...defaultFormData },
        formProperties: defaultFormProperties,
        showSpam: false,
        showError: false,
        showSuccess: false,
        isProcessing: false,
        fieldErrors: {},
    }),
    setup() {
        const { executeRecaptcha, recaptchaLoaded } = useReCaptcha();

        const getReCaptcha = async () => {
            await recaptchaLoaded();

            return await executeRecaptcha('submit');
        };

        return {
            getReCaptcha,
        };
    },
    computed: {
        isFormReady() {
            return Boolean(this.formProperties.csrf?.name && this.formProperties.csrf?.token && this.formProperties.honeypot?.name && this.formProperties.hash && this.formProperties.freeform_payload);
        },
    },
    created() {
        getFormProperties()
            .then(formProperties => {
                this.formProperties = formProperties;
            })
            .catch(error => {
                console.error(error);

                this.showError = true;
            });
    },
    methods: {
        handleHowDidYouHearAboutThisJobPosting(event) {
            let howDidYouHearAboutThisJobPosting = [...this.formData.howDidYouHearAboutThisJobPosting];

            if (event.target.checked) {
                if (!howDidYouHearAboutThisJobPosting.includes(event.target.value)) {
                    howDidYouHearAboutThisJobPosting.push(event.target.value);
                }
            } else {
                howDidYouHearAboutThisJobPosting = howDidYouHearAboutThisJobPosting.filter((value) => value !== event.target.value);
            }

            this.formData = {
                ...this.formData,
                howDidYouHearAboutThisJobPosting,
            };
        },
        startProcessing() {
            this.isProcessing = true;
        },
        stopProcessing() {
            this.isProcessing = false;
        },
        showSubmissionSuccess() {
            this.showSuccess = true;
            this.scrollToTop();
        },
        hideSubmissionSuccess() {
            this.showSuccess = false;
        },
        showSubmissionError() {
            this.showError = true;
            this.scrollToTop();
        },
        showSpamError() {
            this.showSpam = true;
            this.scrollToTop();
        },
        showFieldError(errors) {
            const nextErrors = {};

            for (const [key, value] of Object.entries(errors)) {
                if (!/^-?\d+$/.test(key) && Array.isArray(value) && value.length) {
                    nextErrors[key] = value[0];
                }
            }

            this.fieldErrors = nextErrors;
        },
        clearFieldError(fieldName) {
            const nextErrors = { ...this.fieldErrors };

            delete nextErrors[fieldName];

            this.fieldErrors = nextErrors;
        },
        hideSubmissionError() {
            this.showError = false;
            this.fieldErrors = {};
        },
        hideSpamError() {
            this.showSpam = false;
        },
        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        },
        async handleSubmit(event) {
            event.preventDefault();

            if (!this.isFormReady) {
                return;
            }

            this.hideSpamError();
            this.hideSubmissionError();
            this.hideSubmissionSuccess();
            this.startProcessing();

            try {
                const formData = this.formData;
                const formProperties = this.formProperties;
                const captchaValue = await this.getReCaptcha();

                const response = await saveQuoteSubmission({ captchaValue, formData, formProperties });

                this.stopProcessing();

                if (response && response.success) {
                    this.formData = { ...defaultFormData };
                    this.fieldErrors = {};

                    this.showSubmissionSuccess();
                } else if (response) {
                    this.showSubmissionError();

                    let hasSpamError = false;

                    if (response.errors) {
                        this.showFieldError(response.errors);
                    }


                    if (response.formErrors && response.formErrors.length > 0) {
                        const formErrors = response.formErrors;

                        if (formErrors.includes('Please verify that you are not a robot.')) {
                            hasSpamError = true;
                        }

                        if (formErrors.includes('Unknown argument')) {
                            console.error(formErrors);
                        }

                        if (!hasSpamError && !formErrors.includes('Unknown argument')) {
                            console.error(formErrors);
                        }
                    }

                    if (hasSpamError) {
                        this.showSpamError();
                    }
                } else {
                    this.showSubmissionError();
                }
            } catch (error) {
                this.stopProcessing();
                this.showSubmissionError();

                console.error(error);
            }
        },
    },
};
</script>

<template>
    <form class="text-center flex flex-col items-left justify-left" @submit.prevent="handleSubmit">
        <h3 class="mb-4 text-xl font-normal text-left">Quote Form</h3>
        <div v-if="showSuccess" id="successMessage" class="w-full bg-green-100 border border-green-400 text-sm text-left text-green-700 px-4 py-2 rounded-md mb-8">
            <p>{{ this.formProperties.settings.behavior.successMessage }}</p>
        </div>
        <div v-if="showError" id="errorMessage" class="w-full bg-red-100 border border-red-400 text-sm text-left text-red-700 px-4 py-2 rounded-md mb-8">
            <p>{{ this.formProperties.settings.behavior.errorMessage }}</p>
        </div>
        <div v-if="showSpam" id="spamMessage" class="w-full bg-red-100 border border-red-400 text-sm text-left text-red-700 px-4 py-2 rounded-md mb-8">
            <p>Please verify that you are not a robot.</p>
        </div>
        <div class="flex flex-col w-full space-y-3">
            <div class="form-row">
                <div class="field-wrapper firstName-field">
                    <label for="firstName">First Name <span class="ml-1 text-[red]">*</span></label>
                    <input class="form-input field-input" name="firstName" type="text" id="firstName" v-model="formData.firstName" v-on:change="event => { formData = { ...formData, firstName: event.target.value }; clearFieldError('firstName'); }" />
                    <span v-if="fieldErrors.firstName" class="field-error error-message">{{ fieldErrors.firstName }}</span>
                </div>
                <div class="field-wrapper lastName-field">
                    <label for="lastName">Last Name <span class="ml-1 text-[red]">*</span></label>
                    <input class="form-input field-input" name="lastName" type="text" id="lastName" v-model="formData.lastName" v-on:change="event => { formData = { ...formData, lastName: event.target.value }; clearFieldError('lastName'); }" />
                    <span v-if="fieldErrors.lastName" class="field-error error-message">{{ fieldErrors.lastName }}</span>
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
                    <input class="form-input field-input" name="email" type="email" id="email" v-model="formData.email" v-on:change="event => { formData = { ...formData, email: event.target.value }; clearFieldError('email'); }" />
                    <span v-if="fieldErrors.email" class="field-error error-message">{{ fieldErrors.email }}</span>
                </div>
            </div>
            <div class="form-row">
                <div class="field-wrapper cellPhone-field">
                    <label for="cellPhone">Cell Phone <span class="ml-1 text-[red]">*</span></label>
                    <input class="form-input field-input" name="cellPhone" type="tel" id="cellPhone" v-model="formData.cellPhone" v-on:change="event => { formData = { ...formData, cellPhone: event.target.value }; clearFieldError('cellPhone'); }" />
                    <span v-if="fieldErrors.cellPhone" class="field-error error-message">{{ fieldErrors.cellPhone }}</span>
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
                    <select class="form-select field-input" name="subject" id="subject" v-model="formData.subject" v-on:change="event => { formData = { ...formData, subject: event.target.value }; clearFieldError('subject'); }">
                        <option value="">I need some help with...</option>
                        <option value="myHomework">My homework</option>
                        <option value="practicingMyHammerDance">Practicing my hammer dance</option>
                        <option value="findingMyBellyButton">Finding my belly button</option>
                    </select>
                    <span v-if="fieldErrors.subject" class="field-error error-message">{{ fieldErrors.subject }}</span>
                </div>
                <div class="field-wrapper">
                    <label for="appointmentDate">Appointment Date</label>
                    <input class="form-input field-input" name="appointmentDate" type="text" id="appointmentDate" placeholder="YYYY/MM/DD" autoComplete="off" v-model="formData.appointmentDate" v-on:change="event => (formData = { ...formData, appointmentDate: event.target.value })"  />
                </div>
                <div class="field-wrapper department-field">
                    <label for="department">Department <span class="ml-1 text-[red]">*</span></label>
                    <select class="form-select field-input" name="department" id="department" v-model="formData.department" v-on:change="event => { formData = { ...formData, department: event.target.value }; clearFieldError('department'); }">
                        <option value="">Please choose...</option>
                        <option value="sales@example.com">Sales</option>
                        <option value="service@example.com">Service</option>
                        <option value="support@example.com">Support</option>
                    </select>
                    <span v-if="fieldErrors.department" class="field-error error-message">{{ fieldErrors.department }}</span>
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
                    <textarea class="form-textarea field-input" name="message" id="message" rows="5" v-model="formData.message" v-on:change="event => { formData = { ...formData, message: event.target.value }; clearFieldError('message'); }"></textarea>
                    <span v-if="fieldErrors.message" class="field-error error-message">{{ fieldErrors.message }}</span>
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
                <div class="field-wrapper acceptTerms-field">
                    <label for="acceptTerms" class="flex flex-row items-center justify-center">
                        <input class="field-input-checkbox" name="acceptTerms" type="checkbox" id="acceptTerms" value="yes" v-on:change="event => { formData = { ...formData, acceptTerms: event.target.checked ? event.target.value : '' }; clearFieldError('acceptTerms'); }" />
                        I agree to the <a href="https://solspace.com" class="mx-1 underline">terms &amp; conditions</a> required by this site. <span class="ml-1 text-[red]">*</span>
                    </label>
                    <span v-if="fieldErrors.acceptTerms" class="field-error error-message">{{ fieldErrors.acceptTerms }}</span>
                </div>
            </div>
            <div class="form-row">
                <div class="flex flex-row items-left justify-left space-y-2 w-full">
                    <button class="btn-primary" type="submit" :disabled="isProcessing || !isFormReady" :style="{ cursor: isProcessing || !isFormReady ? 'not-allowed' : 'pointer' }">{{ isProcessing ? (formProperties.settings.behavior.processingText || 'Submitting...') : (!isFormReady ? 'Loading...' : 'Submit') }}</button>
                </div>
            </div>
        </div>
    </form>
</template>

<style scoped>
</style>
