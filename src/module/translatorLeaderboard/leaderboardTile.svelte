<svelte:options tag="assistant-apps-translation-leaderboard-tile" />

<script lang="ts">
  export let username: string = "";
  export let profileimageurl: string = "";
  export let numtranslations: number = 0;
  export let numvotesgiven: number = 0;
  export let numvotesreceived: number = 0;
  export let total: number = 0;
</script>

<div class="leaderboard-item">
  <img src={profileimageurl} alt={username} class="leaderboard-item-img" />
  <div class="leaderboard-item-contents">
    <h2 class="leaderboard-item-name">{username}</h2>
    <h4 class="leaderboard-item-numbers">
      {#if numtranslations > 0}
        <assistant-apps-tooltip tooltiptext="Number of translations submitted">
          <span class="stat">🌐 {numtranslations}</span>
        </assistant-apps-tooltip>
      {/if}
      {#if numvotesgiven > 0}
        <assistant-apps-tooltip
          tooltiptext="Number of votes given to translations"
        >
          <span class="stat">✔️ {numvotesgiven}</span>
        </assistant-apps-tooltip>
      {/if}
      {#if numvotesreceived > 0}
        <assistant-apps-tooltip tooltiptext="Number of votes received">
          <span class="stat">🗳️ {numvotesreceived}</span>
        </assistant-apps-tooltip>
      {/if}
    </h4>
  </div>
  <h3 class="total">
    <assistant-apps-tooltip tooltiptext="Total points">
      {total} 🏆
    </assistant-apps-tooltip>
  </h3>
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

  .leaderboard-item {
    display: flex;
    border-radius: 5px;
    background-color: var(
      --assistantapps-leaderboard-item-background-colour,
      #6c757d
    );
  }

  .leaderboard-item img.leaderboard-item-img {
    width: 100px;
    height: 100px;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  .leaderboard-item .leaderboard-item-contents {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 1em;
    max-width: calc(100% - 200px);
  }

  .leaderboard-item .leaderboard-item-name,
  .leaderboard-item .leaderboard-item-numbers {
    margin: 0;
    padding: 0;
    color: var(--assistantapps-leaderboard-item-text-colour, #f0f0f0);
  }

  .leaderboard-item .leaderboard-item-numbers {
    padding-top: 0.5em;
  }

  .leaderboard-item .leaderboard-item-name {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25em;
  }

  .leaderboard-item .leaderboard-item-numbers .stat {
    margin-right: 0.25em;
    padding: 0.25em 0.5em 0.25em 0.3em;
    border-radius: 1em;
    background-color: var(
      --assistantapps-leaderboard-item-background-colour,
      #494e52
    );
  }

  .leaderboard-item .total {
    display: flex;
    align-items: center;
    justify-content: end;
    margin: 0 1em 0 0;
    color: var(--assistantapps-leaderboard-item-text-colour, #f0f0f0);
    width: 100px;
  }
</style>
