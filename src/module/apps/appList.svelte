<svelte:options tag="assistant-apps-apps-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { AppViewModel } from "@assistantapps/assistantapps.api.client";

  import { NetworkState } from "../../contracts/NetworkState";
  import { init } from "./appList.controller";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<AppViewModel> = [];

  onMount(async () => {
    const [localNetworkState, localItemList] = await init();

    items = [...localItemList];
    networkState = localNetworkState;
  });
</script>

<assistant-apps-loading networkstate={networkState}>
  <slot name="loading" slot="loading" />
  <slot name="error" slot="error" />
  <div slot="loaded" class="grid-container apps-container noselect">
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
