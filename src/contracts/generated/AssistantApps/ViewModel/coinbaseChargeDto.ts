/* Auto Generated */

import { CoinbaseEventType } from "./../Enum/coinbaseEventType";

export interface CoinbaseChargeDto {
    userGuid: string;
    type: CoinbaseEventType;
    hostedUrl: string;
    expiresAt: any;
    bitcoinCode: string;
    bitcoinCashCode: string;
    daiCode: string;
    ethereumCode: string;
    liteCoinCode: string;
    usdCoinCode: string;
}
