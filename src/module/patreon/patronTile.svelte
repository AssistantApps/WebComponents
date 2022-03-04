<svelte:options tag="assistant-apps-patron-tile" />

<script lang="ts">
  export let name: string = "";
  export let imageurl: string = "";
</script>

<div class="patron">
  <img src={imageurl} alt={name} class="patron-img" />
  <h2 class="patron-name">{name}</h2>
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

  .patron {
    display: flex;
    background-color: var(--assistantapps-patron-background-colour, #6c757d);
    border-radius: 5px;
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
