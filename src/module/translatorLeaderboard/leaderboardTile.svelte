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
    <h3 class="leaderboard-item-name">{username}</h3>
    <p class="leaderboard-item-role">{total}</p>
  </div>
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
    padding-bottom: 1em;
  }

  .leaderboard-item img.leaderboard-item-img {
    width: 75px;
    height: 75px;
    border-radius: 5px;
  }

  .leaderboard-item .leaderboard-item-contents {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 1em;
  }

  .leaderboard-item .leaderboard-item-name,
  .leaderboard-item .leaderboard-item-role {
    margin: 0;
    padding: 0;
    color: var(--assistantapps-leaderboard-item-text-colour, #f0f0f0);
  }
</style>
