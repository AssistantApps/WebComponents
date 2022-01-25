<svelte:options tag="assistant-apps-team-tile" />

<script lang="ts">
  export let name: string = "";
  export let role: string = "";
  export let imageurl: string = "";
  export let linkname: string = "";
  export let linkurl: string = "";
</script>

<div class="team-member">
  <img src={imageurl} alt={name} class="team-member-img" />
  <div class="team-member-contents">
    <h3 class="team-member-name">{name}</h3>
    <p class="team-member-role">{role}</p>
    {#if linkurl != null && linkname != null}
      <a href={linkurl} target="_blank" rel="noopener noreferrer">{linkname}</a>
    {/if}
  </div>
</div>

<style>
  .team-member {
    display: flex;
    padding-bottom: 1em;
  }

  .team-member img.team-member-img {
    width: 75px;
    height: 75px;
    border-radius: 5px;
  }

  .team-member .team-member-contents {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 1em;
  }

  .team-member .team-member-name,
  .team-member .team-member-role {
    margin: 0;
    padding: 0;
    color: var(--assistantapps-team-member-text-colour, #f0f0f0);
  }

  .team-member a {
    margin: 0;
    padding: 0;
    color: var(--assistantapps-team-member-link-text-colour, #0000ee);
  }
</style>
