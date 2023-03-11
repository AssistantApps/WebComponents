<svelte:options tag="assistant-apps-badge-selector" />

<script lang="ts">
    import { onMount } from "svelte";
    import type { DropdownOption } from "../../contracts/dropdown";
    import type { AppViewModel } from "../../contracts/generated/AssistantApps/ViewModel/appViewModel";
    import { NetworkState } from "../../contracts/NetworkState";
    import { useApiCall } from "../../helper/apiCallHelper";
    import { getImgRoot } from "../../helper/windowHelper";
    import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";

    const aaApi = new AssistantAppsApiService();
    let appLookup: Array<DropdownOption> = [];
    let selectedAppGuid: String = "";
    let selectedAppType: String = "";
    let platLookup: Array<DropdownOption> = [];
    let selectedPlatType: String = "";
    let networkState: NetworkState = NetworkState.Loading;

    const fetchApps = async (): Promise<NetworkState> => {
        const [localNetworkState, localItemList] = await useApiCall(
            aaApi.getApps
        );
        if (localNetworkState == NetworkState.Error) {
            return localNetworkState;
        }

        const localItems = localItemList.filter((app) => app.isVisible);
        localItems.sort(
            (a: AppViewModel, b: AppViewModel) => a.sortOrder - b.sortOrder
        );

        appLookup = localItems.map((a) => ({
            name: a.name,
            value: a.guid,
            iconUrl: a.iconUrl,
        }));
        selectedAppGuid = localItems[0].guid;
        selectedAppType = "1";
        return NetworkState.Success;
    };

    const setPlatforms = async (): Promise<NetworkState> => {
        const localPlatLookup = [
            {
                name: "Google Play",
                value: "1",
                iconUrl: `${getImgRoot()}/assets/img/platform/android.png`,
            },
            {
                name: "Apple App Store",
                value: "2",
                iconUrl: `${getImgRoot()}/assets/img/platform/iOS.png`,
            },
        ];
        platLookup = [...localPlatLookup];
        selectedPlatType = platLookup[0].value;
        return NetworkState.Success;
    };

    onMount(async () => {
        const fetchAppsState = await fetchApps();
        const setPlatformsState = await setPlatforms();

        if (
            fetchAppsState != NetworkState.Error &&
            setPlatformsState != NetworkState.Error
        ) {
            networkState = NetworkState.Success;
        } else {
            networkState = NetworkState.Error;
        }
    });
</script>

<div>
    {#if appLookup.length > 0}
        {#key selectedAppGuid}
            <assistant-apps-dropdown
                selectedvalue={selectedAppGuid}
                options={appLookup}
            >
                <div slot="options">
                    {#each appLookup as opt}
                        <assistant-apps-dropdown-option
                            name={opt.name}
                            value={opt.value}
                            iconUrl={opt.iconUrl}
                            on:click={() => {
                                selectedAppType = opt.value;
                                selectedAppGuid = opt.value;
                            }}
                        />
                    {/each}
                </div>
            </assistant-apps-dropdown>
        {/key}
    {/if}
    {#if platLookup.length > 0}
        {#key selectedPlatType}
            <assistant-apps-dropdown
                selectedvalue={selectedPlatType}
                options={platLookup}
            >
                <div slot="options">
                    {#each platLookup as opt}
                        <assistant-apps-dropdown-option
                            name={opt.name}
                            value={opt.value}
                            iconUrl={opt.iconUrl}
                            on:click={() => {
                                selectedPlatType = opt.value;
                            }}
                        />
                    {/each}
                </div>
            </assistant-apps-dropdown>
        {/key}
    {/if}

    <assistant-apps-loading networkstate={networkState}>
        {#if $$slots.loading != null}<slot name="loading" slot="loading" />{/if}
        {#if $$slots.error != null}<slot name="error" slot="error" />{/if}
        <div slot="loaded">
            {#key selectedAppType}
                {#key selectedPlatType}
                    <assistant-apps-review-badge
                        apptype={selectedAppType}
                        platform={selectedPlatType}
                    />
                {/key}
            {/key}
            <br />
            {#key selectedAppGuid}
                <assistant-apps-version-badge appguid={selectedAppGuid} />
            {/key}
        </div>
    </assistant-apps-loading>
</div>

<style></style>
