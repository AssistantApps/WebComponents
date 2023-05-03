<svelte:options tag="assistant-apps-version-badge" />

<script lang="ts">
  import {
    getAssistantAppsImgRoot,
    getAssistantAppsUrl,
  } from "../../services/dependencyInjection";

  export let appguid: string = "";
  export let fallbackimg: string = "";
</script>

<object
  title="review-badge"
  data={`${getAssistantAppsUrl()}/badge/version/${appguid}.svg`}
  type="image/jpeg"
>
  <img
    src={fallbackimg ?? `${getAssistantAppsImgRoot()}/assets/img/fallback.png`}
    alt="version-badge"
  />
</object>

<style></style>
