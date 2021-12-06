import type { ResultWithValue } from '../../contracts/results/ResultWithValue';
import { anyObject } from '../../helper/typescriptHacks';

declare global {
  interface Window { config: any }
}

export class BaseApiService {
  private _baseUrl: String = window.config?.apiUrl ?? 'https://api.assistantapps.com';
  constructor(newBaseUrl?: String) {
    if (newBaseUrl != null) this._baseUrl = newBaseUrl;
  }
  protected async get<T>(url: string): Promise<ResultWithValue<T>> {
    try {
      const result = await fetch(`${this._baseUrl}/${url}`);
      console.log(result);
      return {
        isSuccess: true,
        value: result.body as any,
        errorMessage: ''
      }
    } catch (ex) {
      console.log(ex);
      return {
        isSuccess: false,
        value: anyObject,
        errorMessage: (ex as any).message
      }
    }
  }
}
