'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { CacheStorage } from './classes/storages/CacheStorage';
import { PolymerGuruDashboardDocument } from './classes/views/PolymerGuruDashboard/Index';
import { PolyGuruContext } from './classes/PolyGuruContext';
import * as Data from './classes/data/PolyGuruConfig';

var _instance = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "polymer-guru" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposableInit = vscode.commands.registerCommand('polyguru.init', () => {        
        // The code you place here will be executed every time your command is executed
        let writeToFile = function (content: any) {
            let giFile = CacheStorage.configPath;

            fs.writeFileSync(giFile, 
                content, 
                {
                    encoding: 'utf-8'
                });
        }

        if (!PolyGuruContext.isEnabled) {
            writeToFile(JSON.stringify(new Data.PolyGuruConfig(), null, 2));
            _instance = PolyGuruContext.Instance;
            vscode.window.showInformationMessage('Polymer Guru initialized!');
        } else {
            vscode.window.showInformationMessage('Polymer Guru was already initialized!');
        }
    });
    context.subscriptions.push(disposableInit);

    let disposableCheckComponents = vscode.commands.registerCommand('polyguru.checkComponents', () => {        
        if (PolyGuruContext.isEnabled) {
            PolyGuruContext.Instance.checkComponents();
        }
    });
    context.subscriptions.push(disposableCheckComponents);

    let providerViewDashboard = new PolymerGuruDashboardDocument(() => {
        return {
            appComponents: PolyGuruContext.Instance.cache.appComponents,
            externalComponents: PolyGuruContext.Instance.cache.externalComponents
        }
    });
    let registrationViewDashboard = vscode.workspace.registerTextDocumentContentProvider(PolymerGuruDashboardDocument.schema, providerViewDashboard);
    let disposableViewDashboard = vscode.commands.registerCommand('polyguru.viewDashboard', () => {    
        return PolyGuruContext.Instance.viewDashboard();
    });
    context.subscriptions.push(disposableViewDashboard, registrationViewDashboard);

    if (PolyGuruContext.isEnabled) {
        _instance = PolyGuruContext.Instance;
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}