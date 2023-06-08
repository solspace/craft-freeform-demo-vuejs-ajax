<script>
import { useReCaptcha } from 'vue-recaptcha-v3';

const defaultFormData = {
    typeOfContact: '',
    workPhone: '',
    subject: '',
    message: '',
    lastName: '',
    howMuchDoYouEnjoyEatingPie: '',
    howHeardOther: '',
    howDidYouHearAboutThisJobPosting: [],
    homePhone: '',
    firstName: '',
    email: '',
    department: '',
    companyName: '',
    cellPhone: '',
    appointmentDateTime: '',
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
};

async function getFormProperties(formId) {
    // See https://docs.solspace.com/craft/freeform/v4/developer/graphql/#how-to-render-a-form
    const response = await fetch(`https://demo.solspace.net/craft/freeform/form/properties/${formId}`, { headers: { 'Accept': 'application/json' }});

    if (!response.ok) {
        throw new Error('Failed to fetch Craft Freeform Form properties');
    }

    return response.json();
}

async function saveContactSubmission(params) {
    const { reCaptchaValue, formData, formProperties } = params;
    const { csrf, hash, honeypot, freeform_payload, reCaptcha } = formProperties;

    const body = new FormData();
    body.append(csrf.name, csrf.token);
    body.append(honeypot.name, honeypot.value);

    body.append('formHash', hash);
    body.append('freeform_payload', freeform_payload);
    body.append(reCaptcha.name, reCaptchaValue);

    body.append('typeOfContact', formData.typeOfContact);
    body.append('firstName', formData.firstName);
    body.append('lastName', formData.lastName);
    body.append('companyName', formData.companyName);
    body.append('email', formData.email);
    body.append('cellPhone', formData.cellPhone);
    body.append('homePhone', formData.homePhone);
    body.append('workPhone', formData.workPhone);
    body.append('subject', formData.subject);
    body.append('appointmentDateTime', formData.appointmentDateTime);
    body.append('department', formData.department);
    body.append('howMuchDoYouEnjoyEatingPie', formData.howMuchDoYouEnjoyEatingPie);
    body.append('message', formData.message);

    for (let i = 0; i < formData.howDidYouHearAboutThisJobPosting.length; i++) {
        body.append('howDidYouHearAboutThisJobPosting[]', formData.howDidYouHearAboutThisJobPosting[i]);
    }

    body.append('howHeardOther', formData.howHeardOther);
    body.append('acceptTerms', formData.acceptTerms);

    const response = await fetch('https://demo.solspace.net/craft/actions/freeform/submit', {
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
    name: 'ContactForm',
    data: () => ({
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
        const formId = 1;

        getFormProperties(formId).then(formProperties => {
            this.formProperties = formProperties;
        });

        this.getReCaptcha().then(reCaptchaValue => {
            this.reCaptchaValue = reCaptchaValue;
        });
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
        async handleSubmit() {
            const formData = this.formData;
            const formProperties = this.formProperties;
            const reCaptchaValue = this.reCaptchaValue;

            const response = await saveContactSubmission({ reCaptchaValue, formData, formProperties });
            console.log(response);
        },
    },
};
</script>

<template>
    <form class="text-center flex flex-col items-center justify-center" @submit.prevent="handleSubmit">
        <h3 class="mb-4 text-xl font-normal">Contact Form</h3>
        <div class="flex flex-col w-full space-y-6">
            <div class="flex flex-col items-start justify-center space-y-2 w-full">
                <label for="typeOfContact-Personal" class="flex flex-row">Type of Contact <span class="ml-1 text-[red]">*</span></label>
                <div class="flex flex-row space-x-4">
                    <label class="flex flex-row items-center justify-center">
                        <input class="form-radio mr-2" name="typeOfContact" type="radio" id="typeOfContact-Personal" value="Personal" v-on:change="event => (formData = { ...formData, typeOfContact: event.target.value })" required /> Personal
                    </label>
                    <label class="flex flex-row items-center justify-center">
                        <input class="form-radio mr-2" name="typeOfContact" type="radio" id="typeOfContact-Organization" value="Organization" v-on:change="event => (formData = { ...formData, typeOfContact: event.target.value })" required /> Organization
                    </label>
                </div>
            </div>
            <div class="flex flex-row space-x-4 w-full">
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="firstName">First Name <span class="ml-1 text-[red]">*</span></label>
                    <input class="form-input w-full" name="firstName" type="text" id="firstName" v-model="formData.firstName" v-on:change="event => (formData = { ...formData, firstName: event.target.value })" required />
                </div>
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="lastName">Last Name <span class="ml-1 text-[red]">*</span></label>
                    <input class="form-input w-full" name="lastName" type="text" id="lastName" v-model="formData.lastName" v-on:change="event => (formData = { ...formData, lastName: event.target.value })" required />
                </div>
            </div>
            <div class="flex flex-row w-full">
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="companyName">Organization Name</label>
                    <input class="form-input w-full" name="companyName" type="text" id="companyName" v-model="formData.companyName" v-on:change="event => (formData = { ...formData, companyName: event.target.value })" />
                </div>
            </div>
            <div class="flex flex-row w-full">
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="email">Email <span class="ml-1 text-[red]">*</span></label>
                    <div class="text-sm">We&apos;ll never share your email with anyone else.</div>
                    <input class="form-input w-full" name="email" type="email" id="email" v-model="formData.email" v-on:change="event => (formData = { ...formData, email: event.target.value })" required />
                </div>
            </div>
            <div class="flex flex-row space-x-4 w-full">
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="cellPhone">Cell Phone</label>
                    <input class="form-input w-full" name="cellPhone" type="tel" id="cellPhone" v-model="formData.cellPhone" v-on:change="event => (formData = { ...formData, cellPhone: event.target.value })" />
                </div>
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="homePhone">Home Phone</label>
                    <input class="form-input w-full" name="homePhone" type="tel" id="homePhone" v-model="formData.homePhone" v-on:change="event => (formData = { ...formData, homePhone: event.target.value })" />
                </div>
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="workPhone">Work Phone</label>
                    <input class="form-input w-full" name="workPhone" type="tel" id="workPhone" v-model="formData.workPhone" v-on:change="event => (formData = { ...formData, workPhone: event.target.value })" />
                </div>
            </div>
            <div class="flex flex-row space-x-4 w-full">
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="subject">Subject <span class="ml-1 text-[red]">*</span></label>
                    <select class="form-select w-full" name="subject" id="subject" v-model="formData.subject" v-on:change="event => (formData = { ...formData, subject: event.target.value })" required>
                        <option value="">I need some help with...</option>
                        <option value="myHomework">My homework</option>
                        <option value="practicingMyHammerDance">Practicing my hammer dance</option>
                        <option value="findingMyBellyButton">Finding my belly button</option>
                    </select>
                </div>
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="appointmentDateTime">Appointment Date &amp; Time <span class="ml-1 text-[red]">*</span></label>
                    <input class="form-input w-full" name="appointmentDateTime" type="text" id="appointmentDateTime" placeholder="YYYY/MM/DD H:MM TT" autoComplete="off" v-model="formData.appointmentDateTime" v-on:change="event => (formData = { ...formData, appointmentDateTime: event.target.value })" required />
                </div>
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="department">Department <span class="ml-1 text-[red]">*</span></label>
                    <select class="form-select w-full" name="department" id="department" v-model="formData.department" v-on:change="event => (formData = { ...formData, department: event.target.value })" required>
                        <option value="">Please choose...</option>
                        <option value="sales@example.com">Sales</option>
                        <option value="service@example.com">Service</option>
                        <option value="support@example.com">Support</option>
                    </select>
                </div>
            </div>
            <div class="flex flex-row space-x-4 w-full">
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="howMuchDoYouEnjoyEatingPie-1" class="flex flex-row">How much do you enjoy eating pie?</label>
                    <div class="flex flex-row space-x-4">
                        <label for="howMuchDoYouEnjoyEatingPie-1" class="flex flex-row items-center justify-center">
                            <input class="form-radio mr-2" name="howMuchDoYouEnjoyEatingPie" type="radio" id="howMuchDoYouEnjoyEatingPie-1" value="1" v-on:change="event => (formData = { ...formData, howMuchDoYouEnjoyEatingPie: event.target.value })" /> 1
                        </label>
                        <label for="howMuchDoYouEnjoyEatingPie-2" class="flex flex-row items-center justify-center">
                            <input class="form-radio mr-2" name="howMuchDoYouEnjoyEatingPie" type="radio" id="howMuchDoYouEnjoyEatingPie-2" value="2" v-on:change="event => (formData = { ...formData, howMuchDoYouEnjoyEatingPie: event.target.value })" /> 2
                        </label>
                        <label for="howMuchDoYouEnjoyEatingPie-3" class="flex flex-row items-center justify-center">
                            <input class="form-radio mr-2" name="howMuchDoYouEnjoyEatingPie" type="radio" id="howMuchDoYouEnjoyEatingPie-3" value="3" v-on:change="event => (formData = { ...formData, howMuchDoYouEnjoyEatingPie: event.target.value })" /> 3
                        </label>
                        <label for="howMuchDoYouEnjoyEatingPie-4" class="flex flex-row items-center justify-center">
                            <input class="form-radio mr-2" name="howMuchDoYouEnjoyEatingPie" type="radio" id="howMuchDoYouEnjoyEatingPie-4" value="4" v-on:change="event => (formData = { ...formData, howMuchDoYouEnjoyEatingPie: event.target.value })" /> 4
                        </label>
                        <label for="howMuchDoYouEnjoyEatingPie-5" class="flex flex-row items-center justify-center">
                            <input class="form-radio mr-2" name="howMuchDoYouEnjoyEatingPie" type="radio" id="howMuchDoYouEnjoyEatingPie-5" value="5" v-on:change="event => (formData = { ...formData, howMuchDoYouEnjoyEatingPie: event.target.value })" /> 5
                        </label>
                    </div>
                </div>
            </div>
            <div class="flex flex-row space-x-4 w-full">
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="message">Message <span class="ml-1 text-[red]">*</span></label>
                    <textarea class="form-textarea w-full" name="message" id="message" rows={5} v-model="formData.message" v-on:change="event => (formData = { ...formData, message: event.target.value })" required></textarea>
                </div>
            </div>
            <div class="flex flex-row space-x-4 w-full">
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="howDidYouHearAboutThisJobPosting-Newspaper">How did you hear about us?</label>
                    <label class="flex flex-row items-center justify-center">
                        <input class="form-checkbox mr-2" name="howDidYouHearAboutThisJobPosting[]" type="checkbox" id="howDidYouHearAboutThisJobPosting-Newspaper" value="Newspaper" v-on:change="handleHowDidYouHearAboutThisJobPosting" /> Newspaper
                    </label>
                    <label class="flex flex-row items-center justify-center">
                        <input class="form-checkbox mr-2" name="howDidYouHearAboutThisJobPosting[]" type="checkbox" id="howDidYouHearAboutThisJobPosting-Radio" value="Radio" v-on:change="handleHowDidYouHearAboutThisJobPosting" /> Radio
                    </label>
                    <label class="flex flex-row items-center justify-center">
                        <input class="form-checkbox mr-2" name="howDidYouHearAboutThisJobPosting[]" type="checkbox" id="howDidYouHearAboutThisJobPosting-CarrierPigeon" value="Carrier Pigeon" v-on:change="handleHowDidYouHearAboutThisJobPosting" /> Carrier Pigeon
                    </label>
                    <label class="flex flex-row items-center justify-center">
                        <input class="form-checkbox mr-2" name="howDidYouHearAboutThisJobPosting[]" type="checkbox" id="howDidYouHearAboutThisJobPosting-Other" value="Other" v-on:change="handleHowDidYouHearAboutThisJobPosting" /> Other
                    </label>
                </div>
                <div class="flex flex-col items-start justify-start space-y-2 w-full">
                    <label for="howHeardOther">Other</label>
                    <div class="text-sm">Please describe how you heard about us.</div>
                    <input class="form-input w-full" name="howHeardOther" type="text" id="howHeardOther" v-model="formData.howHeardOther" v-on:change="event => (formData = { ...formData, howHeardOther: event.target.value })" />
                </div>
            </div>
            <div class="flex flex-row space-x-4 w-full">
                <div class="flex flex-col items-start justify-center space-y-2 w-full">
                    <label for="acceptTerms" class="flex flex-row items-center justify-center">
                        <input class="form-checkbox mr-2" name="acceptTerms" type="checkbox" id="acceptTerms" value="yes" v-on:change="event => (formData = { ...formData, acceptTerms: event.target.checked ? event.target.value : '' })" required />
                        I agree to the <a href="https://solspace.com" class="mx-1 underline">terms &amp; conditions</a> required by this site. <span class="ml-1 text-[red]">*</span>
                    </label>
                </div>
            </div>
            <div class="flex flex-row w-full">
                <div class="flex flex-row items-center justify-center space-y-2 w-full">
                    <button class="btn-primary" type="submit">Submit</button>
                </div>
            </div>
        </div>
    </form>
</template>

<style scoped>
</style>
