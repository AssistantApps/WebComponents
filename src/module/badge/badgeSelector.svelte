<svelte:options tag="assistant-apps-badge-selector" />

<script lang="ts">
    import { onMount } from "svelte";
    import { NetworkState } from "../../contracts/NetworkState";
    import type { DropdownOption } from "../../contracts/dropdown";
    import { init } from "./badge.controller";

    let appLookup: Array<DropdownOption> = [];
    let selectedAppGuid: String = "";
    let selectedAppType: String = "";
    let platLookup: Array<DropdownOption> = [];
    let selectedPlatType: String = "";
    let networkState: NetworkState = NetworkState.Loading;

    onMount(async () => {
        const initState = await init();

        networkState = initState.networkState;
        appLookup = initState.appLookup;
        selectedAppGuid = initState.selectedAppGuid;
        selectedAppType = initState.selectedAppType;
        platLookup = initState.platLookup;
        selectedPlatType = initState.selectedPlatType;
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
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
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
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
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
        <slot name="loading" slot="loading" />
        <slot name="error" slot="error" />
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
