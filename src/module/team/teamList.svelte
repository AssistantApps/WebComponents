<svelte:options tag="assistant-apps-team-list" />

<script lang="ts">
  import type { TeamMemberViewModel } from "@assistantapps/assistantapps.api.client";
  import { onMount } from "svelte";

  import { NetworkState } from "../../contracts/NetworkState";
  import { init } from "./teamList.controller";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<TeamMemberViewModel> = [];

  onMount(async () => {
    const [localNetworkState, localItemList] = await init();

    items = [...localItemList];
    networkState = localNetworkState;
  });
</script>

<assistant-apps-loading networkstate={networkState}>
  <slot name="loading" slot="loading" />
  <slot name="error" slot="error" />
  <div slot="loaded" class="team-members-container noselect">
    {#each items as teamMember}
      <assistant-apps-team-tile
        name={teamMember.name}
        role={teamMember.role}
        imageurl={teamMember.imageUrl}
        linkname={teamMember.linkName}
        linkurl={teamMember.linkUrl}
      />
    {/each}
  </div>
</assistant-apps-loading>

<style src="./teamList.scss"></style>
