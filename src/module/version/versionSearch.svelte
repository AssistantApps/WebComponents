<svelte:options tag="assistant-apps-version-search" />

<script lang="ts">
    import { onMount } from "svelte";
    import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";
    import { NetworkState } from "../../contracts/NetworkState";
    import type { VersionSearchViewModel } from "../../contracts/generated/AssistantApps/ViewModel/Version/versionSearchViewModel";
    // import type { PlatformType } from "../../contracts/generated/AssistantApps/Enum/platformType";
    import type { VersionViewModel } from "../../contracts/generated/AssistantApps/ViewModel/Version/versionViewModel";
    import type { AppViewModel } from "../../contracts/generated/AssistantApps/ViewModel/appViewModel";
    import type { ResultWithValueAndPagination } from "../../contracts/results/ResultWithValue";
    import { anyObject } from "../../helper/typescriptHacks";

    const aaApi = new AssistantAppsApiService();
    let appLookup: Array<AppViewModel> = [];
    let selectedApp: AppViewModel;
    let networkState: NetworkState = NetworkState.Loading;
    let whatIsNewPagination: ResultWithValueAndPagination<
        Array<VersionViewModel>
    > = anyObject;

    const fetchApps = async () => {
        const appsResult = await aaApi.getApps();
        if (appsResult.isSuccess === false) {
            networkState = NetworkState.Error;
            return;
        }
        appLookup = appsResult.value;
        selectedApp = appsResult.value[0];
        networkState = NetworkState.Success;
    };

    const fetchWhatIsNewItems = async (appSelected: AppViewModel) => {
        selectedApp = appSelected;
        networkState = NetworkState.Loading;
        const search: VersionSearchViewModel = {
            appGuid: appSelected.guid,
            languageCode: null,
            platforms: [],
            page: 1,
        };
        const whatIsNewResult = await aaApi.getWhatIsNewItems(search);
        if (whatIsNewResult.isSuccess === false) {
            networkState = NetworkState.Error;
            return;
        }
        console.log(whatIsNewResult);
        whatIsNewPagination = whatIsNewResult;
        networkState = NetworkState.Success;
    };

    onMount(async () => {
        await fetchApps();
        fetchWhatIsNewItems(selectedApp);
    });
</script>

<div class="version-container noselect">
    {#if networkState === NetworkState.Loading}
        <span>Loading...</span>
    {:else if networkState === NetworkState.Error}
        <span>Something went wrong...</span>
    {:else}
        <label class="dropdown">
            {#if selectedApp != null}
                <div class="dd-button">
                    <img src={selectedApp.iconUrl} alt={selectedApp.name} />
                    <p>{selectedApp.name}</p>
                </div>
            {:else}
                <div class="dd-button">
                    <p>Please Select an App</p>
                </div>
            {/if}
            <input type="checkbox" class="dd-input" />
            <ul class="dd-menu">
                {#each appLookup as app}
                    <li
                        class="dd-menu-item"
                        value={app.guid}
                        on:click={() => fetchWhatIsNewItems(app)}
                    >
                        <img src={app.iconUrl} alt={app.name} />
                        <p>{app.name}</p>
                    </li>
                {/each}
            </ul>
        </label>

        <div class="what-is-new-container noselect">
            {#each whatIsNewPagination.value ?? [] as whatIsNewItem}
                <assistant-apps-version-search-tile
                    guid={whatIsNewItem.guid}
                    markdown={whatIsNewItem.markdown}
                    buildname={whatIsNewItem.buildName}
                    buildnumber={whatIsNewItem.buildNumber}
                    platforms={whatIsNewItem.platforms}
                    activedate={whatIsNewItem.activeDate}
                />
            {/each}
            {#if whatIsNewPagination.value == null || whatIsNewPagination.value.length < 1}
                <p>No items to display</p>
            {/if}
        </div>
    {/if}
</div>

<style>
    * {
        font-family: var(
            --assistantapps-font-family,
            "Roboto",
            Helvetica,
            Arial,
            sans-serif
        );
    }

    .noselect {
        -webkit-touch-callout: none;
        /* iOS Safari */
        -webkit-user-select: none;
        /* Safari */
        -khtml-user-select: none;
        /* Konqueror HTML */
        -moz-user-select: none;
        /* Old versions of Firefox */
        -ms-user-select: none;
        /* Internet Explorer/Edge */
        user-select: none;
        /* Non-prefixed version, currently
                                    supported by Chrome, Edge, Opera and Firefox */
    }

    /* Dropdown */

    .dropdown {
        display: inline-block;
        position: relative;
        margin-bottom: 1em;
        z-index: 20;
    }

    .dd-button {
        display: flex;
        border: 1px solid gray;
        border-radius: 4px;
        padding: 10px 30px 10px 10px;
        background-color: var(
            --assistantapps-version-dropdown-background-colour,
            #ffffff
        );
        cursor: pointer;
        white-space: nowrap;
    }

    .dd-button:after {
        content: "";
        position: absolute;
        top: 50%;
        right: 15px;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid black;
    }

    .dd-button:hover {
        background-color: var(
            --assistantapps-version-dropdown-background-hover-colour,
            #eeeeee
        );
    }

    .dd-button img {
        width: 20px;
        height: 20px;
        margin-right: 0.5em;
    }

    .dd-button p {
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin: 0;
        padding: 0;
    }

    .dd-input {
        display: none;
    }

    .dd-menu {
        position: absolute;
        top: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 0;
        margin: 2px 0 0 0;
        box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.1);
        background-color: var(
            --assistantapps-version-dropdown-background-colour,
            #ffffff
        );
        list-style-type: none;
    }

    .dd-input + .dd-menu {
        display: none;
    }

    .dd-input:checked + .dd-menu {
        display: block;
    }

    .dd-menu li {
        padding: 10px 20px;
        cursor: pointer;
        white-space: nowrap;
    }

    .dd-menu li:hover {
        background-color: var(
            --assistantapps-version-dropdown-background-hover-colour,
            #f6f6f6
        );
    }

    .dd-menu li.dd-menu-item {
        display: flex;
    }

    .dd-menu li.dd-menu-item img {
        width: 40px;
        height: 40px;
        margin-right: 1em;
    }

    .dd-menu li.dd-menu-item p {
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin: 0;
        padding: 0;
    }

    .what-is-new-container {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        column-gap: 1em;
        row-gap: 1em;
        margin-bottom: 3em;
    }

    @media only screen and (max-width: 1000px) {
        .what-is-new-container {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 0.5em;
            row-gap: 0.5em;
        }
    }

    @media only screen and (max-width: 600px) {
        .what-is-new-container {
            grid-template-columns: repeat(1, minmax(0, 1fr));
            column-gap: 0.5em;
            row-gap: 0.5em;
        }
    }
</style>
