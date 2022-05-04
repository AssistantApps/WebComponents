/* Auto Generated */

import { TranslationReportStatus } from "./../../Enum/translationReportStatus";

export interface TranslationReportViewModel {
    guid: string;
    userGuid: string;
    translationGuid: string;
    languageGuid: string;
    reporterGuid: string;
    reason: string;
    dateEdited: Date;
    dateSubmitted: Date;
    status: TranslationReportStatus;
}
