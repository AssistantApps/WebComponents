
import type { AppViewModel, AssistantAppsApiService } from "@assistantapps/assistantapps.api.client";

import { NetworkState } from "../contracts/NetworkState";
import type { DropdownOption } from "../contracts/dropdown";
import { useApiCall } from "../helper/apiCallHelper";

export const fetchApps = async (
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