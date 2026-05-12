const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

const readValue = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

export const appEnv = {
  appTitle: readValue(import.meta.env.VITE_APP_TITLE, 'Absence Dashboard'),
  aadClientId: readValue(import.meta.env.VITE_AAD_CLIENT_ID, '00000000-0000-0000-0000-000000000000'),
  aadTenantId: readValue(import.meta.env.VITE_AAD_TENANT_ID, 'common'),
  aadAuthority: readValue(
    import.meta.env.VITE_AAD_AUTHORITY,
    'https://login.microsoftonline.com/common',
  ),
  aadRedirectUri: readValue(import.meta.env.VITE_AAD_REDIRECT_URI, defaultOrigin),
  sharepointSiteId: readValue(import.meta.env.VITE_SHAREPOINT_SITE_ID, ''),
  sharepointDriveId: readValue(import.meta.env.VITE_SHAREPOINT_DRIVE_ID, ''),
  sharepointFolderPath: readValue(import.meta.env.VITE_SHAREPOINT_FOLDER_PATH, '/Ausencias'),
  departmentConfigFile: readValue(import.meta.env.VITE_DEPT_CONFIG_FILE, 'employee-departments.json'),
};

export const isAuthConfigured =
  import.meta.env.VITE_AAD_CLIENT_ID !== undefined && import.meta.env.VITE_AAD_TENANT_ID !== undefined;

export const isSharePointConfigured =
  import.meta.env.VITE_SHAREPOINT_SITE_ID !== undefined &&
  import.meta.env.VITE_SHAREPOINT_DRIVE_ID !== undefined;
