import { NetworkState } from "../contracts/NetworkState";
import type { ResultWithValue } from "../contracts/results/ResultWithValue";
import { anyObject } from "./typescriptHacks";

export const useApiCall = async <T>(
    apiCall: () => Promise<ResultWithValue<T>>
): Promise<[NetworkState, T]> => {
    const appListResult = await apiCall();
    if (appListResult.isSuccess == false || appListResult.value == null) {
        return [
            NetworkState.Error,
            anyObject,
        ];
    }

    return [
        NetworkState.Success,
        appListResult.value,
    ];
}