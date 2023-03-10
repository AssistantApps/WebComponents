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
    patrons = [
      ...patreonListResult.value.map((p) => ({ ...p, url: undefined })),
      {
        name: "Join Patreon",
        imageUrl: "https://cdn.assistantapps.com/patreon.png",
        thumbnailUrl: "https://cdn.assistantapps.com/patreon.png",
        url: "https://patreon.com/AssistantApps",
      },
    ];
    networkState = NetworkState.Success;
  };

  onMount(async () => {
    fetchPatreons();
  });
</script>

<div class="noselect">
  <assistant-apps-loading networkstate={networkState}>
    <slot name="loading" slot="loading" />
    <slot name="error" slot="error" />
    <div slot="loaded" class="patreon-container">
      {#each patrons as patron}
        <assistant-apps-patron-tile
          url={patron.url ?? "https://assistantapps.com"}
          name={patron.name}
          imageurl={patron.imageUrl}
        />
      {/each}
    </div>
  </assistant-apps-loading>
</div>

<style src="./patreon.scss"></style>
