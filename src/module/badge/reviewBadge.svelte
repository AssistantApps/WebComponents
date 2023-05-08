<svelte:options tag="assistant-apps-review-badge" />

<script lang="ts">
  import {
    getAssistantAppsImgRoot,
    getAssistantAppsUrl,
  } from "../../services/dependencyInjection";

  export let apptype: string = "";
  export let platform: string = "";
  export let fallbackimg: string = "";
</script>

<object
  title="review-badge"
  data={`${getAssistantAppsUrl()}/badge/review/${apptype}/${platform}.svg`}
  type="image/jpeg"
>
  <img
    src={fallbackimg ?? `${getAssistantAppsImgRoot()}/assets/img/fallback.png`}
    alt="review-badge"
  />
</object>

<style></style>
