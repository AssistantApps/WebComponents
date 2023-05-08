<svelte:options tag="assistant-apps-translation-leaderboard" />

<script lang="ts">
  import type { TranslatorLeaderboardItemViewModel } from "@assistantapps/assistantapps.api.client";
  import { onMount } from "svelte";

  import { NetworkState } from "../../contracts/NetworkState";
  import { init } from "./leaderboardList.controller";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<TranslatorLeaderboardItemViewModel> = [];

  onMount(async () => {
    const [localNetworkState, localItemList] = await init();

    items = [...localItemList];
    networkState = localNetworkState;
  });
</script>

<assistant-apps-loading networkstate={networkState}>
  <slot name="loading" slot="loading" />
  <slot name="error" slot="error" />
  <div slot="loaded" class="grid-container leaderboard-container noselect">
    {#each items as leaderBoardItem}
      <assistant-apps-translation-leaderboard-tile
        username={leaderBoardItem.username}
        profileimageurl={leaderBoardItem.profileImageUrl}
        numtranslations={leaderBoardItem.numTranslations}
        numvotesgiven={leaderBoardItem.numVotesGiven}
        numvotesreceived={leaderBoardItem.numVotesReceived}
        total={leaderBoardItem.total}
      />
    {/each}
  </div>
</assistant-apps-loading>

<style src="./leaderboardList.scss"></style>
