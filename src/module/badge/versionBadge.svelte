<svelte:options tag="assistant-apps-version-badge" />

<script lang="ts">
  export let appguid: string = "";
</script>

<object
  title="review-badge"
  data={`https://api.assistantapps.com/badge/version/${appguid}.svg`}
  type="image/jpeg"
>
  <img src="./assets/img/fallback.png" alt="version-badge" />
</object>

<style></style>
