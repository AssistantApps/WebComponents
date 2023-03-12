<svelte:options tag="assistant-apps-app-notice-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { AppNoticeViewModel } from "../../contracts/generated/AssistantApps/ViewModel/appNoticeViewModel";
  import { NetworkState } from "../../contracts/NetworkState";
  import { useApiCall } from "../../helper/apiCallHelper";
  import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";

  export let appguid: string = "";
  export let langcode: string = "";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<AppNoticeViewModel> = [];

  onMount(async () => {
    const aaApi = new AssistantAppsApiService();
    const [localNetworkState, localItemList] = await useApiCall(() =>
      aaApi.getAppNotices(appguid, langcode)
    );

    const localItems = localItemList.filter((app) => app.isVisible);
    localItems.sort(
      (a: AppNoticeViewModel, b: AppNoticeViewModel) =>
        a.sortOrder - b.sortOrder
    );

    items = [...localItems];
    networkState = localNetworkState;
  });
</script>

<assistant-apps-loading networkstate={networkState}>
  {#if $$slots.loading != null}<slot name="loading" slot="loading" />{/if}
  {#if $$slots.error != null}<slot name="error" slot="error" />{/if}
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
