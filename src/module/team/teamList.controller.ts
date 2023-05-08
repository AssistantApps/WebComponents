
import type { TeamMemberViewModel } from "@assistantapps/assistantapps.api.client";

import { NetworkState } from "../../contracts/NetworkState";
import { useApiCall } from "../../helper/apiCallHelper";
import { getAssistantAppsService } from "../../services/dependencyInjection";

export const init = async (): Promise<[NetworkState, Array<TeamMemberViewModel>]> => {
  const aaApi = getAssistantAppsService();
  const [localNetworkState, localItemList] = await useApiCall(
    aaApi.teamMember.readAll
  );

  if (localNetworkState == NetworkState.Error) {
    return [localNetworkState, []];
  }

  return [localNetworkState, localItemList];
}
