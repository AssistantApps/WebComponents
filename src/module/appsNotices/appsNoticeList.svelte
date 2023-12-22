<svelte:options tag="assistant-apps-app-notice-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { AppNoticeViewModel } from "@assistantapps/assistantapps.api.client";

  import { NetworkState } from "../../contracts/NetworkState";
  import { init } from "./appsNoticeList.controller";

  export let appguid: string = "";
  export let langcode: string = "";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<AppNoticeViewModel> = [];

  onMount(async () => {
    const [localNetworkState, localItemList] = await init(appguid, langcode);

    items = [...localItemList];
    networkState = localNetworkState;
  });
</script>

<assistant-apps-loading networkstate={networkState}>
  <slot name="loading" slot="loading" />
  <slot name="error" slot="error" />
  <div slot="loaded" class="grid-container app-notice-container noselect">
    {#if items.length > 0}
      {#each items as item}
        <assistant-apps-app-notice-tile
          name={item.name}
          subtitle={item.subtitle}
          iconurl={item.iconUrl}
        />
      {/each}
    {:else}
      <h3>No Notices to display</h3>
    {/if}
  </div>
</assistant-apps-loading>

<style src="./appsNoticeList.scss"></style>
