<svelte:options tag="assistant-apps-store-badge-selector" />

<script lang="ts">
    import { supportedStores } from "./store.controller";

    let selectedLanguage: String = "en";
    let selectedStore: String = supportedStores[0];
</script>

<div>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>Store: </label>
    <br />
    <assistant-apps-dropdown
        selectedvalue={selectedStore}
        options={supportedStores}
    >
        <div slot="options">
            {#each supportedStores as opt}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <assistant-apps-dropdown-option
                    name={opt}
                    value={opt}
                    on:click={() => {
                        selectedStore = opt;
                    }}
                />
            {/each}
        </div>
    </assistant-apps-dropdown>
    <br />
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>Language: </label>
    <input
        type="text"
        bind:value={selectedLanguage}
        placeholder="en"
        class="dd-button"
    />

    <assistant-apps-store-tile
        language={selectedLanguage}
        store={selectedStore}
        alt="alt text"
    >
    </assistant-apps-store-tile>
</div>

<style src="./storeSelector.scss"></style>
