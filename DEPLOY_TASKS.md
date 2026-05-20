{
  "project": "Absence Dashboard - Azure/SharePoint Deployment",
  "description": "Desplegar el dashboard en Azure Static Web Apps con integración Microsoft Graph API para leer archivos Excel de SharePoint",
  "lastUpdated": "2026-05-20",
  "phases": {
    "azure_ad": {
      "name": "Azure AD - App Registration",
      "tasks": [
        {
          "id": "AD-001",
          "name": "Registrar App en Azure AD",
          "description": "Crear App Registration en Azure AD con tipo SPA",
          "portal": "https://entra.microsoft.com > Azure Active Directory > App registrations > New registration",
          "required": true,
          "outputs": ["Client ID", "Tenant ID"]
        },
        {
          "id": "AD-002",
          "name": "Configurar redirect URI",
          "description": "Añadir redirect URI para Azure Static Web Apps (https://<name>.azurestaticapps.net)",
          "required": true
        },
        {
          "id": "AD-003",
          "name": "Solicitar permisos de API",
          "description": "Añadir permisos: Sites.Read.All, Files.Read.All (Application)",
          "required": true
        },
        {
          "id": "AD-004",
          "name": "Crear secreto de cliente",
          "description": "Para acceso daemon si se necesita",
          "required": false
        }
      ]
    },
    "codigo": {
      "name": "Código - Restaurar autenticación y Graph API",
      "tasks": [
        {
          "id": "CODE-001",
          "name": "Restaurar src/auth/msalConfig.ts",
          "description": "Configuración MSAL con Client ID, Tenant ID, redirect URI",
          "file": "src/auth/msalConfig.ts",
          "required": true
        },
        {
          "id": "CODE-002",
          "name": "Restaurar src/auth/AuthProvider.tsx",
          "description": "Context provider para autenticación MSAL",
          "file": "src/auth/AuthProvider.tsx",
          "required": true
        },
        {
          "id": "CODE-003",
          "name": "Crear src/api/graphClient.ts",
          "description": "Cliente Graph API para listar y leer archivos de SharePoint",
          "file": "src/api/graphClient.ts",
          "required": true
        },
        {
          "id": "CODE-004",
          "name": "Crear src/api/sharepoint.ts",
          "description": "Funciones para leer carpeta de SharePoint, listar .xlsx, obtener contenido",
          "file": "src/api/sharepoint.ts",
          "required": true
        },
        {
          "id": "CODE-005",
          "name": "Actualizar App.tsx para usar AuthProvider",
          "description": "Integrar autenticación SSO en la app principal",
          "file": "src/App.tsx",
          "required": true
        },
        {
          "id": "CODE-006",
          "name": "Crear pantalla de login/loading",
          "description": "Fallback mientras MSAL obtiene token",
          "file": "src/components/AuthLoading.tsx",
          "required": true
        },
        {
          "id": "CODE-007",
          "name": "Mantener modo local como fallback",
          "description": "Mantener FolderPicker para acceso local sin conexión a internet",
          "file": "src/components/FolderPicker.tsx",
          "required": true
        }
      ]
    },
    "config": {
      "name": "Configuración - Variables de entorno",
      "tasks": [
        {
          "id": "CFG-001",
          "name": "Actualizar .env.example",
          "description": "Documentar todas las variables de entorno necesarias",
          "file": ".env.example",
          "required": true
        },
        {
          "id": "CFG-002",
          "name": "Configurar GitHub Secrets",
          "description": "Añadir secrets en GitHub para Azure Static Web Apps",
          "secrets": [
            "VITE_AAD_CLIENT_ID",
            "VITE_AAD_TENANT_ID",
            "VITE_AAD_REDIRECT_URI",
            "VITE_SHAREPOINT_SITE_ID",
            "VITE_SHAREPOINT_DRIVE_ID",
            "VITE_SHAREPOINT_FOLDER_PATH"
          ],
          "required": true
        }
      ]
    },
    "azure_swa": {
      "name": "Azure Static Web Apps - Despliegue",
      "tasks": [
        {
          "id": "AZ-001",
          "name": "Crear Static Web App desde Azure CLI",
          "description": "az staticwebapp create --name absence-dashboard --resource-group <rg> --location westus2 --source <repo>",
          "cli": "az staticwebapp create",
          "required": true
        },
        {
          "id": "AZ-002",
          "name": "Configurar workflows de GitHub",
          "description": "Habilitar GitHub Actions desde Azure Portal",
          "portal": "Azure Portal > Static Web Apps > Management > Configuration",
          "required": true
        },
        {
          "id": "AZ-003",
          "name": "Verificar despliegue automático",
          "description": "Push a main debe disparar build y deploy",
          "required": true
        },
        {
          "id": "AZ-004",
          "name": "Verificar autenticación",
          "description": "Probar login SSO con cuenta corporativa",
          "required": true
        },
        {
          "id": "AZ-005",
          "name": "Verificar lectura de archivos SharePoint",
          "description": "Probar que el dashboard lee los Excel correctamente",
          "required": true
        }
      ]
    },
    "testing": {
      "name": "Testing y validación",
      "tasks": [
        {
          "id": "TEST-001",
          "name": "Probar flujo completo como usuaria final",
          "description": "Login SSO > Selección de archivos > Visualización de dashboard",
          "required": true
        },
        {
          "id": "TEST-002",
          "name": "Probar filtros y gráficos",
          "description": "Verificar que todas las funcionalidades funcionan con datos de SharePoint",
          "required": true
        },
        {
          "id": "TEST-003",
          "name": "Probar export CSV",
          "description": "Probar exportación de datos filtrados",
          "required": true
        },
        {
          "id": "TEST-004",
          "name": "Probar desde diferentes navegadores",
          "description": "Edge, Chrome (navegadores corporativos estándar)",
          "required": false
        }
      ]
    }
  },
  "summary": {
    "total": 18,
    "required": 16,
    "optional": 2
  },
  "nextSteps": [
    {
      "step": 1,
      "action": "Crear App Registration en Azure AD",
      "output": "Client ID y Tenant ID",
      "blockedBy": []
    },
    {
      "step": 2,
      "action": "Restaurar código de autenticación (MSAL)",
      "output": "src/auth/ completo",
      "blockedBy": ["AD-001"]
    },
    {
      "step": 3,
      "action": "Crear cliente Graph API",
      "output": "src/api/graphClient.ts, src/api/sharepoint.ts",
      "blockedBy": ["AD-001", "CODE-001"]
    },
    {
      "step": 4,
      "action": "Configurar Azure Static Web Apps",
      "output": "App desplegada en Azure",
      "blockedBy": ["CFG-002"]
    }
  ],
  "risks": [
    {
      "risk": "Usuaria final no tiene permisos de Azure para autenticarse",
      "mitigation": "Verificar pertenencia al grupo de Azure AD configurado"
    },
    {
      "risk": "Políticas de empresa bloquean Azure Static Web Apps",
      "mitigation": "Alternativa: desplegar en SharePoint Pages o solicitar excepción IT"
    },
    {
      "risk": "Datos de empleados sensibles en servidores externos",
      "mitigation": "Usar tenant de Microsoft 365 de la empresa (datos no salen de la organización)"
    }
  ],
  "dependencies": {
    "note": "Fases 1-2 pueden hacerse en paralelo. Fase 3 requiere completarse antes de Azure.",
    "sequence": ["azure_ad → codigo → config → azure_swa → testing"]
  }
}