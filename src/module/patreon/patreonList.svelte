<svelte:options tag="assistant-apps-patreon-list" />

<script lang="ts">
    import { onMount } from "svelte";
    import PatreonTile from "./patronTile.svelte";
    import type { PatreonViewModel } from "../../contracts/generated/AssistantApps/ViewModel/patreonViewModel";
    import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";
    import { NetworkState } from "../../contracts/NetworkState";

    let patreonState: NetworkState = NetworkState.Loading;
    let patrons: Array<PatreonViewModel> = [];

    const fetchPatreons = async () => {
        const aaApi = new AssistantAppsApiService();
        const patreonListResult = await aaApi.getPatronsList();
        console.log(patreonListResult);
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

<div class="patreon-container">
    {#if patreonState === NetworkState.Loading}
        <span>Loading...</span>
    {:else if patreonState === NetworkState.Error}
        <span>Something went wrong...</span>
    {:else}
        {#each patrons as patron}
            <PatreonTile {patron} />
        {/each}
    {/if}
</div>
