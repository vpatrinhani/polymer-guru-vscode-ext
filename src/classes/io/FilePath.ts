import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class FilePath {
  protected _absolutePath: string;
  protected _relativePath: string;
  
  public get absolutePath(): string {
    return this._absolutePath;
  }
  public get relativePath(): string {
    return this._relativePath;
  }
  public get previewUri() {
    return encodeURI('command:vscode.open?' + JSON.stringify(vscode.Uri.file(this.absolutePath)));
  }

  constructor (absolutePath?: string, relativePath?: string) {
    this._absolutePath = absolutePath || path.join(vscode.workspace.rootPath, relativePath);
    this._relativePath = relativePath || absolutePath.replace(vscode.workspace.rootPath + '/', '');
  }

  public parsePath(): path.ParsedPath {
    return path.parse(this.absolutePath);
  }

  public readFileContent(): Thenable<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.absolutePath, 'utf-8', (err, content) => {
        if (err) {
          reject(err);
        }
        resolve(content);
      });
    });
  }

  public static createFor(absolutePath?: string, relativePath?: string): FilePath {
    return new FilePath(absolutePath, relativePath);
  }
}