// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { exec, execSync } from 'child_process';
import { stringify } from 'querystring';
import * as vscode from 'vscode';

let DEBUG = false;
const TASK_NAME = "gerrit-tools";
const CURRENT_BRANCH_ICON = "$(star) ";

var currentBranch = "";

enum PushFlags {
	NONE,
	WIP,
	PRIVATE,
	READY,
	REMOVE_PRIVATE
}

const PushFlagsStrings: Map<PushFlags, string> = new Map<PushFlags, string>([
	[PushFlags.NONE, ""],
	[PushFlags.WIP, "%wip"],
	[PushFlags.PRIVATE, "%private"],
	[PushFlags.READY, "%ready"],
	[PushFlags.REMOVE_PRIVATE, "%remove-private"]
]);

const PushFlagsPickOptions: Map<string, PushFlags> = new Map<string, PushFlags>([
	["None", PushFlags.NONE],
	["Work in Progress", PushFlags.WIP],
	["Private", PushFlags.PRIVATE],
	["Remove Work in Progress", PushFlags.READY],
	["Remove Private", PushFlags.REMOVE_PRIVATE]
]);

type Settings = {
	push_defaultPushOption: PushFlags;
}

var settings: Settings = { push_defaultPushOption: PushFlags.NONE };

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	updateSettings();
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "gerrit-tools" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('gerrit-tools.pushToGerrit', () => {
		getWorkspaceFsPath().then(path => push(path!));
		// vscode.window.showQuickPick(["cool", "bar"], { canPickMany: true, title: "Select the branch to push to" });
	});
	context.subscriptions.push(disposable);
	disposable = vscode.workspace.onDidChangeConfiguration(updateSettings);
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }

function updateSettings() {
	console.log("Updating settings");
	let configuration = vscode.workspace.getConfiguration("gerrit-tools");
	if (configuration.has("push.defaultPushOption")) {
		settings.push_defaultPushOption = PushFlagsPickOptions.get(configuration.get("push.defaultPushOption")!)!;
	}
}

async function getWorkspaceFsPath() {
	if (vscode.workspace.workspaceFolders!.length > 1) {
		const workspaceFolder = await vscode.window.showWorkspaceFolderPick();
		if (workspaceFolder) {
			return workspaceFolder.uri.fsPath;
		} else {
			return '';
		}
	} else {
		return vscode.workspace.workspaceFolders![0].uri.fsPath;
	}
}

function fetch(path: string) {
	execSync("git fetch", {
		cwd: path
	});
}

function getOriginBranches(path: string): string[] {
	let result = execSync("git branch -r", {
		cwd: path
	});
	let branches = result.toString().split('\n');
	branches = branches.filter(line => { return (!line.includes("->") && (line.trimEnd().length > 1)); });
	branches = branches.filter(line => { return !line.includes("meta/config"); });
	let branchList: string[] = [];
	branches.forEach(name => {
		branchList.push(name.replace("origin/", "").trimStart().trimEnd());
	});
	return branchList;
}

function getCurrentBranch(path: string): string {
	let result = execSync("git branch --show-current", {
		cwd: path
	});
	return result.toString().trimStart().trimEnd().replace("origin/", "");
}

function makeBranchesQuickPick(branches: string[]): vscode.QuickPickItem[] {
	let list: vscode.QuickPickItem[] = [];
	branches = branches.sort(function (a, b) { return a.localeCompare(b); });
	branches.forEach(branch => {
		if (branch === currentBranch) {
			list.splice(0, 0, { label: CURRENT_BRANCH_ICON + branch }, { label: "Other Branches", kind: vscode.QuickPickItemKind.Separator });
		} else {
			list.push({ label: branch });
		}
	});
	return list;
}

function makePushFlagsQuickPick(): vscode.QuickPickItem[] {
	let list: vscode.QuickPickItem[] = [];
	for (let [option, enumVal] of PushFlagsPickOptions) {
		if (enumVal === settings.push_defaultPushOption) {
			list.splice(0, 0, { label: option });
		} else {
			list.push({ label: option });
		}
	}
	return list;
}

function push(path: string) {
	fetch(path);
	const list = getOriginBranches(path);
	currentBranch = getCurrentBranch(path);

	vscode.window.showQuickPick(makeBranchesQuickPick(list), { canPickMany: false, title: "Select the branch to push to" }).then(branch => {
		if (branch !== undefined) {
			const branchName: string = branch!.label;
			vscode.window.showQuickPick(makePushFlagsQuickPick(), { canPickMany: false, title: "Select push options" }).then(flagSelection => {
				let pushFlagsString: string = "";
				if (flagSelection !== undefined) {
					const flagStr: string = flagSelection!.label;
					const flag: PushFlags = PushFlagsPickOptions.get(flagStr)!;
					pushFlagsString = PushFlagsStrings.get(flag)!;
				}

				const pushString: string[] = ["push", "origin", "HEAD:refs/for/" + branchName.replace(CURRENT_BRANCH_ICON, "") + pushFlagsString];
				var taskEndSucscription = vscode.tasks.onDidEndTaskProcess((task) => {
					if (task.execution.task.name === TASK_NAME) {
						if (task.exitCode) {
							vscode.window.showErrorMessage("Failed to push", "Show").then(result => {
								if (result === undefined) {
									console.log("Dismissed Error");
								} else {
									console.log("Showed Terminal");
									vscode.window.terminals.forEach(term => {
										if (term.name === TASK_NAME) {
											term.show(false);
										}
									});
								}
							});
						} else {
							console.log("Push worked");
							vscode.window.showInformationMessage("Pushed to " + branchName.replace(CURRENT_BRANCH_ICON, "") + ".");
						}
					}
				});
				pushViaTask(pushString, path).then(executor => { var taskExecutor = executor; });
			});

		} else {
			vscode.window.showErrorMessage("No Branch Selected");
		}
	});

}

function pushViaTask(args: string[], path: string): Thenable<vscode.TaskExecution> {
	const shell = new vscode.ShellExecution("git", args, { cwd: path });
	const task = new vscode.Task({ type: 'gerrit' }, vscode.TaskScope.Workspace, TASK_NAME, "gerrit", shell);
	task.presentationOptions = { reveal: vscode.TaskRevealKind.Never };
	return vscode.tasks.executeTask(task);
}
