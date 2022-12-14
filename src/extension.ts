// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as utils from './utils';
import { Settings } from './settings';
import * as commands from './commands/push';

let DEBUG = false;

export const TASK_NAME = "gerrit-tools";
export const CURRENT_BRANCH_ICON = "$(star) ";
export var settings: Settings = new Settings();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	settings.updateSettings();
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "gerrit-tools" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('gerrit-tools.pushToGerrit', () => {
		utils.getWorkspaceFsPath().then(path => commands.push(path!));
	});
	context.subscriptions.push(disposable);
	disposable = vscode.workspace.onDidChangeConfiguration(settings.updateSettings);
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }



