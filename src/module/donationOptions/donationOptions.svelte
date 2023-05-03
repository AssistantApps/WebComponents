<svelte:options tag="assistant-apps-donation-option-list" />

<script lang="ts">
  import { donationOptions } from "../../constants/donationOption";
  import { getAssistantAppsImgRoot } from "../../services/dependencyInjection";
</script>

<div class="grid-container donation-options-container">
  {#each donationOptions as donationOption}
    <a
      href={donationOption.url}
      class="aa-donation-option"
      target="_blank"
      rel="noreferrer noopener"
      title={donationOption.title}
    >
      <img
        src={`${getAssistantAppsImgRoot()}/assets/img/donation/${
          donationOption.image
        }`}
        alt={donationOption.title}
        class="donation-img noselect"
      />
      <div class="content">
        <h2 class="app-name">{donationOption.title}</h2>
      </div>
    </a>
  {/each}
</div>

<style src="./donationOptions.scss"></style>
