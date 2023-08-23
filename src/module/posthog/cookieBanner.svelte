<svelte:options tag="assistant-apps-posthog-cookiebanner" />

<script lang="ts">
    import { onMount } from "svelte";
    import { postHogInit, postHogSetup } from "./posthog.func";
    import { getAssistantAppsImgRoot } from "../../services/dependencyInjection";

    export let analyticscode: string = "";

    let showbanner: boolean = true;

    const cookieDecisionKey = "cookieDecision";
    const cookieDecisionAllow = "Allow";
    const cookieDecisionDecline = "Decline";

    onMount(() => {
        if (analyticscode == null || analyticscode.length < 10) {
            showbanner = false;
            return;
        }

        postHogSetup();

        const cookieDecision = localStorage.getItem(cookieDecisionKey);
        const cookiesEnabled = cookieDecision === cookieDecisionAllow;
        postHogInit(analyticscode, {
            cookiesEnabled,
            uniqueId: undefined,
        });

        if (cookiesEnabled || cookieDecision === cookieDecisionDecline) {
            showbanner = false;
            return;
        }
    });

    const onAccept = () => {
        localStorage.setItem(cookieDecisionKey, cookieDecisionAllow);
        postHogInit(analyticscode);
        showbanner = false;
    };

    const onDecline = () => {
        localStorage.setItem(cookieDecisionKey, cookieDecisionDecline);
        showbanner = false;
    };
</script>

{#if showbanner}
    <div class="aa-cookie-banner">
        <img
            src={`${getAssistantAppsImgRoot()}/assets/img/posthogCookies.png`}
            alt="PostHog cookie icon"
            class="noselect"
        />
        <div class="content">
            <h2 class="banner-title">
                Can we store some information on your device?
            </h2>
            <p class="banner-description">
                We make use of <a
                    href="https://posthog.com"
                    target="_blank"
                    rel="noopener noreferrer">PostHog</a
                >, an Open-Source, GDPR compliant and privacy friendly analytics
                tool.
                <a
                    href="https://posthog.com"
                    target="_blank"
                    rel="noopener noreferrer">PostHog</a
                >
                helps us collect anonymous data to help us improve our site.
                <br />
                Can we store analytics collected about your visit to our page into
                cookies 🍪?
            </p>
        </div>
        <div class="actions">
            <button on:click={onAccept} class="preferred"
                >Enable cookies 🍪</button
            >
            <button on:click={onDecline}>No cookies!</button>
        </div>
    </div>
{/if}

<style src="./cookieBanner.scss"></style>
