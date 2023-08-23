
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

export const getHeadElemWithoutNewElem = (tagName: string): HTMLHeadElement | undefined => {
    const head = document.head || document.getElementsByTagName('head')[0];

    if (head == null) return;

    const exitingScriptTag = [...head.childNodes].find((cn: any) => cn.id === tagName);
    if (exitingScriptTag != null) {
        exitingScriptTag.remove();
    }

    return head;
}

export const updateCustomStyleTag = (tagName: string, cssContent: string) => {
    const head = getHeadElemWithoutNewElem(tagName);
    if (head == null) return;

    const styleElem: any = document.createElement('style');

    styleElem.type = 'text/css';
    styleElem.id = tagName;
    if (styleElem.styleSheet) {
        // This is required for IE8 and below.
        styleElem.styleSheet.cssText = cssContent;
    } else {
        styleElem.appendChild(document.createTextNode(cssContent));
    }

    head.appendChild(styleElem);
}

export const addCustomScriptTag = (tagName: string, scriptUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const head = getHeadElemWithoutNewElem(tagName);
        if (head == null) return;

        const scriptElem: any = document.createElement('script');
        scriptElem.src = scriptUrl;
        scriptElem.async = true;
        scriptElem.id = tagName;
        scriptElem.onload = () => {
            resolve();
        };

        scriptElem.onerror = () => {
            console.log('Error occurred while loading script');
            reject();
        };

        head.appendChild(scriptElem);
    })
}

export const addCustomScriptImportMapTag = (tagName: string, content: any) => {
    const head = getHeadElemWithoutNewElem(tagName);
    if (head == null) return;

    const scriptElem: any = document.createElement('script');
    scriptElem.text = JSON.stringify(content);
    scriptElem.type = 'importmap';
    scriptElem.id = tagName;

    head.appendChild(scriptElem);
}