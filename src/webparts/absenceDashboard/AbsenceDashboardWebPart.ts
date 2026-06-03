import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { setAppConfig, setSpContext } from './config/env';

import { App } from './App';
import './index.css';

export interface IAbsenceDashboardWebPartProps {
  libraryName: string;
  folderPath: string;
  rosterFileName: string;
  appTitle: string;
}

export default class AbsenceDashboardWebPart extends BaseClientSideWebPart<IAbsenceDashboardWebPartProps> {

  public render(): void {
    setAppConfig({
      appTitle: this.properties.appTitle,
      libraryUrl: this.properties.folderPath
        ? `${this.properties.libraryName}/${this.properties.folderPath}`
        : this.properties.libraryName,
      rosterFileName: this.properties.rosterFileName,
    });

    const element = React.createElement(App);
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    setSpContext(
      this.context.spHttpClient,
      this.context.pageContext.web.absoluteUrl,
      this.context.pageContext.web.serverRelativeUrl,
    );
    const { initI18n } = await import('./i18n');
    await initI18n();
    return super.onInit();
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Configuración de la biblioteca de ausencias' },
          groups: [
            {
              groupName: 'Biblioteca de documentos',
              groupFields: [
                PropertyPaneTextField('libraryName', {
                  label: 'Nombre de la biblioteca',
                  placeholder: 'Ej: Ausencias',
                  value: 'Ausencias',
                }),
                PropertyPaneTextField('folderPath', {
                  label: 'Ruta de carpeta (opcional)',
                  placeholder: 'Ej: Exportaciones/2026',
                }),
                PropertyPaneTextField('rosterFileName', {
                  label: 'Archivo de empleados (JSON)',
                  placeholder: 'employee-departments.json',
                }),
                PropertyPaneTextField('appTitle', {
                  label: 'Título del dashboard',
                  placeholder: 'Absence Dashboard',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
