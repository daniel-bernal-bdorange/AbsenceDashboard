# Absence Dashboard

Base técnica inicial para la historia US-023 y la entrega CI/CD de US-024.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS 3 con la paleta Orange Business
- Apache ECharts
- MSAL.js para autenticación Entra ID
- Zustand para estado local
- i18next + react-i18next para internacionalización

## Requisitos previos

- Node.js 20 o superior
- npm

## Setup local

1. Instala dependencias:

```bash
npm install
```

2. Crea tu fichero de entorno local a partir de `.env.example`:

```bash
copy .env.example .env.local
```

3. Rellena las variables de entorno de Entra ID y SharePoint.

4. Arranca el proyecto:

```bash
npm run dev
```

## Comandos útiles

```bash
npm run lint
npm run build
npm run preview
```

## Variables de entorno

- `VITE_AAD_CLIENT_ID`
- `VITE_AAD_TENANT_ID`
- `VITE_AAD_AUTHORITY`
- `VITE_AAD_REDIRECT_URI`
- `VITE_SHAREPOINT_SITE_ID`
- `VITE_SHAREPOINT_DRIVE_ID`
- `VITE_SHAREPOINT_FOLDER_PATH`
- `VITE_DEPT_CONFIG_FILE`

## CI/CD

El workflow de GitHub Actions está en `.github/workflows/azure-static-web-apps.yml` y despliega el build de Vite en Azure Static Web Apps.

## Estructura inicial

- `src/auth`: configuración y helpers de MSAL
- `src/i18n`: configuración de idiomas y traducciones
- `src/store`: estado global con Zustand
- `src/components`: UI de base para el starter
