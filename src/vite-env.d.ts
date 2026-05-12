/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  readonly VITE_AAD_CLIENT_ID?: string;
  readonly VITE_AAD_TENANT_ID?: string;
  readonly VITE_AAD_AUTHORITY?: string;
  readonly VITE_AAD_REDIRECT_URI?: string;
  readonly VITE_SHAREPOINT_SITE_ID?: string;
  readonly VITE_SHAREPOINT_DRIVE_ID?: string;
  readonly VITE_SHAREPOINT_FOLDER_PATH?: string;
  readonly VITE_DEPT_CONFIG_FILE?: string;
}
