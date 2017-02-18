import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as globule from 'globule';

import { CacheStorage } from '../storages/CacheStorage';
import { FilePath } from '../io/FilePath';

import { FileParser } from './FileParser';
import { HTMLFileParser } from './HTMLFileParser';

export class FileParserHelper {
  
  public static parseFile(filePath: string): Thenable<FileParser> {
    let isAbsolutePath: Boolean = (filePath.indexOf(vscode.workspace.rootPath) === 0);

    let filePathObj = (isAbsolutePath) ? FilePath.createFor(filePath) : FilePath.createFor(null, filePath);
    let pathParsed = filePathObj.parsePath();

    let fileParser: FileParser = null;

    if (pathParsed.ext === '.html') {
      fileParser = new HTMLFileParser(filePathObj);
    }

    if (fileParser) {
      return fileParser.parseContent();
    } else {
      return Promise.reject(null);
    }
  }

  public static parseFiles(filePaths: string[], parsedFileCallback: (parsedFile: FileParser) => void ): Thenable<FileParser[]> {
    let _parseFilePromises = [];
    for (var i = 0; i < filePaths.length; i++) {
      _parseFilePromises.push(this.parseFile(filePaths[i])
        .then((parsedFile) => {
          parsedFileCallback(parsedFile);
          return parsedFile;
        }, (rej) => {
          CacheStorage.Instance.failedResources.push({
            fileParser: rej.sender,
            error: rej.error
          });
        }));
    }
    return Promise.all(_parseFilePromises);
  }

  public static findFiles(pathMatches: string[]): string[] {
    return globule.find(
      pathMatches,
      { srcBase: vscode.workspace.rootPath });
  }

  public static parseAppComponents() : Thenable<FileParser[]> {
    CacheStorage.Instance.clearAppComponents();
    return new Promise((resolve, reject) => {
      this.parseFiles(
        this.findFiles(CacheStorage.Instance.config.appComponentsPathMatcher),
        (parsedFile) => {
          let htmlParsed = (parsedFile as HTMLFileParser);
          if ((htmlParsed) && (htmlParsed.isPolymerComponent)) {
            CacheStorage.Instance.appComponents.push(htmlParsed);
          } else if (parsedFile) {
            CacheStorage.Instance.otherResources.push(parsedFile);
          }
        })
        .then(resolve, reject);
    });
  }

  public static parseExternalComponents() : Thenable<FileParser> {
    CacheStorage.Instance.clearExternalComponents();
    return new Promise((resolve, reject) => {
      this.parseFiles(
        this.findFiles(CacheStorage.Instance.config.externalComponentsPathMatcher),
        (parsedFile) => {
          let htmlParsed = (parsedFile as HTMLFileParser);
          if ((htmlParsed) && (htmlParsed.isPolymerComponent)) {
            CacheStorage.Instance.externalComponents.push(htmlParsed);
          } else if (parsedFile) {
            CacheStorage.Instance.otherResources.push(parsedFile);
          }
        }).then(resolve, reject);
    });
  }
}