import { execSync } from 'child_process';
import * as vscode from 'vscode';

export function fetch(path: string) {
    execSync("git fetch", {
        cwd: path
    });
}

export async function getWorkspaceFsPath() {
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

export function getOriginBranches(path: string): string[] {
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

export function getCurrentBranch(path: string): string {
    let result = execSync("git branch --show-current", {
        cwd: path
    });
    return result.toString().trimStart().trimEnd().replace("origin/", "");
}

export var currentBranchStr = "";

export function setCurrentBranchStr(str: string): void {
    currentBranchStr = str;
}