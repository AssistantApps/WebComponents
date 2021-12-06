<svelte:options tag={null} />

<script lang="ts">
    import type { PatreonViewModel } from "../../contracts/generated/AssistantApps/ViewModel/patreonViewModel";
    export let patron: PatreonViewModel;
</script>

<div class="patron">
    <img src={patron.thumbnailUrl} alt={patron.name} class="patron-img" />
    <p class="patron-name">{patron.name}</p>
</div>
