<svelte:options tag="assistant-apps-tooltip" />

<script lang="ts">
    export let tooltiptext: string = "";
</script>

<div class="tooltip">
    <slot />
    <span class="tooltiptext">
        {tooltiptext}
    </span>
</div>

<style>
    .tooltip {
        position: relative;
        display: inline-block;
    }

    .tooltip .tooltiptext {
        left: 50%;
        bottom: 120%;
        min-width: 100px;
        margin-left: -50%;
        visibility: hidden;
        background-color: var(
            --assistantapps-tooltip-background-colour,
            #383838
        );
        color: var(--assistantapps-tooltip-text-colour, #ffffff);
        text-align: center;
        border-radius: 6px;
        padding: 0.25em 0.5em;

        /* Position the tooltip */
        position: absolute;
        z-index: 1;
    }

    .tooltip:hover .tooltiptext {
        visibility: visible;
    }
</style>
