import { currentVersion } from './version';

export * from './module/patreon/patreonList.svelte';
export * from './module/patreon/patronTile.svelte';
export * from './module/team/teamList.svelte';
export * from './module/team/teamTile.svelte';
export * from './module/translatorLeaderboard/leaderboardList.svelte';
export * from './module/translatorLeaderboard/leaderboardTile.svelte';
export * from './module/version/versionSearch.svelte';
export * from './module/version/versionSearchTile.svelte';
export * from './shared/loadingWithSlots.svelte';
export * from './shared/markdown.svelte';
export * from './shared/tooltip.svelte';

export * from './App.svelte';

console.log(`AssistantApps.WebComponents v${currentVersion}`)