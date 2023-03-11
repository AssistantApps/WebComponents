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

<style src="./teamTile.scss"></style>
