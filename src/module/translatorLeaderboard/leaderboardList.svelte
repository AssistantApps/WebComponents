<svelte:options tag="assistant-apps-translation-leaderboard" />

<script lang="ts">
  import { onMount } from "svelte";

  import type { ResultWithValueAndPagination } from "../../contracts/results/ResultWithValue";
  import type { TranslatorLeaderboardItemViewModel } from "../../contracts/generated/AssistantApps/ViewModel/Translation/translatorLeaderboardItemViewModel";
  import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";
  import { NetworkState } from "../../contracts/NetworkState";
  import { anyObject } from "../../helper/typescriptHacks";

  let networkState: NetworkState = NetworkState.Loading;
  let leaderBoardResult: ResultWithValueAndPagination<
    Array<TranslatorLeaderboardItemViewModel>
  > = anyObject;

  onMount(async () => {
    const aaApi = new AssistantAppsApiService();
    const leaderboardListResult = await aaApi.getTranslators();
    if (
      leaderboardListResult.isSuccess == false ||
      leaderboardListResult.value == null ||
      leaderboardListResult.value.isSuccess == false ||
      leaderboardListResult.value.value == null ||
      leaderboardListResult.value.value.length < 1
    ) {
      networkState = NetworkState.Error;
      return;
    }
    leaderBoardResult = leaderboardListResult.value;
    networkState = NetworkState.Success;
  });
</script>

<assistant-apps-loading networkstate={networkState}>
  <slot name="loading" slot="loading" />
  <slot name="error" slot="error" />
  <div slot="loaded" class="grid-container leaderboard-container noselect">
    {#each leaderBoardResult.value ?? [] as leaderBoardItem}
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
