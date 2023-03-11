<svelte:options tag="assistant-apps-donators-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { DonationViewModel } from "../../contracts/generated/AssistantApps/ViewModel/donationViewModel";
  import { NetworkState } from "../../contracts/NetworkState";
  import { useApiCall } from "../../helper/apiCallHelper";
  import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<DonationViewModel> = [];

  onMount(async () => {
    const aaApi = new AssistantAppsApiService();
    const [localNetworkState, localItemList] = await useApiCall(
      aaApi.getDonators
    );

    if (localNetworkState == NetworkState.Error) {
      networkState = localNetworkState;
      return;
    }

    items = (localItemList as any).value;
    networkState = localNetworkState;
  });
</script>

<assistant-apps-loading networkstate={networkState}>
  {#if $$slots.loading != null}<slot name="loading" slot="loading" />{/if}
  {#if $$slots.error != null}<slot name="error" slot="error" />{/if}
  <div slot="loaded" class="grid-container donation-container">
    {#each items as item}
      <div class="aa-donation">
        <img
          src={`${window.config.assistantAppsImgRoot}/assets/img/donation/${item.type}.png`}
          alt={item.type.toString()}
          class="donation-img noselect"
        />
        <div class="content">
          <h2 class="app-name">{item.username}</h2>
        </div>
      </div>
    {/each}
  </div>
</assistant-apps-loading>

<style src="./donatorsList.scss"></style>
