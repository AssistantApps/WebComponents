<svelte:options tag="assistant-apps-donators-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { DonationViewModel } from "@assistantapps/assistantapps.api.client";

  import { NetworkState } from "../../contracts/NetworkState";
  import { getAssistantAppsImgRoot } from "../../services/dependencyInjection";
  import { init } from "./donatorsList.controller";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<DonationViewModel> = [];

  onMount(async () => {
    const [localNetworkState, localItemList] = await init();

    items = [...localItemList];
    networkState = localNetworkState;
  });
</script>

<assistant-apps-loading networkstate={networkState}>
  <slot name="loading" slot="loading" />
  <slot name="error" slot="error" />
  <div slot="loaded" class="grid-container donation-container">
    {#each items as item}
      <div class="aa-donation">
        <img
          src={`${getAssistantAppsImgRoot()}/assets/img/donation/${
            item.type
          }.png`}
          alt={item.type.toString()}
          class="donation-img noselect"
        />
        <div class="content">
          <h2 class="app-name">{item.username}</h2>
        </div>
      </div>
    {/each}
    <div class="aa-donation">
      <img
        src={`${getAssistantAppsImgRoot()}/assets/img/donation/GithubSponsors.png`}
        alt="other"
        class="donation-img noselect"
      />
      <div class="content">
        <h2 class="app-name">Many more supporters</h2>
      </div>
    </div>
  </div>
</assistant-apps-loading>

<style src="./donatorsList.scss"></style>
