<svelte:options tag="assistant-apps-version-search-tile" />

<script lang="ts">
    import SvelteMarkdown from "svelte-markdown";
    import { defaultFormat } from "../../helper/dateHelper";

    export let guid: any = "";
    export let markdown: string = "";
    export let buildname: string = "";
    export let buildnumber: number = 0;
    export let platforms: any[] = [];
    export let activedate: Date = null;
</script>

<div class="version" data-guid={guid}>
    <div class="version-header">
        <h3 class="version-name">{buildname}</h3>
        <span class="version-date">{defaultFormat(activedate)}</span>
    </div>
    <div class="markdown">
        <assistant-apps-markdown source={markdown} />
    </div>
</div>

<style>
    .version {
        display: flex;
        flex-direction: column;
        position: relative;
        background-color: var(
            --assistantapps-version-background-colour,
            rgba(174, 176, 179, 0.692)
        );
        border-radius: 5px;
        overflow: hidden;
    }

    .version-header .version-date {
        position: absolute;
        top: 1em;
        right: 1em;
        color: var(--assistantapps-version-text-colour, white);
    }

    .version .version-name {
        display: flex;
        flex-direction: column;
        justify-content: center;
        color: var(--assistantapps-version-text-colour, white);
        padding-left: 1em;
        padding-right: 0.5em;
        margin-bottom: 0;
        line-height: 1.2em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .version .markdown {
        padding-right: 0.5em;
        margin-bottom: 0.5em;
    }

    .version .markdown,
    .version .markdown * {
        color: var(--assistantapps-version-text-colour, white);
    }
</style>
