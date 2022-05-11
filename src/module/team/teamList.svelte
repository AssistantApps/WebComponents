<svelte:options tag="assistant-apps-team-list" />

<script lang="ts">
  import { onMount } from "svelte";
  import type { TeamMemberViewModel } from "../../contracts/generated/AssistantApps/ViewModel/teamMemberViewModel";
  import { AssistantAppsApiService } from "../../services/api/AssistantAppsApiService";
  import { NetworkState } from "../../contracts/NetworkState";

  let networkState: NetworkState = NetworkState.Loading;
  let teamMembers: Array<TeamMemberViewModel> = [];

  const fetchTeamMembers = async () => {
    const aaApi = new AssistantAppsApiService();
    const teamMembersListResult = await aaApi.getTeamMembersList();
    if (
      teamMembersListResult.isSuccess == false ||
      teamMembersListResult.value == null ||
      teamMembersListResult.value.length < 1
    ) {
      networkState = NetworkState.Error;
      return;
    }
    teamMembers = teamMembersListResult.value;
    networkState = NetworkState.Success;
  };

  onMount(async () => {
    fetchTeamMembers();
  });
</script>

<div class="noselect">
  <assistant-apps-loading networkstate={networkState}>
    <slot name="loading" slot="loading" />
    <slot name="error" slot="error" />
    <div slot="loaded" class="team-members-container">
      {#each teamMembers as teamMember}
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
    font-weight: var(--assistantapps-font-weight, "bold");
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

  assistant-apps-team-tile {
    display: block;
    margin-bottom: 1em;
    border-bottom: 1px solid
      var(
        --assistantapps-team-member-background-colour,
        rgba(255, 255, 255, 0.1)
      );
  }

  assistant-apps-team-tile:last-child {
    border-bottom: none;
  }
</style>
