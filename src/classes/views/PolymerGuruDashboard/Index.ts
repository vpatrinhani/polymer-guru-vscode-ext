'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as template from 'lodash.template';
import jQuery from 'jquery'

import { HTMLFileParser } from '../../parsers/HTMLFileParser';

interface PolymerGuruDashboardDocumentTemplate {
  appComponents: HTMLFileParser[];
  externalComponents: HTMLFileParser[];
}

export class PolymerGuruDashboardDocument implements vscode.TextDocumentContentProvider {
  public static schema: string = 'polymer-guru-dashboard';
  public static uri: vscode.Uri = vscode.Uri.parse(PolymerGuruDashboardDocument.schema + '://main');

  private _getTemplateDataCallback: () => PolymerGuruDashboardDocumentTemplate;

  constructor(getTemplateDataCallback? : () => PolymerGuruDashboardDocumentTemplate) {    
    this._getTemplateDataCallback = getTemplateDataCallback || (() => {
      return {
        appComponents: [],
        externalComponents: []
      };
    });
  }

  public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Thenable<string> {
    return this._generateHtmlOutput()
      .then((html) => {
        return html;
      });
  }

  private _getViewsPath(resourceName: string): string {
    return path.join(__dirname, '..','..','..','..','..', 'resources/views', resourceName);
  }
  private _getStyleSheetPath(resourceName?: string): string {
    resourceName = resourceName || '';
    return vscode.Uri.file(path.join(__dirname, '..','..','..','..','..', 'resources/views/styles', resourceName)).toString();
  }
  private _getScriptFilePath(resourceName?: string): string {
    resourceName = resourceName || '';
    return vscode.Uri.file(path.join(__dirname, '..','..','..','..','..', 'resources/views/scripts', resourceName)).toString();
  }
  private _getNodeModulesPath(resourceName?: string): string {
    resourceName = resourceName || '';
    return vscode.Uri.file(path.join(__dirname, '..','..','..','..','..', 'node_modules', resourceName)).toString();
  }
  
  private _generateHtmlOutput(): Thenable<string> {
    return new Promise((resolve) => {
      let _filePath = this._getViewsPath('PolymerGuruDashboard.html');
      fs.readFile(_filePath, 'utf-8', (err, html) => {
        resolve(this._resolveHtmlTemplate(html));
      });
    }); 
  }

  private _resolveHtmlTemplate(html: string): string {
    let _html = html;
    _html = this._resolveHtmlTemplatePaths(_html);

    let compiled = template(_html);

    _html = compiled(this._getTemplateDataCallback());

    return _html;
  }

  private _resolveHtmlTemplatePaths(html: string): string {
    html = html.replace(/href="\.\.\/\.\.\/node_modules/g, `href="${this._getNodeModulesPath()}`);
    html = html.replace(/href="styles/g, `href="${this._getStyleSheetPath()}`);

    html = html.replace(/src="\.\.\/\.\.\/node_modules/g, `src="${this._getNodeModulesPath()}`);
    html = html.replace(/src="scripts/g, `src="${this._getScriptFilePath()}`);

    return html;
  }

  private _generateErrorView(error?: string): string {
    return `
        <head>
        </head>
        <body>
            <span>Error</span>
        </body>
    `;
  }
}