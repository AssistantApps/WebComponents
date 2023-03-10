<svelte:options tag="assistant-apps-dropdown" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { DropdownOption } from "../contracts/dropdown";

  export let options: Array<DropdownOption> = [];
  export let selectedvalue: String | undefined = null;

  let selectedOption: DropdownOption | null = null;

  onMount(() => {
    if (selectedvalue != null && selectedvalue.length > 0) {
      selectedOption = options.find((opt) => opt.value == selectedvalue);
    }
  });
</script>

<label
  class="dropdown noselect"
  data-selectedoption={selectedOption?.name ?? "-"}
>
  {#if selectedOption != null}
    <div class="dd-button">
      {#if selectedOption.iconUrl != null}
        <img src={selectedOption.iconUrl} alt={selectedOption.value} />
      {/if}
      <p>{selectedOption.name}</p>
    </div>
  {:else}
    <div class="dd-button">
      <p>Please Select an option</p>
    </div>
  {/if}
  <input type="checkbox" class="dd-input" />
  <ul class="dd-menu">
    <slot name="options">
      <span>No options</span>
    </slot>
  </ul>
</label>

<style src="./scss/dropdown.scss"></style>
