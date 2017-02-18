'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import { CacheStorage } from './storages/CacheStorage';
import { Notifier } from './Notifier';
import { PolymerGuruDashboardDocument } from '../classes/views/PolymerGuruDashboard/Index';
import { FileParserHelper } from './parsers/FileParserHelper';

export class PolyGuruContext {
  private static _instance: PolyGuruContext;
  public static get Instance() {
    return PolyGuruContext._instance || (PolyGuruContext._instance = new PolyGuruContext());
  }

  get cache() {
    return CacheStorage.Instance;
  }

  private _polymerComponentsNotifier: Notifier;

  private constructor() {
    // vscode.window.showInformationMessage('[PolyGuruContext][ctor]');
    this._polymerComponentsNotifier = new Notifier('polyguru.viewDashboard');

    this.cache.loadConfig();

    this._polymerComponentsNotifier.notify('Polymer $(mortar-board)', null, null);
  }

  public checkComponents(): Thenable<any> {
    this._polymerComponentsNotifier.notify(
      `Polymer $(mortar-board): Checking components...`,
      null,
      null);

    this.cache.clearFailedResources();
    this.cache.clearOtherResources();

    return Promise.all([
      FileParserHelper.parseAppComponents(),
      FileParserHelper.parseExternalComponents(),
    ]).then(() => {
      this._updateStatusCheckComponents();
    });
  }

  private _updateStatusCheckComponents() {
    return new Promise((resolve) => {
      this._polymerComponentsNotifier.notify(
        `Polymer $(mortar-board): $(code): ${this.cache.appComponents.length} / $(chevron-left)$(arrow-down)$(chevron-right): ${this.cache.externalComponents.length} / $(alert): ${this.cache.failedResources.length} / $(file): ${this.cache.otherResources.length}`,
        null,
        null);

      resolve();
    });
  }

  public viewDashboard() {
    let previewUri = PolymerGuruDashboardDocument.uri;
    return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.One, 'Polymer Guru - Dashboard')
      .then((success) => { },
        (reason) => {
          vscode.window.showErrorMessage(reason);
        });
  }

  public static get isEnabled(): Boolean {
    return fs.existsSync(CacheStorage.configPath);
  }
}