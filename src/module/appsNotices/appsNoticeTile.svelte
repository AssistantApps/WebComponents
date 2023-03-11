<svelte:options tag="assistant-apps-app-notice-tile" />

<script lang="ts">
  // export let guid: string = "";
  // export let appGuid: string = "";
  export let name: string = "";
  export let subtitle: string = "";
  export let iconUrl: string = "";
  // export let externalUrl: string = "";
  // export let languageCode: string = "";
  // export let platforms: string = "";
  // export let isVisible: string = "";
  // export let endDate: string = "";
  // export let sortOrder: string = "";
</script>

<div class="aa-app">
  <img src={iconUrl} alt={name} class="app-img noselect" />
  <div class="content">
    <h2 class="app-name">
      <span>{name}</span><br />
      <span>{subtitle}</span>
    </h2>
  </div>
</div>

<style src="./appsNoticeTile.scss"></style>
