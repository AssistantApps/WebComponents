
import type { AppViewModel, AssistantAppsApiService, LanguageViewModel } from "@assistantapps/assistantapps.api.client";

import { NetworkState } from "../../contracts/NetworkState";
import type { DropdownOption } from "../../contracts/dropdown";
import { useApiCall } from "../../helper/apiCallHelper";
import { getAssistantAppsImgRoot, getAssistantAppsService } from "../../services/dependencyInjection";

export const init = async (): Promise<{
  networkState: NetworkState,
  appLookup: Array<DropdownOption>,
  selectedAppGuid: string,
  langLookup: Array<DropdownOption>,
  selectedLangCode: string,
}> => {
  const aaApi = getAssistantAppsService();
  const fetchAppsState = await fetchApps(aaApi);
  const fetchLanguagesState = await fetchLanguages(aaApi);

  if (
    fetchAppsState[0] == NetworkState.Error ||
    fetchLanguagesState[0] == NetworkState.Error
  ) {
    return {
      networkState: NetworkState.Error,
      appLookup: [],
      selectedAppGuid: '',
      langLookup: [],
      selectedLangCode: '',
    };
  }

  return {
    networkState: NetworkState.Success,
    appLookup: fetchAppsState[1],
    selectedAppGuid: fetchAppsState[2],
    langLookup: fetchLanguagesState[1],
    selectedLangCode: fetchLanguagesState[2],
  };
}

const fetchApps = async (
  aaApi: AssistantAppsApiService
): Promise<[NetworkState, Array<DropdownOption>, string]> => {
  const [localNetworkState, localItemList] = await useApiCall(
    aaApi.app.readAll
  );
  if (localNetworkState == NetworkState.Error) {
    return [localNetworkState, [], ''];
  }

  const localItems = localItemList.filter((app) => app.isVisible);
  localItems.sort(
    (a: AppViewModel, b: AppViewModel) => a.sortOrder - b.sortOrder
  );

  const appLookup = localItems.map((a) => ({
    name: a.name,
    value: a.guid,
    iconUrl: a.iconUrl,
  }));
  const selectedAppGuid = localItems[0].guid;
  return [NetworkState.Success, appLookup, selectedAppGuid];
};

const fetchLanguages = async (
  aaApi: AssistantAppsApiService
): Promise<[NetworkState, Array<DropdownOption>, string]> => {
  const [localNetworkState, localItemList] = await useApiCall(
    aaApi.language.readAll
  );
  if (localNetworkState == NetworkState.Error) {
    return [localNetworkState, [], ''];
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
  const langLookup = [enLangHack, ...localItems].map((a) => ({
    name: a.name,
    value: a.languageCode,
    iconUrl: `${getAssistantAppsImgRoot()}/assets/img/countryCode/${a.countryCode.toLocaleUpperCase()}.svg`,
  }));
  const selectedLangCode = enLangHack.languageCode;
  return [NetworkState.Success, langLookup, selectedLangCode];
};
