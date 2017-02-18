'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import { CacheStorage } from './storages/CacheStorage';
import { PolyGuruNotifier } from './notifiers/PolyGuruNotifier';
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

  private _polymerGuruNotifier: PolyGuruNotifier;

  private constructor() {
    this.cache.loadConfig();
    this._polymerGuruNotifier = new PolyGuruNotifier();
  }

  public checkComponents(): Thenable<any> {
    this._polymerGuruNotifier.notifyCheckingComponents();

    this.cache.clearFailedResources();
    this.cache.clearOtherResources();

    return Promise.all([
      FileParserHelper.parseAppComponents(),
      FileParserHelper.parseExternalComponents(),
    ]).then(() => {
      this._polymerGuruNotifier.notifyCheckComponentsMetrics();
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