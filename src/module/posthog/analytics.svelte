<svelte:options tag="assistant-apps-posthog-analytics-no-cookie" />

<script lang="ts">
    import { onMount } from "svelte";
    import { uuidv4 } from "../../helper/guidHelper";
    import { postHogInit, postHogSetup } from "./posthog.func";

    export let analyticscode: string = "";

    let showbanner: boolean = true;

    const userGuidKey = "anonymousUserGuid";

    onMount(() => {
        if (analyticscode == null || analyticscode.length < 10) {
            showbanner = false;
            return;
        }

        postHogSetup();

        let userGuid = localStorage.getItem(userGuidKey);
        if (userGuid == null || userGuid.length < 10) {
            userGuid = uuidv4();
            localStorage.setItem(userGuidKey, userGuid);
        }

        postHogInit(analyticscode, {
            cookiesEnabled: false,
            uniqueId: userGuid,
        });
    });
</script>

<span style="display: none">
    <a
        href="https://posthog.com/tutorials/cookieless-tracking"
        target="_blank"
        rel="noopener noreferrer">Learn more about cookie-less tracking</a
    >
</span>
