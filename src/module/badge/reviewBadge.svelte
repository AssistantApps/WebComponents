<svelte:options tag="assistant-apps-review-badge" />

<script lang="ts">
  export let apptype: string = "";
  export let platform: string = "";
</script>

<object
  title="review-badge"
  data={`https://api.assistantapps.com/badge/review/${apptype}/${platform}.svg`}
  type="image/jpeg"
>
  <img src="./assets/img/fallback.png" alt="review-badge" />
</object>

<style></style>
