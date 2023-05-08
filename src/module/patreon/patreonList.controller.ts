
import type { PatreonViewModel } from "@assistantapps/assistantapps.api.client";

import { NetworkState } from "../../contracts/NetworkState";
import { useApiCall } from "../../helper/apiCallHelper";
import { getAssistantAppsService } from "../../services/dependencyInjection";

export const init = async (): Promise<[NetworkState, Array<PatreonViewModel>]> => {
  const aaApi = getAssistantAppsService();
  const [localNetworkState, localItemList] = await useApiCall(
    aaApi.patreon.readAll
  );

  if (localNetworkState == NetworkState.Error) {
    return [localNetworkState, []];
  }

  const items = [
    ...localItemList.map((p) => ({ ...p, url: undefined } as any)),
    {
      name: "Join Patreon",
      imageUrl: "https://cdn.assistantapps.com/patreon.png",
      thumbnailUrl: "https://cdn.assistantapps.com/patreon.png",
      url: "https://patreon.com/AssistantApps",
    },
  ];

  return [localNetworkState, items];
}
