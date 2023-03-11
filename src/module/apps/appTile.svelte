<!-- svelte-ignore missing-custom-element-compile-options -->
<svelte:options tag="assistant-apps-app-tile" />

<script lang="ts">
  // export let guid: string = "";
  export let name: string = "";
  export let gamename: string = "";
  // export let iconUrl: string = "";
  export let logourl: string = "";
  // export let isVisible: boolean;
  // export let sortOrder: number;
</script>

<div class="aa-app">
  <img src={logourl} alt={name} class="app-img noselect" />
  <div class="content">
    <h2 class="app-name">
      <span>{name.replaceAll(gamename, "").trim()}</span><br /><span
        class="highlight">{gamename}</span
      >
    </h2>
  </div>
</div>

<style src="./appTile.scss"></style>
