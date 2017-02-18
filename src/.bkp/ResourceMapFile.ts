import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as htmlparser from 'htmlparser2';
import * as sanitizeHtml from 'sanitize-html';
import { minify } from 'html-minifier';
import * as objQuery from 'simple-object-query';
import * as jsonQuery from 'json-query';
import * as flatMapDeep from 'lodash.flatmapdeep';

export abstract class ResourceMapFile {
  protected _filePath: string;
  protected _relativePath: string;
  
  public get filePath(): string {
    return this._filePath;
  }
  public get relativePath(): string {
    return this._relativePath;
  }

  public get previewUri() {
    return encodeURI('command:vscode.open?' + JSON.stringify(vscode.Uri.file(this._filePath)));
  }

  constructor(filePath: string, relativePath: string) {
    this._filePath = filePath;
    this._relativePath = relativePath;
  }
}

export class HTMLResMapFile extends ResourceMapFile {
  public domInfo: any[] = [];

  private _isPolymerComponent: Boolean = false;
  public get isPolymerComponent(): Boolean {
    return this._isPolymerComponent;
  }

  private _componentName: string;
  public get componentName(): string {
    return this._componentName;
  }

  public get linkImports() : any[] {
    let flatNodes = this._getFlatDomNodes();

    let qResult = objQuery.where(flatNodes, {
        'name': /(link)/,
        'attribs.rel': /(import)/
    });

    for (let i=0; i < qResult.length; i++) {
      let linkImport = qResult[i];

      let workspacePath = vscode.workspace.rootPath;
      let linkPath = linkImport.attribs.href;

      let patht01 = path.resolve(this.filePath, linkPath);
      let patht02 = path.resolve(workspacePath, linkPath);
      let patht03 = path.resolve(path.dirname(this.filePath), linkPath);

      console.log(patht01, patht02, patht03);
    }

    return qResult;
  }

  public get domModuleNode() : any {
    let flatNodes = this._getFlatDomNodes();

    let qResult = objQuery.where(flatNodes, {
        'name': /(dom-module)/
    });

    return (qResult && qResult.length > 0) ? qResult[0] : null;
  }

  public get componentInternalNodes() : any[] {
    let domModule = this.domModuleNode;

    if (domModule) {
      let flatNodes = this._getFlatDomNodes([ domModule ]);
      return flatNodes;
    }

    return [];
  }

  public get customComponentsUsed() : any[] {
    let domModule = this.domModuleNode;

    if (domModule) {
      let flatNodes = this._getFlatDomNodes([ domModule ]);
      flatNodes.splice(0,1);

      let qResult = objQuery.where(flatNodes, {
          'name': /(-)/
      });

      return qResult;
    }

    return [];
  }

  public usingComponentReferencesCallback: () => HTMLResMapFile[];

  public get usingComponentRefs(): HTMLResMapFile[] {
    if (this.usingComponentReferencesCallback) {
      return this.usingComponentReferencesCallback();
    }

    return [];
  }

  constructor(filePath: string, relativePath: string) {
    super(filePath, relativePath);
  }

  private _getFlatDomNodes(rootNode?: any) : any[] {
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
      // console.log(qResult);
    }
  }

  public parseInfo(): Thenable<HTMLResMapFile> {
    return new Promise((resolve, reject) => {
      fs.readFile(this._filePath, 'utf-8', (err, html) => {
        try {
          var clean = minify(html, {
            collapseWhitespace: true,
            ignoreCustomFragments: [],
            removeComments: true
          });

          var handler = new htmlparser.DomHandler((error, dom) => {
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
        } catch(ex) {
          reject({ sender: this, error: ex });
        }
      });
    });
  }
}