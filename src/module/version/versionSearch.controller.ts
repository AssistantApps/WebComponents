
import type { AppViewModel, AssistantAppsApiService, VersionSearchViewModel, VersionViewModel } from "@assistantapps/assistantapps.api.client";

import { NetworkState } from "../../contracts/NetworkState";
import { useApiCall } from "../../helper/apiCallHelper";
import { anyObject } from "../../helper/typescriptHacks";
import { getAssistantAppsService } from "../../services/dependencyInjection";

export const init = async (): Promise<{
  networkState: NetworkState,
  appLookup: Array<AppViewModel>,
  selectedApp: AppViewModel,
  whatIsNewItems: Array<VersionViewModel>,
}> => {
  const aaApi = getAssistantAppsService();
  const fetchAppsState = await fetchApps(aaApi);

  if (fetchAppsState[0] == NetworkState.Error) {
    return {
      networkState: NetworkState.Error,
      appLookup: [],
      selectedApp: anyObject,
      whatIsNewItems: [],
    };
  }

  const fetchLanguagesState = await fetchWhatIsNewItems(aaApi, fetchAppsState[2]);
  if (fetchLanguagesState[0] == NetworkState.Error) {
    return {
      networkState: NetworkState.Error,
      appLookup: [],
      selectedApp: anyObject,
      whatIsNewItems: [],
    };
  }

  return {
    networkState: NetworkState.Success,
    appLookup: fetchAppsState[1],
    selectedApp: fetchAppsState[2],
    whatIsNewItems: fetchLanguagesState[1],
  };
}

const fetchApps = async (
  aaApi: AssistantAppsApiService,
): Promise<[NetworkState, Array<AppViewModel>, AppViewModel]> => {
  const [localNetworkState, localItemList] = await useApiCall(
    aaApi.app.readAll
  );
  if (localNetworkState == NetworkState.Error) {
    return [localNetworkState, [], anyObject];
  }

  const localItems = localItemList.filter((app) => app.isVisible);
  localItems.sort(
    (a: AppViewModel, b: AppViewModel) => a.sortOrder - b.sortOrder
  );

  return [NetworkState.Success, localItemList, localItems[0]];
};

export const fetchWhatIsNewItems = async (
  aaApi: AssistantAppsApiService,
  appSelected: AppViewModel
): Promise<[NetworkState, Array<VersionViewModel>]> => {
  if (appSelected == null) return;

  // selectedApp = appSelected;
  const search: VersionSearchViewModel = {
    appGuid: appSelected.guid,
    languageCode: null,
    platforms: [],
    page: 1,
  };

  const [localNetworkState, localItemList] = await useApiCall(
    () => aaApi.version.createSearch(search) as any // TODO fix once types are updated
  );
  if (localNetworkState == NetworkState.Error) {
    return [localNetworkState, []];
  }

  if (
    localItemList == null ||
    (localItemList as any).length < 1 // TODO fix once types are updated
  ) {
    return [localNetworkState, []];
  }

  return [localNetworkState, (localItemList as any).value]; // TODO fix once types are updated
};
