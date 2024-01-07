<!-- svelte-ignore missing-custom-element-compile-options -->
<svelte:options tag="assistant-apps-store-tile" />

<script lang="ts">
  import { supportedStores } from "./store.controller";

  export let language: string = "en";
  export let store: string = "google";
  export let alt: string = "app store badge";

  const baseImgUrl = "https://cdn.assistantapps.com/badge";

  if (supportedStores.includes(store) == false) {
    console.warn(`unsupported store provided: ${store}`);
  }

  const handleError = () => {
    console.log("store image not found");
    language = "en";
  };
</script>

<img
  on:error={handleError}
  {alt}
  src={`${baseImgUrl}/${store}/${language}.png`}
  class="aa-store-badge noselect"
/>

<style src="./store.scss"></style>
