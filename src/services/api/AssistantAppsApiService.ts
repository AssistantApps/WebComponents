import type { ResultWithValue, ResultWithValueAndPagination } from '../../contracts/results/ResultWithValue';
import { BaseApiService } from './BaseApiService';
import type { PatreonViewModel } from '../../contracts/generated/AssistantApps/ViewModel/patreonViewModel';
import type { TeamMemberViewModel } from "../../contracts/generated/AssistantApps/ViewModel/teamMemberViewModel";
import type { VersionViewModel } from '../../contracts/generated/AssistantApps/ViewModel/Version/versionViewModel';
import type { VersionSearchViewModel } from '../../contracts/generated/AssistantApps/ViewModel/Version/versionSearchViewModel';
import type { AppViewModel } from '../../contracts/generated/AssistantApps/ViewModel/appViewModel';

declare global {
    interface Window { config: any }
}

export class AssistantAppsApiService extends BaseApiService {
    constructor() {
        super(window.config?.assistantAppsUrl);
    }
    getApps = (): Promise<ResultWithValue<Array<AppViewModel>>> => this.get<Array<AppViewModel>>('app');
    getPatronsList = (): Promise<ResultWithValue<Array<PatreonViewModel>>> => this.get<Array<PatreonViewModel>>('patreon');
    getTeamMembersList = (): Promise<ResultWithValue<Array<TeamMemberViewModel>>> => this.get<Array<TeamMemberViewModel>>('teammember');

    async getWhatIsNewItems(search: VersionSearchViewModel): Promise<ResultWithValueAndPagination<Array<VersionViewModel>>> {
        const result = await this.post<Array<VersionViewModel>, VersionSearchViewModel>(
            'Version/Search', search);

        return result.value as any;
    }
}
