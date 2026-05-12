const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
const defaultAuthority = 'https://login.microsoftonline.com/common';
const placeholderGuid = '00000000-0000-0000-0000-000000000000';

const readValue = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

const isPlaceholderGuid = (value: string) => value === placeholderGuid;

const aadTenantId = readValue(import.meta.env.VITE_AAD_TENANT_ID, placeholderGuid);
const derivedAuthority = !isPlaceholderGuid(aadTenantId)
  ? `https://login.microsoftonline.com/${aadTenantId}`
  : defaultAuthority;

export const appEnv = {
  appTitle: readValue(import.meta.env.VITE_APP_TITLE, 'Absence Dashboard'),
  aadClientId: readValue(import.meta.env.VITE_AAD_CLIENT_ID, placeholderGuid),
  aadTenantId,
  aadAuthority: readValue(import.meta.env.VITE_AAD_AUTHORITY, derivedAuthority),
  aadRedirectUri: readValue(import.meta.env.VITE_AAD_REDIRECT_URI, defaultOrigin),
  aadGroupId: readValue(import.meta.env.VITE_AAD_GROUP_ID, ''),
  sharepointSiteId: readValue(import.meta.env.VITE_SHAREPOINT_SITE_ID, ''),
  sharepointDriveId: readValue(import.meta.env.VITE_SHAREPOINT_DRIVE_ID, ''),
  sharepointFolderPath: readValue(import.meta.env.VITE_SHAREPOINT_FOLDER_PATH, '/Ausencias'),
  departmentConfigFile: readValue(import.meta.env.VITE_DEPT_CONFIG_FILE, 'employee-departments.json'),
};

export const isAuthConfigured =
  !isPlaceholderGuid(appEnv.aadClientId) &&
  (appEnv.aadAuthority !== defaultAuthority || !isPlaceholderGuid(appEnv.aadTenantId));

export const isSharePointConfigured =
  import.meta.env.VITE_SHAREPOINT_SITE_ID !== undefined &&
  import.meta.env.VITE_SHAREPOINT_DRIVE_ID !== undefined;
