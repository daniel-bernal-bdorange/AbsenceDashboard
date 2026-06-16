import { SPHttpClient } from '@microsoft/sp-http';

export interface IAppConfig {
  appTitle: string;
  /** @deprecated Use ausenciasLibraryUrl. Kept for backward compatibility. */
  libraryUrl: string;
  ausenciasLibraryUrl: string;
  regulLibraryUrl: string;
  rosterLibraryUrl: string;
  rosterFileName: string;
  exceptionsLibraryUrl: string;
}

let _config: IAppConfig = {
  appTitle: 'Absence Dashboard',
  libraryUrl: '',
  ausenciasLibraryUrl: '',
  regulLibraryUrl: '',
  rosterLibraryUrl: '',
  rosterFileName: 'employee-departments.json',
  exceptionsLibraryUrl: '',
};

let _spHttpClient: SPHttpClient | null = null;
let _siteAbsoluteUrl: string = '';
let _siteServerRelativeUrl: string = '';

export function setAppConfig(config: Partial<IAppConfig>): void {
  _config = { ..._config, ...config };
  // Backward compat: libraryUrl populates ausenciasLibraryUrl if not explicitly set
  if (config.libraryUrl && !config.ausenciasLibraryUrl) {
    _config.ausenciasLibraryUrl = config.libraryUrl;
  }
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
    // Backward compat: ausenciasLibraryUrl falls back to libraryUrl
    if (prop === 'ausenciasLibraryUrl' && !_config.ausenciasLibraryUrl) {
      return _config.libraryUrl;
    }
    return _config[prop];
  },
});
