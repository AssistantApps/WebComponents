import { setContext, getContext } from 'svelte';
import { AssistantAppsApiService } from "@assistantapps/assistantapps.api.client";

declare global {
    interface Window { config: any }
}

// const assistantAppsKey = 'assistantApps';

// export interface IDependencyInjectionState {
//     assistantAppsImgRoot: string;
//     assistantAppsApi: () => AssistantAppsApiService;
// }

// export const setupAssistantAppsDependencyInjection = () => {
//     const aaApi = new AssistantAppsApiService();
//     const state: IDependencyInjectionState = {
//         assistantAppsImgRoot: window?.config?.assistantAppsImgRoot ?? "",
//         assistantAppsApi: () => aaApi,
//     }
//     setContext(assistantAppsKey, state);
// }

// export const getAssistantAppsService = (): AssistantAppsApiService => {
//     let stateService: IDependencyInjectionState = getContext(assistantAppsKey);
//     return stateService.assistantAppsApi();
// }

// export const getAssistantAppsImgRoot = (): string => {
//     let stateService: IDependencyInjectionState = getContext(assistantAppsKey);
//     return stateService.assistantAppsImgRoot;
// }

// Unable to use setContext outside of a component...

export const setupAssistantAppsDependencyInjection = () => { }

export const getAssistantAppsUrl = (): string | undefined => {
    return window.config?.assistantAppsApiUrl;
}

export const getAssistantAppsService = (): AssistantAppsApiService => {
    return new AssistantAppsApiService({
        url: getAssistantAppsUrl(),
    });
}

export const getAssistantAppsImgRoot = (): string => {
    return window?.config?.assistantAppsImgRoot ?? '';
}