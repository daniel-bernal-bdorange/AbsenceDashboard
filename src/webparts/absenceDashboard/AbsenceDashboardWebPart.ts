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
import './styles/absenceDashboard.css';

export interface IAbsenceDashboardWebPartProps {
  libraryName: string;
  folderPath: string;
  ausenciasFolder: string;
  regulFolder: string;
  rosterFolder: string;
  rosterFileName: string;
  exceptionsFolder: string;
  appTitle: string;
}

export default class AbsenceDashboardWebPart extends BaseClientSideWebPart<IAbsenceDashboardWebPartProps> {

  public render(): void {
    const lib = this.properties.libraryName ?? 'Shared Documents';
    const buildPath = (folder: string): string =>
      folder ? `${lib}/${folder.replace(/^\/+|\/+$/g, '')}` : '';

    setAppConfig({
      appTitle: this.properties.appTitle,
      // New three-folder config
      ausenciasLibraryUrl: this.properties.ausenciasFolder
        ? buildPath(this.properties.ausenciasFolder)
        : buildPath(this.properties.folderPath),
      regulLibraryUrl: buildPath(this.properties.regulFolder),
      rosterLibraryUrl: buildPath(this.properties.rosterFolder),
      exceptionsLibraryUrl: buildPath(this.properties.exceptionsFolder),
      // Legacy backward compat
      libraryUrl: this.properties.folderPath
        ? `${lib}/${this.properties.folderPath}`
        : lib,
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
                  placeholder: 'Shared Documents',
                  value: 'Shared Documents',
                }),
              ],
            },
            {
              groupName: 'Carpetas (relativas a la biblioteca)',
              groupFields: [
                PropertyPaneTextField('ausenciasFolder', {
                  label: 'Carpeta Ausencias',
                  placeholder: 'Data/Ausencias',
                }),
                PropertyPaneTextField('regulFolder', {
                  label: 'Carpeta Regularizaciones',
                  placeholder: 'Data/Regularizaciones',
                }),
                PropertyPaneTextField('rosterFolder', {
                  label: 'Carpeta Roster',
                  placeholder: 'Data/Roster',
                }),
                PropertyPaneTextField('rosterFileName', {
                  label: 'Archivo OBD (roster principal)',
                  placeholder: 'OBD Spain_employee list_2026.xlsx',
                }),
                PropertyPaneTextField('exceptionsFolder', {
                  label: 'Carpeta Excepciones vacaciones',
                  placeholder: 'Data/Excepciones vacaciones',
                }),
              ],
            },
            {
              groupName: 'General',
              groupFields: [
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
