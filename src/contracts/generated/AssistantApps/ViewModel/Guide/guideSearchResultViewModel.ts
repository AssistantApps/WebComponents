/* Auto Generated */

import { AdminApprovalStatus } from "./../../Enum/adminApprovalStatus";

export interface GuideSearchResultViewModel {
    guid: string;
    guideDetailGuid: string;
    title: string;
    subTitle: string;
    showCreatedByUser: boolean;
    userGuid: string;
    userName: string;
    translatorGuid: string;
    translatorName: string;
    minutes: number;
    tags: any[];
    status: AdminApprovalStatus;
    languageCode: string;
    version: number;
    dateCreated: Date;
}
