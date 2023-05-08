
import type { AppViewModel, AssistantAppsApiService } from "@assistantapps/assistantapps.api.client";

import { NetworkState } from "../../contracts/NetworkState";
import type { DropdownOption } from "../../contracts/dropdown";
import { useApiCall } from "../../helper/apiCallHelper";
import { getAssistantAppsImgRoot, getAssistantAppsService } from "../../services/dependencyInjection";

export const init = async (): Promise<{
  networkState: NetworkState,
  appLookup: Array<DropdownOption>,
  selectedAppGuid: string,
  selectedAppType: string,
  platLookup: Array<DropdownOption>,
  selectedPlatType: string,
}> => {
  const aaApi = getAssistantAppsService();
  const fetchAppsState = await fetchApps(aaApi);
  const setPlatformsState = await setPlatforms();

  if (fetchAppsState[0] == NetworkState.Error) {
    return {
      networkState: NetworkState.Error,
      appLookup: [],
      selectedAppGuid: '',
      selectedAppType: '',
      platLookup: [],
      selectedPlatType: '',
    };
  }

  return {
    networkState: NetworkState.Success,
    appLookup: fetchAppsState[1],
    selectedAppGuid: fetchAppsState[2],
    selectedAppType: fetchAppsState[3],
    platLookup: setPlatformsState[0],
    selectedPlatType: setPlatformsState[1],
  };
}

const fetchApps = async (
  aaApi: AssistantAppsApiService
): Promise<[NetworkState, Array<DropdownOption>, string, string]> => {
  const [localNetworkState, localItemList] = await useApiCall(
    aaApi.app.readAll
  );
  if (localNetworkState == NetworkState.Error) {
    return [localNetworkState, [], '', ''];
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
  const selectedAppType = "1";
  return [NetworkState.Success, appLookup, selectedAppGuid, selectedAppType];
};

const setPlatforms = async (): Promise<[Array<DropdownOption>, string]> => {
  const imgRoot = getAssistantAppsImgRoot();
  const localPlatLookup = [
    {
      name: "Google Play",
      value: "1",
      iconUrl: `${imgRoot}/assets/img/platform/android.png`,
    },
    {
      name: "Apple App Store",
      value: "2",
      iconUrl: `${imgRoot}/assets/img/platform/iOS.png`,
    },
  ];
  const platLookup = [...localPlatLookup];
  const selectedPlatType = platLookup[0].value;
  return [platLookup, selectedPlatType];
};
