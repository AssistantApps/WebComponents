export * from './module/patreon/patreonList.svelte';
export * from './module/patreon/patronTile.svelte';
export * from './module/version/versionSearch.svelte';
export * from './module/version/versionSearchTile.svelte';
export * from './module/team/teamList.svelte';
export * from './module/team/teamTile.svelte';
export * from './shared/markdown.svelte';

export * from './App.svelte';

const version = process?.env?.npm_package_version ?? '???';
console.log(`AssistantApps.WebComponents v${version}`)