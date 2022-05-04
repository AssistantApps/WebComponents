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

  const fetchLeaderboard = async () => {
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
  };

  onMount(async () => {
    fetchLeaderboard();
  });
</script>

<div class="noselect">
  <assistant-apps-loading
    networkstate={networkState}
    customloading={$$slots.loading}
    customerror={$$slots.error}
  >
    <slot name="loading" slot="loading" />
    <slot name="error" slot="error" />
    <div slot="loaded" class="leaderboard-container">
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
</div>

<style>
  * {
    font-family: var(
      --assistantapps-font-family,
      "Roboto",
      Helvetica,
      Arial,
      sans-serif
    );
    font-weight: var(--assistantapps-font-weight, "bold");
  }

  .noselect {
    -webkit-touch-callout: none;
    /* iOS Safari */
    -webkit-user-select: none;
    /* Safari */
    -khtml-user-select: none;
    /* Konqueror HTML */
    -moz-user-select: none;
    /* Old versions of Firefox */
    -ms-user-select: none;
    /* Internet Explorer/Edge */
    user-select: none;
    /* Non-prefixed version, currently
                                    supported by Chrome, Edge, Opera and Firefox */
  }

  .leaderboard-container {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: 1em;
    row-gap: 1em;
    margin-bottom: 3em;
  }

  @media only screen and (max-width: 1300px) {
    .leaderboard-container {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      column-gap: 0.5em;
      row-gap: 0.5em;
    }
  }

  @media only screen and (max-width: 800px) {
    .leaderboard-container {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media only screen and (max-width: 500px) {
    .leaderboard-container {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }
</style>
