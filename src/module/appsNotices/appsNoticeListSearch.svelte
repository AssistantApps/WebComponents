<svelte:options tag="assistant-apps-app-notice-list-search" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { AppViewModel } from "../../contracts/generated/AssistantApps/ViewModel/appViewModel";
  import type { LanguageViewModel } from "../../contracts/generated/AssistantApps/ViewModel/languageViewModel";
  import { NetworkState } from "../../contracts/NetworkState";
  import { useApiCall } from "../../helper/apiCallHelper";
  import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";
  import type { DropdownOption } from "../../contracts/dropdown";

  const aaApi = new AssistantAppsApiService();
  let appLookup: Array<DropdownOption> = [];
  let selectedAppGuid: String = "";
  let langLookup: Array<DropdownOption> = [];
  let selectedLangCode: String = "";
  let networkState: NetworkState = NetworkState.Loading;

  const fetchApps = async (): Promise<NetworkState> => {
    const [localNetworkState, localItemList] = await useApiCall(aaApi.getApps);
    if (localNetworkState == NetworkState.Error) {
      return localNetworkState;
    }

    const localItems = localItemList.filter((app) => app.isVisible);
    localItems.sort(
      (a: AppViewModel, b: AppViewModel) => a.sortOrder - b.sortOrder
    );

    appLookup = localItems.map((a) => ({
      name: a.name,
      value: a.guid,
      iconUrl: a.iconUrl,
    }));
    selectedAppGuid = localItems[0].guid;
    return NetworkState.Success;
  };

  const fetchLanguages = async (): Promise<NetworkState> => {
    const [localNetworkState, localItemList] = await useApiCall(
      aaApi.getLanguages
    );
    if (localNetworkState == NetworkState.Error) {
      return localNetworkState;
    }

    const localItems = localItemList.filter((app) => app.isVisible);
    localItems.sort(
      (a: LanguageViewModel, b: LanguageViewModel) => a.sortOrder - b.sortOrder
    );

    const enLangHack: any = {
      guid: "hack",
      name: "English",
      languageCode: "en",
      countryCode: "gb",
      sortOrder: 0,
      isVisible: true,
    };
    langLookup = [enLangHack, ...localItems].map((a) => ({
      name: a.name,
      value: a.languageCode,
      iconUrl: `/assets/img/countryCode/${a.countryCode}.svg`,
    }));
    selectedLangCode = enLangHack.languageCode;
    return NetworkState.Success;
  };

  onMount(async () => {
    const fetchAppsState = await fetchApps();
    const fetchLanguagesState = await fetchLanguages();

    if (
      fetchAppsState != NetworkState.Error &&
      fetchLanguagesState != NetworkState.Error
    ) {
      networkState = NetworkState.Success;
    } else {
      networkState = NetworkState.Error;
    }
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
    {#if $$slots.loading != null}<slot name="loading" slot="loading" />{/if}
    {#if $$slots.error != null}<slot name="error" slot="error" />{/if}
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
