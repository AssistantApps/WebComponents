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
      return {
        isSuccess: true,
        value: result.body as any,
        errorMessage: ''
      }
    } catch (ex) {
      return {
        isSuccess: false,
        value: anyObject,
        errorMessage: (ex as any).message
      }
    }
  }

  protected async post<T, TK>(url: string, payload: TK, customMapper?: (data: any) => any): Promise<ResultWithValue<T>> {
    try {
      const result = await fetch(`${this._baseUrl}/${url}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      const content = await result.json();
      if (customMapper != null) return customMapper(content);
      return {
        isSuccess: true,
        value: content,
        errorMessage: ''
      }
    } catch (ex) {
      return {
        isSuccess: false,
        value: anyObject,
        errorMessage: (ex as any).message
      }
    }
  }
}
