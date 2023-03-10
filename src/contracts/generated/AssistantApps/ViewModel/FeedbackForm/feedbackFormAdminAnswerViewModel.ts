/* Auto Generated */

import { PlatformType } from "./../../Enum/platformType";
import { FeedbackCategory } from "./../../Enum/feedbackCategory";
import { FeedbackQuestionType } from "./../../Enum/feedbackQuestionType";

export interface FeedbackFormAdminAnswerViewModel {
    guid: string;
    submissionGuid: string;
    feedbackFormGuid: string;
    platformType: PlatformType;
    category: FeedbackCategory;
    anonymousUserGuid: string;
    dateAnswered: Date;
    answers: any[];
    feedbackFormQuestionGuid: string;
    questionType: FeedbackQuestionType;
    questionText: string;
    answer: string;
    answerCanContainSensitiveInfo: boolean;
    sortOrder: number;
}
