/* Auto Generated */

import { DonationType } from "./../Enum/donationType";

export interface DonationViewModel {
    guid: string;
    userGuid?: string;
    username: string;
    email: string;
    type: DonationType;
    amount?: number;
    currency: string;
    actualAmount?: number;
    isHidden?: boolean;
    date: Date;
}
