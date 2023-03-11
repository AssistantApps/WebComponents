<svelte:options tag="assistant-apps-loading" />

<script lang="ts">
  import { NetworkState } from "../contracts/NetworkState";

  export let networkstate: NetworkState;
</script>

<div class="noselect" data-networkstate={networkstate}>
  {#if networkstate == NetworkState.Loading}
    <slot name="loading" />
  {:else if networkstate == NetworkState.Error}
    <slot name="error">
      <div class="aa-error">
        <img
          src="https://cdn.assistantapps.com/icon/NMSCDCreatureBuilder.png"
          alt="monster representing an error"
        />
        <p>Something went wrong</p>
      </div>
    </slot>
  {:else if networkstate == NetworkState.Success}
    <slot name="loaded">
      <div style="text-align: center">
        <span>Nothing supplied in the <b>loaded</b> slot</span>
      </div>
    </slot>
  {/if}
</div>

<style src="./scss/loading.scss"></style>
