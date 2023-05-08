
import type { AppViewModel } from "@assistantapps/assistantapps.api.client";

import { NetworkState } from "../../contracts/NetworkState";
import { useApiCall } from "../../helper/apiCallHelper";
import { getAssistantAppsService } from "../../services/dependencyInjection";

export const init = async (): Promise<[NetworkState, Array<AppViewModel>]> => {
  const aaApi = getAssistantAppsService();
  const [localNetworkState, localItemList] = await useApiCall(
    aaApi.app.readAll
  );

  if (localNetworkState == NetworkState.Error) {
    return [localNetworkState, []];
  }

  const localApps = localItemList.filter((app) => app.isVisible);
  localApps.sort(
    (a: AppViewModel, b: AppViewModel) => a.sortOrder - b.sortOrder
  );

  return [localNetworkState, localApps];
}
