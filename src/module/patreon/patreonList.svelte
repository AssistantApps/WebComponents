<svelte:options tag="assistant-apps-patreon-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { PatreonViewModel } from "@assistantapps/assistantapps.api.client";

  import { NetworkState } from "../../contracts/NetworkState";
  import { init } from "./patreonList.controller";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<PatreonViewModel> = [];

  onMount(async () => {
    const [localNetworkState, localItemList] = await init();

    items = [...localItemList];
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
