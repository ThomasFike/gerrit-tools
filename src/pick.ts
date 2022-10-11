import * as vscode from 'vscode';
import { CURRENT_BRANCH_ICON, settings } from './extension';
import { PushFlagsPickOptions, PushFlags } from './types';
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
        if (pushFlagValid(enumVal)) {
            if (enumVal === settings.push_defaultPushOption) {
                list.splice(0, 0, { label: option });
            } else {
                list.push({ label: option });
            }
        }
    }
    return list;
}

function pushFlagValid(enumVal: PushFlags): boolean {
    console.log(utils.lastQuerry);
    switch (enumVal) {
        case PushFlags.NONE:
            return true;
        case PushFlags.WIP:
            return utils.lastQuerry.wip === false;
        case PushFlags.READY:
            return utils.lastQuerry.wip === true;
        case PushFlags.PRIVATE:
            return utils.lastQuerry.private === false;
        case PushFlags.REMOVE_PRIVATE:
            return utils.lastQuerry.private === true;
        default:
            console.log("error");
            return false;
            break;
    }

}