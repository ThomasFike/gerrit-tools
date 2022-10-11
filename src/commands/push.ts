import * as vscode from 'vscode';
import * as utils from '../utils';
import * as pick from '../pick';
import { PushFlags, PushFlagsStrings, PushFlagsPickOptions } from '../types';
import { TASK_NAME, CURRENT_BRANCH_ICON } from '../extension';
import { execSync } from 'child_process';

export function push(path: string) {
    utils.fetch(path);
    const list = utils.getOriginBranches(path);
    utils.setCurrentBranchStr(utils.getCurrentBranch(path));
    let x: [boolean, string] = utils.isTopCommitPushed(path);
    if (utils.lastQuerry.wip === undefined) {
        utils.lastQuerry.wip = false;
    }
    if (utils.lastQuerry.private === undefined) {
        utils.lastQuerry.private = false;
    }

    if (x[0]) {
        console.log(x[1]);
        const currentHash = execSync("git rev-parse HEAD", { cwd: path }).toString().trim();
        console.log(currentHash);
        if (currentHash === utils.lastQuerry.currentPatchSet.revision) {
            vscode.window.showErrorMessage("Commit is already pushed.");
            return;
        }
        pushToBranch(utils.lastQuerry.branch, path);
    } else {
        console.log("not found");
        vscode.window.showQuickPick(pick.makeBranchesQuickPick(list), { canPickMany: false, title: "Select the branch to push to" }).then(branch => {
            if (branch !== undefined) {
                const branchName: string = branch!.label;
                pushToBranch(branchName, path);
            } else {
                vscode.window.showErrorMessage("No Branch Selected");
            }
        });
    }

}

function pushViaTask(args: string[], path: string): Thenable<vscode.TaskExecution> {
    const shell = new vscode.ShellExecution("git", args, { cwd: path });
    const task = new vscode.Task({ type: 'gerrit' }, vscode.TaskScope.Workspace, TASK_NAME, "gerrit", shell);
    task.presentationOptions = { reveal: vscode.TaskRevealKind.Never };
    return vscode.tasks.executeTask(task);
}

function pushToBranch(branchName: string, path: string) {
    vscode.window.showQuickPick(pick.makePushFlagsQuickPick(), { canPickMany: false, title: "Select push options" }).then(flagSelection => {
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
}