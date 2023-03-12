<svelte:options tag="assistant-apps-team-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { TeamMemberViewModel } from "../../contracts/generated/AssistantApps/ViewModel/teamMemberViewModel";
  import { NetworkState } from "../../contracts/NetworkState";
  import { useApiCall } from "../../helper/apiCallHelper";
  import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";

  let networkState: NetworkState = NetworkState.Loading;
  let items: Array<TeamMemberViewModel> = [];

  onMount(async () => {
    const aaApi = new AssistantAppsApiService();
    const [localNetworkState, localItemList] = await useApiCall(
      aaApi.getTeamMembersList
    );

    if (localNetworkState == NetworkState.Error) {
      networkState = localNetworkState;
      return;
    }

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
