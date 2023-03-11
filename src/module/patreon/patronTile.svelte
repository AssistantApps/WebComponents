<svelte:options tag="assistant-apps-patron-tile" />

<script lang="ts">
  export let url: string;
  export let name: string = "";
  export let imageurl: string = "";
</script>

{#if url != null}
  <a href={url} target="_blank" rel="noopener noreferrer" class="patron">
    <img src={imageurl} alt={name} class="patron-img" />
    <h2 class="patron-name">{name}</h2>
  </a>
{:else}
  <div class="patron">
    <img src={imageurl} alt={name} class="patron-img" />
    <h2 class="patron-name">{name}</h2>
  </div>
{/if}

<style src="./patreonTile.scss"></style>
