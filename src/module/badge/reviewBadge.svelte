<svelte:options tag="assistant-apps-review-badge" />

<script lang="ts">
  import { getImgRoot } from "../../helper/windowHelper";

  export let apptype: string = "";
  export let platform: string = "";
</script>

<object
  title="review-badge"
  data={`https://api.assistantapps.com/badge/review/${apptype}/${platform}.svg`}
  type="image/jpeg"
>
  <img src={`${getImgRoot()}./assets/img/fallback.png`} alt="review-badge" />
</object>

<style></style>
