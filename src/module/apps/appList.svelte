<svelte:options tag="assistant-apps-apps-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { AppViewModel } from "../../contracts/generated/AssistantApps/ViewModel/appViewModel";
  import { NetworkState } from "../../contracts/NetworkState";
  import { useApiCall } from "../../helper/apiCallHelper";
  import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<AppViewModel> = [];

  onMount(async () => {
    const aaApi = new AssistantAppsApiService();
    const [localNetworkState, localItemList] = await useApiCall(aaApi.getApps);

    if (localNetworkState == NetworkState.Error) {
      networkState = localNetworkState;
      return;
    }

    const localApps = localItemList.filter((app) => app.isVisible);
    localApps.sort(
      (a: AppViewModel, b: AppViewModel) => a.sortOrder - b.sortOrder
    );

    items = [...localApps];
    networkState = localNetworkState;
  });
</script>

<assistant-apps-loading networkstate={networkState}>
  {#if $$slots.loading != null}<slot name="loading" slot="loading" />{/if}
  {#if $$slots.error != null}<slot name="error" slot="error" />{/if}
  <div slot="loaded" class="grid-container apps-container">
    {#each items as item}
      <assistant-apps-app-tile
        name={item.name}
        gamename={item.gameName}
        logourl={item.logoUrl}
      />
    {/each}
  </div>
</assistant-apps-loading>

<style src="./appList.scss"></style>
