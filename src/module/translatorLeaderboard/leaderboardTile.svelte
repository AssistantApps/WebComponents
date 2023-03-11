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

<style src="./leaderboardTile.scss"></style>
