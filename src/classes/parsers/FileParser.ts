import { FilePath } from '../io/FilePath';

export abstract class FileParser {
  private _filePath: FilePath = null;
  public get filePath() {
    return this._filePath;
  }

  constructor (filePath: FilePath) {
    this._filePath = filePath;
  }

  public abstract parseContent(): Thenable<FileParser>;
}