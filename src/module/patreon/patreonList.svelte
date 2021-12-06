<svelte:options tag="assistant-apps-patreon-list" />

<script lang="ts">
    import { onMount } from "svelte";
    import type { PatreonViewModel } from "../../contracts/generated/AssistantApps/ViewModel/patreonViewModel";
    import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";
    import { NetworkState } from "../../contracts/NetworkState";

    let patreonState: NetworkState = NetworkState.Loading;
    let patrons: Array<PatreonViewModel> = [];

    const fetchPatreons = async () => {
        const aaApi = new AssistantAppsApiService();
        const patreonListResult = await aaApi.getPatronsList();
        if (patreonListResult.isSuccess === false) {
            patreonState = NetworkState.Error;
            return;
        }
        patrons = patreonListResult.value;
        patreonState = NetworkState.Success;
    };

    onMount(async () => {
        fetchPatreons();
    });
</script>

<div class="patreon-container noselect">
    {#if patreonState === NetworkState.Loading}
        <span>Loading...</span>
    {:else if patreonState === NetworkState.Error}
        <span>Something went wrong...</span>
    {:else}
        {#each patrons as patron}
            <assistant-apps-patron-tile
                name={patron.name}
                imageurl={patron.imageUrl}
            />
        {/each}
    {/if}
</div>

<style>
    * {
        font-family: var(
            --assistantapps-font-family,
            "Roboto",
            Helvetica,
            Arial,
            sans-serif
        );
    }

    .noselect {
        -webkit-touch-callout: none;
        /* iOS Safari */
        -webkit-user-select: none;
        /* Safari */
        -khtml-user-select: none;
        /* Konqueror HTML */
        -moz-user-select: none;
        /* Old versions of Firefox */
        -ms-user-select: none;
        /* Internet Explorer/Edge */
        user-select: none;
        /* Non-prefixed version, currently
                                    supported by Chrome, Edge, Opera and Firefox */
    }

    .patreon-container {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        column-gap: 1em;
        row-gap: 1em;
        margin-bottom: 3em;
    }

    @media only screen and (max-width: 1000px) {
        .patreon-container {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 0.5em;
            row-gap: 0.5em;
        }
    }

    @media only screen and (max-width: 600px) {
        .patreon-container {
            grid-template-columns: repeat(1, minmax(0, 1fr));
            column-gap: 0.5em;
            row-gap: 0.5em;
        }
    }
</style>
