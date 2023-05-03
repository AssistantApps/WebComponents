
import type { DonationViewModel } from "@assistantapps/assistantapps.api.client";

import { NetworkState } from "../../contracts/NetworkState";
import { useApiCall } from "../../helper/apiCallHelper";
import { getAssistantAppsService } from "../../services/dependencyInjection";

export const init = async (): Promise<[NetworkState, Array<DonationViewModel>]> => {
  const aaApi = getAssistantAppsService();
  const [localNetworkState, localItemList] = await useApiCall(
    aaApi.donation.readAll
  );

  if (localNetworkState == NetworkState.Error) {
    return [localNetworkState, []];
  }

  return [localNetworkState, localItemList];
}
