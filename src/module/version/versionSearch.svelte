<svelte:options tag="assistant-apps-version-search" />

<script lang="ts">
  import type {
    AppViewModel,
    VersionViewModel,
  } from "@assistantapps/assistantapps.api.client";
  import { onMount } from "svelte";

  import { NetworkState } from "../../contracts/NetworkState";
  import { getAssistantAppsService } from "../../services/dependencyInjection";
  import { fetchWhatIsNewItems, init } from "./versionSearch.controller";

  let networkState: NetworkState = NetworkState.Loading;
  let appLookup: Array<AppViewModel> = [];
  let selectedApp: AppViewModel;
  let whatIsNewItems: Array<VersionViewModel> = [];

  onMount(async () => {
    const initState = await init();

    networkState = initState.networkState;
    appLookup = initState.appLookup;
    selectedApp = initState.selectedApp;
    whatIsNewItems = initState.whatIsNewItems;
  });

  const localFetchWhatIsNewItems = async (appSelected: AppViewModel) => {
    const aaApi = getAssistantAppsService();
    const fetchWhatIsNewState = await fetchWhatIsNewItems(aaApi, appSelected);
    if (fetchWhatIsNewState[0] == NetworkState.Error) {
      networkState = NetworkState.Error;
      return;
    }

    whatIsNewItems = fetchWhatIsNewState[1];
    networkState = NetworkState.Success;
  };
</script>

<div class="noselect">
  <assistant-apps-loading networkstate={networkState}>
    <slot name="loading" slot="loading" />
    <slot name="error" slot="error" />
    <div slot="loaded" class="version-container">
      <label class="dropdown">
        {#if selectedApp != null}
          <div class="dd-button">
            <img src={selectedApp.iconUrl} alt={selectedApp.name} />
            <p>{selectedApp.name}</p>
          </div>
        {:else}
          <div class="dd-button">
            <p>Please Select an App</p>
          </div>
        {/if}
        <input type="checkbox" class="dd-input" />
        <ul class="dd-menu">
          {#each appLookup as app}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li
              class="dd-menu-item"
              value={app.guid}
              on:click={() => localFetchWhatIsNewItems(app)}
            >
              <img src={app.iconUrl} alt={app.name} />
              <p>{app.name}</p>
            </li>
          {/each}
        </ul>
      </label>

      <div class="what-is-new-container noselect">
        {#each whatIsNewItems ?? [] as whatIsNewItem}
          <assistant-apps-version-search-tile
            guid={whatIsNewItem.guid}
            markdown={whatIsNewItem.markdown}
            buildname={whatIsNewItem.buildName}
            buildnumber={whatIsNewItem.buildNumber}
            platforms={whatIsNewItem.platforms}
            activedate={whatIsNewItem.activeDate}
          />
        {/each}
        {#if whatIsNewItems == null || whatIsNewItems.length < 1}
          <p>No items to display</p>
        {/if}
      </div>
    </div>
  </assistant-apps-loading>
</div>

<style src="./versionSearch.scss"></style>
