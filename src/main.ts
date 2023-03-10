import { currentVersion } from './version';

export * from './module/apps/appList.svelte';
export * from './module/apps/appTile.svelte';
export * from './module/appsNotices/appsNoticeListSearch.svelte';
export * from './module/appsNotices/appsNoticeList.svelte';
export * from './module/appsNotices/appsNoticeTile.svelte';
export * from './module/patreon/patreonList.svelte';
export * from './module/patreon/patronTile.svelte';
export * from './module/team/teamList.svelte';
export * from './module/team/teamTile.svelte';
export * from './module/translatorLeaderboard/leaderboardList.svelte';
export * from './module/translatorLeaderboard/leaderboardTile.svelte';
export * from './module/version/versionSearch.svelte';
export * from './module/version/versionSearchTile.svelte';
export * from './shared/dropdown.svelte';
export * from './shared/dropdownOption.svelte';
export * from './shared/loadingWithSlots.svelte';
export * from './shared/markdown.svelte';
export * from './shared/tooltip.svelte';

export * from './App.svelte';

console.log(`AssistantApps.WebComponents v${currentVersion}`)