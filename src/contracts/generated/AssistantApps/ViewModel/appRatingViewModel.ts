/* Auto Generated */

import type { AppType } from "./../Enum/appType";
import type { AppRatingType } from "./../Enum/appRatingType";

export interface AppRatingViewModel {
    app: AppType;
    type: AppRatingType;
    numberOfReviews: number;
    allScore: number;
    version: string;
}
