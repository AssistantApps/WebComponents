<svelte:options tag="assistant-apps-app-notice-list-search" />

<script lang="ts">
  import { onMount } from "svelte";

  import { init } from "./appsNoticeListSearch.controller";
  import type { DropdownOption } from "../../contracts/dropdown";
  import { NetworkState } from "../../contracts/NetworkState";

  let appLookup: Array<DropdownOption> = [];
  let selectedAppGuid: String = "";
  let langLookup: Array<DropdownOption> = [];
  let selectedLangCode: String = "";
  let networkState: NetworkState = NetworkState.Loading;

  onMount(async () => {
    const initState = await init();

    networkState = initState.networkState;
    appLookup = initState.appLookup;
    selectedAppGuid = initState.selectedAppGuid;
    langLookup = initState.langLookup;
    selectedLangCode = initState.selectedLangCode;
  });
</script>

<div>
  {#if appLookup.length > 0}
    {#key selectedAppGuid}
      <assistant-apps-dropdown
        selectedvalue={selectedAppGuid}
        options={appLookup}
      >
        <div slot="options">
          {#each appLookup as opt}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <assistant-apps-dropdown-option
              name={opt.name}
              value={opt.value}
              iconUrl={opt.iconUrl}
              on:click={() => {
                selectedAppGuid = opt.value;
              }}
            />
          {/each}
        </div>
      </assistant-apps-dropdown>
    {/key}
  {/if}
  {#if langLookup.length > 0}
    {#key selectedLangCode}
      <assistant-apps-dropdown
        selectedvalue={selectedLangCode}
        options={langLookup}
      >
        <div slot="options">
          {#each langLookup as opt}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <assistant-apps-dropdown-option
              name={opt.name}
              value={opt.value}
              iconUrl={opt.iconUrl}
              on:click={() => {
                selectedLangCode = opt.value;
              }}
            />
          {/each}
        </div>
      </assistant-apps-dropdown>
    {/key}
  {/if}

  <assistant-apps-loading networkstate={networkState}>
    <slot name="loading" slot="loading" />
    <slot name="error" slot="error" />
    <div slot="loaded">
      {#key selectedAppGuid}
        {#key selectedLangCode}
          {#if selectedAppGuid.length > 0 && selectedLangCode.length > 0}
            <assistant-apps-app-notice-list
              appguid={selectedAppGuid}
              langcode={selectedLangCode}
            />
          {/if}
        {/key}
      {/key}
    </div>
  </assistant-apps-loading>
</div>

<style></style>
