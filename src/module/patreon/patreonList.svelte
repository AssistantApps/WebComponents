<svelte:options tag="assistant-apps-patreon-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { PatreonViewModel } from "../../contracts/generated/AssistantApps/ViewModel/patreonViewModel";
  import { NetworkState } from "../../contracts/NetworkState";
  import { useApiCall } from "../../helper/apiCallHelper";
  import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<PatreonViewModel> = [];

  onMount(async () => {
    const aaApi = new AssistantAppsApiService();
    const [localNetworkState, localItemList] = await useApiCall(
      aaApi.getPatronsList
    );

    if (localNetworkState == NetworkState.Error) {
      networkState = localNetworkState;
      return;
    }

    items = [
      ...localItemList.map((p) => ({ ...p, url: undefined } as any)),
      {
        name: "Join Patreon",
        imageUrl: "https://cdn.assistantapps.com/patreon.png",
        thumbnailUrl: "https://cdn.assistantapps.com/patreon.png",
        url: "https://patreon.com/AssistantApps",
      },
    ];
    networkState = localNetworkState;
  });
</script>

<assistant-apps-loading networkstate={networkState}>
  <slot name="loading" slot="loading" />
  <slot name="error" slot="error" />
  <div slot="loaded" class="grid-container patreon-container noselect">
    {#each items as patron}
      <assistant-apps-patron-tile
        url={patron.url ?? "https://assistantapps.com"}
        name={patron.name}
        imageurl={patron.imageUrl}
      />
    {/each}
  </div>
</assistant-apps-loading>

<style src="./patreonList.scss"></style>
