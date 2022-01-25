<svelte:options tag="assistant-apps-team-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { TeamMemberViewModel } from "../../contracts/generated/AssistantApps/ViewModel/teamMemberViewModel";
  import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";
  import { NetworkState } from "../../contracts/NetworkState";

  let teamMembersState: NetworkState = NetworkState.Loading;
  let teamMembers: Array<TeamMemberViewModel> = [];

  const fetchTeamMembers = async () => {
    const aaApi = new AssistantAppsApiService();
    const teamMembersListResult = await aaApi.getTeamMembersList();
    if (teamMembersListResult.isSuccess === false) {
      teamMembersState = NetworkState.Error;
      return;
    }
    teamMembers = teamMembersListResult.value;
    teamMembersState = NetworkState.Success;
  };

  onMount(async () => {
    fetchTeamMembers();
  });
</script>

<div class="team-members-container noselect">
  {#if teamMembersState === NetworkState.Loading}
    <span>Loading...</span>
  {:else if teamMembersState === NetworkState.Error}
    <span>Something went wrong...</span>
  {:else}
    {#each teamMembers as teamMember}
      <assistant-apps-team-tile
        name={teamMember.name}
        role={teamMember.role}
        imageurl={teamMember.imageUrl}
        linkname={teamMember.linkName}
        linkurl={teamMember.linkUrl}
      />
    {/each}
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
</style>
