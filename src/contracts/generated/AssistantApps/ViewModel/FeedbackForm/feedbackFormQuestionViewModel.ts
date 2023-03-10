/* Auto Generated */

import { FeedbackQuestionType } from "./../../Enum/feedbackQuestionType";

export interface FeedbackFormQuestionViewModel {
    guid: string;
    feedbackFormGuid: string;
    questionText: string;
    questionType: FeedbackQuestionType;
    answerCanContainSensitiveInfo: boolean;
    sortOrder: number;
}
