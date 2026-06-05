# absence-dashboard

## Summary

Short summary on functionality and used technologies.

[picture of the solution in action, if possible]

## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.23.0-green.svg)

## Applies to

- [SharePoint Framework](https://aka.ms/spfx)
- [Microsoft 365 tenant](https://docs.microsoft.com/sharepoint/dev/spfx/set-up-your-developer-tenant)

> Get your own free development tenant by subscribing to [Microsoft 365 developer program](http://aka.ms/o365devprogram)

## Prerequisites

> Any special pre-requisites?

## Solution

| Solution    | Author(s)                                               |
| ----------- | ------------------------------------------------------- |
| folder name | Author details (name, company, twitter alias with link) |

## Version history

| Version | Date             | Comments        |
| ------- | ---------------- | --------------- |
| 1.1     | March 10, 2021   | Update comment  |
| 1.0     | January 29, 2021 | Initial release |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

---

## Run locally (hosted workbench)

Requisitos:
- Node 22 LTS (gestionado con `fnm`; ver `tools/use-spfx-node.ps1`).
- Acceso al site `https://bdbelux1.sharepoint.com/teams/AbsenceDashboard/`.
- Certificado de desarrollo SPFx confiado (una sola vez por máquina):
  `npx office-addin-dev-certs install`

Arranque:

```powershell
# 1) Activar Node 22 en la sesión actual
.\tools\use-spfx-node.ps1

# 2) Dependencias (primera vez)
npm ci

# 3) Servir el web part en el workbench hosted
npm start
```

`npm start` ejecuta `prestart` → compila Tailwind (`build:css`) → arranca `heft start`. El workbench abrirá en `https://bdbelux1.sharepoint.com/teams/AbsenceDashboard/_layouts/15/workbench.aspx`.

En el workbench:
1. Añadir el web part **Absence Dashboard**.
2. Configurar el property pane:
   - **Nombre de la biblioteca**: `Shared Documents`
   - **Ruta de carpeta**: `Data`
   - **Archivo de empleados (roster)**: `OBD Spain_employee list_2026.xlsx`
   - **Título**: `Absence Dashboard`

Otros comandos:
- `npm run build:css` — recompila Tailwind a `src/webparts/absenceDashboard/styles/absenceDashboard.css` (ignorado en git).
- `npm run watch:css` — modo watch.
- `npm run lint` — ESLint.
- `npm run build` — bundle de producción (`heft test --production && heft package-solution --production`) → genera `.sppkg`.

## Features

Description of the extension that expands upon high-level summary above.

This extension illustrates the following concepts:

- topic 1
- topic 2
- topic 3

> Notice that better pictures and documentation will increase the sample usage and the value you are providing for others. Thanks for your submissions advance.

> Share your web part with others through Microsoft 365 Patterns and Practices program to get visibility and exposure. More details on the community, open-source projects and other activities from http://aka.ms/m365pnp.

## References

- [Getting started with SharePoint Framework](https://docs.microsoft.com/sharepoint/dev/spfx/set-up-your-developer-tenant)
- [Building for Microsoft teams](https://docs.microsoft.com/sharepoint/dev/spfx/build-for-teams-overview)
- [Use Microsoft Graph in your solution](https://docs.microsoft.com/sharepoint/dev/spfx/web-parts/get-started/using-microsoft-graph-apis)
- [Publish SharePoint Framework applications to the Marketplace](https://docs.microsoft.com/sharepoint/dev/spfx/publish-to-marketplace-overview)
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp) - Guidance, tooling, samples and open-source controls for your Microsoft 365 development
- [Heft Documentation](https://heft.rushstack.io/)