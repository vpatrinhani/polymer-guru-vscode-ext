
'use strict';

import * as vscode from 'vscode';

export class Notifier {
  private _timeoutId: NodeJS.Timer;

  public statusBarItem: vscode.StatusBarItem;

  constructor(command?: string, alignment?: vscode.StatusBarAlignment, priority?: number) {
    this.statusBarItem = vscode.window.createStatusBarItem(alignment, priority);
    this.statusBarItem.command = command;
    this.statusBarItem.show();
  }

  public notify(text: string, icon?: string, opt?: { expirationTime?: Number }): void {
    opt = opt || {};
    opt.expirationTime = opt.expirationTime || null;

    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
    
    this.statusBarItem.text = '';
    if (icon) {
      this.statusBarItem.text = `$(${icon}) `;
    }
    this.statusBarItem.text += `${text}`;
    this.statusBarItem.tooltip = null;

    if (opt.expirationTime) {
      this._timeoutId = setTimeout(() => {
        this.statusBarItem.text = `$(${icon})`;
        this.statusBarItem.tooltip = text;
      }, 5000);
    }
  }
}