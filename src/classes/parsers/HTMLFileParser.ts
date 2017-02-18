import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FilePath } from '../io/FilePath';
import * as objQuery from 'simple-object-query';
import * as flatMapDeep from 'lodash.flatmapdeep';
import * as htmlparser from 'htmlparser2';
import * as DomHandler from 'domhandler';
import { minify } from 'html-minifier';

import { CacheStorage } from '../storages/CacheStorage';
import { FileParser } from './FileParser';

export class HTMLFileParser extends FileParser {
  public domInfo: any[] = [];

  private _isPolymerComponent: Boolean = false;
  public get isPolymerComponent(): Boolean {
    return this._isPolymerComponent;
  }

  private _componentName: string;
  public get componentName(): string {
    return this._componentName;
  }

  public get linkImports(): any[] {
    let flatNodes = this._getFlatDomNodes();

    let qResult = objQuery.where(flatNodes, {
      'name': /(link)/,
      'attribs.rel': /(import)/
    });

    for (let i = 0; i < qResult.length; i++) {
      let linkImport = qResult[i];

      let workspacePath = vscode.workspace.rootPath;
      let linkPath = linkImport.attribs.href;

      let patht01 = path.resolve(this.filePath.absolutePath, linkPath);
      let patht02 = path.resolve(workspacePath, linkPath);
      let patht03 = path.resolve(path.dirname(this.filePath.absolutePath), linkPath);
      // console.log(patht01, patht02, patht03);
    }

    return qResult;
  }

  public get domModuleNode(): any {
    let flatNodes = this._getFlatDomNodes();

    let qResult = objQuery.where(flatNodes, {
      'name': /(dom-module)/
    });

    return (qResult && qResult.length > 0) ? qResult[0] : null;
  }

  public get componentInternalNodes(): any[] {
    let domModule = this.domModuleNode;

    if (domModule) {
      let flatNodes = this._getFlatDomNodes([domModule]);
      return flatNodes;
    }

    return [];
  }

  public get customComponentsUsed(): any[] {
    let domModule = this.domModuleNode;

    if (domModule) {
      let flatNodes = this._getFlatDomNodes([domModule]);
      flatNodes.splice(0, 1);

      let qResult = objQuery.where(flatNodes, {
        'name': /(-)/
      });

      return qResult;
    }

    return [];
  }

  public get usingComponentRefs(): HTMLFileParser[] {
    let usingCompRefs: HTMLFileParser[] = [];
    let foundUniqueComponents: any = {};

    let _compIternNodes = this.customComponentsUsed;

    if (_compIternNodes) {
      for (let i = 0; i < _compIternNodes.length; i++) {
        let _internElName = _compIternNodes[i].name;

        if (foundUniqueComponents[_internElName]) {
          continue;
        }

        let foundRefs = objQuery.where(CacheStorage.Instance.appComponents, {
          '_componentName': _internElName
        });

        if (foundRefs && foundRefs.length) {
          foundUniqueComponents[_internElName] = true;
          usingCompRefs.push(foundRefs[0]);
        } else {
          let foundRefs = objQuery.where(CacheStorage.Instance.externalComponents, {
            '_componentName': _internElName
          });

          if (foundRefs && foundRefs.length) {
            foundUniqueComponents[_internElName] = true;
            usingCompRefs.push(foundRefs[0]);
          }
        }
      }
    }

    return usingCompRefs;
  }

  constructor(filePath: FilePath) {
    super(filePath);
  }

  private _getFlatDomNodes(rootNode?: any): any[] {
    rootNode = rootNode || this.domInfo;
    let _nodes = [];
    let getChildrenRecursive = (obj) => {
      if (obj.type === 'text') {
        return;
      }

      let result = null;
      if ((obj.children) && (obj.children.length > 0)) {
        _nodes.push(obj);
        result = flatMapDeep(obj.children, getChildrenRecursive);
      } else {
        result = obj;
      }

      if ((result) && (!result.length)) {
        _nodes.push(result);
      }
    };

    flatMapDeep(rootNode, getChildrenRecursive);
    return _nodes;
  }

  private _readEssentialDomInfo() {
    let domModule: any = this.domModuleNode;

    if (domModule) {
      this._componentName = domModule.attribs.id;
      this._isPolymerComponent = true;
    }
  }

  public parseContent(): Thenable<FileParser> {
    return new Promise((resolve, reject) => {
      this.filePath.readFileContent().then((htmlContent) => {
        try {
          var clean = minify(htmlContent, {
            collapseWhitespace: true,
            ignoreCustomFragments: [],
            removeComments: true
          });

          var handler = new DomHandler((error, dom) => {
            if (!error) {
              this.domInfo = dom;
              this._readEssentialDomInfo();
              resolve(this);
            } else {
              reject({ sender: this, error: error });
            }
          });

          var _parser = new htmlparser.Parser(handler);

          _parser.write(clean);
          _parser.end();
        } catch (ex) {
          reject({ sender: this, error: ex });
        }      
      });
    });
  }
}