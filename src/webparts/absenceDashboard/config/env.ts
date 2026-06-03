import { SPHttpClient } from '@microsoft/sp-http';

export interface IAppConfig {
  appTitle: string;
  libraryUrl: string;
  rosterFileName: string;
}

let _config: IAppConfig = {
  appTitle: 'Absence Dashboard',
  libraryUrl: '',
  rosterFileName: 'employee-departments.json',
};

let _spHttpClient: SPHttpClient | null = null;
let _siteAbsoluteUrl: string = '';
let _siteServerRelativeUrl: string = '';

export function setAppConfig(config: Partial<IAppConfig>): void {
  _config = { ..._config, ...config };
}

export function setSpContext(spHttpClient: SPHttpClient, siteAbsoluteUrl: string, siteServerRelativeUrl: string): void {
  _spHttpClient = spHttpClient;
  _siteAbsoluteUrl = siteAbsoluteUrl;
  _siteServerRelativeUrl = siteServerRelativeUrl;
}

export function getSpHttpClient(): SPHttpClient {
  if (!_spHttpClient) {
    throw new Error('SPHttpClient not initialized. Call setSpContext first.');
  }
  return _spHttpClient;
}

export function getSiteAbsoluteUrl(): string {
  return _siteAbsoluteUrl;
}

export function getSiteServerRelativeUrl(): string {
  return _siteServerRelativeUrl;
}

export const appEnv = new Proxy({} as IAppConfig, {
  get(_target, prop: keyof IAppConfig) {
    return _config[prop];
  },
});
