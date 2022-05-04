<svelte:options tag="assistant-apps-loading" />

<script lang="ts">
  import { NetworkState } from "../contracts/NetworkState";

  export let networkstate: NetworkState;
  export let customloading: boolean = false;
  export let customerror: boolean = false;
</script>

<div class="noselect">
  {#if networkstate == NetworkState.Loading}
    {#if customloading}
      <slot name="loading" />
    {:else}
      <div style="text-align: center">
        <span>Loading...</span>
      </div>
    {/if}
  {/if}
  {#if networkstate == NetworkState.Error}
    {#if customerror}
      <slot name="error">error</slot>
    {:else}
      <div style="text-align: center">
        <span>Something went wrong...</span>
      </div>
    {/if}
  {/if}
  <slot name="loaded">
    <div style="text-align: center">
      <span>Nothing supplied in the <b>loaded</b> slot</span>
    </div>
  </slot>
</div>

<style>
</style>
