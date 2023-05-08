
import type { TranslatorLeaderboardItemViewModel } from "@assistantapps/assistantapps.api.client";

import { NetworkState } from "../../contracts/NetworkState";
import { useApiCall } from "../../helper/apiCallHelper";
import { getAssistantAppsService } from "../../services/dependencyInjection";

export const init = async (): Promise<[NetworkState, Array<TranslatorLeaderboardItemViewModel>]> => {
  const aaApi = getAssistantAppsService();
  const [localNetworkState, localItemList] = await useApiCall(
    () => aaApi.translationStat.readAll({ apps: [], languages: [] })
  );

  if (
    localNetworkState == NetworkState.Error ||
    localItemList == null ||
    localItemList.length < 1
  ) {
    return [localNetworkState, []];
  }

  return [localNetworkState, localItemList];
}
