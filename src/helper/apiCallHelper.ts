import { NetworkState } from "../contracts/NetworkState";
import type { ResultWithValue } from "../contracts/results/ResultWithValue";

export const useApiCall = async <T>(
    apiCall: () => Promise<ResultWithValue<Array<T>>>
): Promise<[NetworkState, Array<T>]> => {
    const appListResult = await apiCall();
    if (appListResult.isSuccess == false || appListResult.value == null) {
        return [
            NetworkState.Error,
            [],
        ];
    }

    return [
        NetworkState.Success,
        appListResult.value,
    ];
}