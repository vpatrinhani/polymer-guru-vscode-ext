'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as objQuery from 'simple-object-query';
import * as Data from '../data/PolyGuruConfig';
import * as _orderBy from 'lodash.orderby';

import { FileParser } from '../parsers/FileParser';
import { HTMLFileParser } from '../parsers/HTMLFileParser';

export class CacheStorage {
  private static _instance: CacheStorage;
  public static get Instance() {
    return CacheStorage._instance || (CacheStorage._instance = new CacheStorage());
  }

  private _configWatcher: vscode.FileSystemWatcher;
  private _config: Data.PolyGuruConfig;
  
  public get config() {
    return this._config;
  }

  public static get configPath(): string {
    return path.join(vscode.workspace.rootPath, '.polymer-guru.json');
  }

  private _listAppComponents: HTMLFileParser[] = [];
  private _listAppComponentsOrdered: HTMLFileParser[] = null;
  private _listExtLibComponents: HTMLFileParser[] = [];
  private _listExtLibComponentsOrdered: HTMLFileParser[] = null;
  private _listOtherResources: FileParser[] = [];
  private _listFailedResources: { fileParser: FileParser, error: any }[] = [];

  public get appComponents(): HTMLFileParser[] {
    return this._listAppComponents;
  }

  public get appComponentsOrdered(): HTMLFileParser[] {
    if (!this._listAppComponentsOrdered) {
      this._listAppComponentsOrdered = _orderBy(this.appComponents, (d) => {
        return d.filePath.relativePath;
      });
    }
    return this._listAppComponentsOrdered;
  }

  public clearAppComponents() {
    this._listAppComponents = [];
    this.clearAppComponentsOrderedCacheList();
  }
  public clearAppComponentsOrderedCacheList() {
    this._listAppComponentsOrdered = null;
  }

  public get externalComponents(): HTMLFileParser[] {
    return this._listExtLibComponents;
  }
  public get externalComponentsOrdered(): HTMLFileParser[] {
    if (!this._listExtLibComponentsOrdered) {
      this._listExtLibComponentsOrdered = _orderBy(this.externalComponents, (d) => {
        return d.filePath.relativePath;
      });
    }
    return this._listExtLibComponentsOrdered;
  }
  public clearExternalComponents() {
    this._listExtLibComponents = [];
    this.clearExternalComponentsOrderedCacheList();
  }
  public clearExternalComponentsOrderedCacheList() {
    this._listExtLibComponentsOrdered = null;
  }

  public get otherResources(): FileParser[] {
    return this._listOtherResources;
  }
  public clearOtherResources() {
    this._listOtherResources = [];
  }

  public get failedResources(): { fileParser: FileParser, error: any }[] {
    return this._listFailedResources;
  }
  public clearFailedResources() {
    this._listFailedResources = [];
  }
  

  private constructor() {
  }

  public loadConfig(): void {
    try {
      var contentBuffer = fs.readFileSync(CacheStorage.configPath, 'utf-8');
      this._config = JSON.parse(contentBuffer) as Data.PolyGuruConfig;

      this._initConfigWatcher();
    } catch (e) {
      console.log((<Error>e));
    }
  }

  private _initConfigWatcher() {
    if (!this._configWatcher) {
      this._configWatcher = vscode.workspace.createFileSystemWatcher(CacheStorage.configPath, true, false, true);
      this._configWatcher.onDidChange(() => {
        this.loadConfig();
      });
    }
  }
}