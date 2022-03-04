<svelte:options tag="assistant-apps-patreon-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { PatreonViewModel } from "../../contracts/generated/AssistantApps/ViewModel/patreonViewModel";
  import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";
  import { NetworkState } from "../../contracts/NetworkState";

  let networkState: NetworkState = NetworkState.Loading;
  let patrons: Array<PatreonViewModel> = [];

  const fetchPatreons = async () => {
    const aaApi = new AssistantAppsApiService();
    const patreonListResult = await aaApi.getPatronsList();
    if (
      patreonListResult.isSuccess == false ||
      patreonListResult.value == null ||
      patreonListResult.value.length < 1
    ) {
      networkState = NetworkState.Error;
      return;
    }
    patrons = patreonListResult.value;
    networkState = NetworkState.Success;
  };

  onMount(async () => {
    fetchPatreons();
  });
</script>

<div class="noselect">
  {#if networkState === NetworkState.Loading}
    <slot name="loading">
      <div style="text-align: center">
        <span>Loading...</span>
      </div>
    </slot>
  {:else if networkState === NetworkState.Error}
    <slot name="error">
      <div style="text-align: center">
        <span>Something went wrong...</span>
      </div>
    </slot>
  {:else}
    <div class="patreon-container">
      {#each patrons as patron}
        <assistant-apps-patron-tile
          name={patron.name}
          imageurl={patron.imageUrl}
        />
      {/each}
    </div>
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
    font-weight: var(--assistantapps-font-weight, "bold");
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

  @media only screen and (max-width: 1300px) {
    .patreon-container {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 0.5em;
      row-gap: 0.5em;
    }
  }

  @media only screen and (max-width: 800px) {
    .patreon-container {
      grid-template-columns: repeat(1, minmax(0, 1fr));
      column-gap: 0.5em;
      row-gap: 0.5em;
    }
  }
</style>
