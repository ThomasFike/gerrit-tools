import * as vscode from 'vscode';
import { CURRENT_BRANCH_ICON, settings } from './extension';
import { PushFlagsPickOptions } from './types';
import * as utils from './utils';

export function makeBranchesQuickPick(branches: string[]): vscode.QuickPickItem[] {
    let list: vscode.QuickPickItem[] = [];
    branches = branches.sort(function (a, b) { return a.localeCompare(b); });
    branches.forEach(branch => {
        if (branch === utils.currentBranchStr) {
            list.splice(0, 0, { label: CURRENT_BRANCH_ICON + branch }, { label: "Other Branches", kind: vscode.QuickPickItemKind.Separator });
        } else {
            list.push({ label: branch });
        }
    });
    return list;
}

export function makePushFlagsQuickPick(): vscode.QuickPickItem[] {
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