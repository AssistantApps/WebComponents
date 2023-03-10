<svelte:options tag="assistant-apps-dropdown-option" />

<script lang="ts">
  export let name: string = "";
  export let value: string = "";
  export let iconurl: string | null = null;
</script>

<li class="dd-menu-item" {value}>
  {#if iconurl != null}
    <img src={iconurl} alt={value} />
  {/if}
  <p>{name}</p>
</li>

<style src="./scss/dropdownOption.scss"></style>
