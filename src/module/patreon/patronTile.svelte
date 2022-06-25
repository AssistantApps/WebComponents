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

  .patron {
    display: flex;
    background-color: var(--assistantapps-patron-background-colour, #6c757d);
    border-radius: 5px;
    text-decoration: none;
    overflow: hidden;
  }

  .patron img.patron-img {
    height: 100px;
    width: 100px;
    object-fit: cover;
    margin: 0;
  }

  .patron .patron-name {
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: var(--assistantapps-patron-text-colour, white);
    padding-left: 0.5em;
    padding-right: 0.5em;
    line-height: 1.2em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
