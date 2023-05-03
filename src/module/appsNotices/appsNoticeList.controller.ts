
import type { AppNoticeViewModel } from "@assistantapps/assistantapps.api.client";

import { NetworkState } from "../../contracts/NetworkState";
import { useApiCall } from "../../helper/apiCallHelper";
import { getAssistantAppsService } from "../../services/dependencyInjection";

export const init = async (
  appguid: string,
  langcode: string,
): Promise<[NetworkState, Array<AppNoticeViewModel>]> => {
  const aaApi = getAssistantAppsService();
  const [localNetworkState, localItemList] = await useApiCall(
    () => aaApi.appNotice.readAll(appguid, langcode)
  );

  if (localNetworkState == NetworkState.Error) {
    return [localNetworkState, []];
  }

  const localItems = localItemList.filter((app) => app.isVisible);
  localItems.sort(
    (a: AppNoticeViewModel, b: AppNoticeViewModel) =>
      a.sortOrder - b.sortOrder
  );

  return [localNetworkState, localItems];
}
