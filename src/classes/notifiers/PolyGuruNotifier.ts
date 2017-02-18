'use strict';

import * as vscode from 'vscode';

import { CacheStorage } from '../storages/CacheStorage';
import { Notifier } from './Notifier';

export class PolyGuruNotifier {
  private _polymerGuruNotifier: Notifier;

  constructor() {
    this._polymerGuruNotifier = new Notifier('polyguru.viewDashboard');

    this._polymerGuruNotifier.notify('Polymer $(mortar-board)', null, null);
  }

  public notifyCheckingComponents() {
    this._polymerGuruNotifier.notify(
      `Polymer $(mortar-board): Checking components...`,
      null,
      null);
  }

  public notifyCheckComponentsMetrics() {
      this._polymerGuruNotifier.notify(
        `Polymer $(mortar-board): $(code): ${CacheStorage.Instance.appComponents.length} | $(chevron-left)$(arrow-down)$(chevron-right): ${CacheStorage.Instance.externalComponents.length} | $(alert): ${CacheStorage.Instance.failedResources.length} | $(file-text): ${CacheStorage.Instance.otherResources.length}`,
        null,
        null);    
  }
}