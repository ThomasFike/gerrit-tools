import { execSync } from 'child_process';
import * as vscode from 'vscode';
import { sshDetails } from './sshDetails';

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

function getTopChangeId(path: string): string {
    let result = execSync("git log --pretty=format:'%(trailers:only,unfold)' HEAD~1..HEAD", {
        cwd: path
    });
    const change_id_regex = new RegExp("Change-Id:\\s*(\\S*)", "gmi");

    let m;
    let str: string = result.toString();
    let changeId: string = "";
    while ((m = change_id_regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === change_id_regex.lastIndex) {
            change_id_regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            if (groupIndex === 1) {
                changeId = match;
            }
        });
    }
    return changeId;
}

interface account {
    name: string;
    email: string;
    username: string;
}

interface message {
    timestamp: number;
    reviewer: account;
    message: string;
}

interface trackingId {
    system: string;
    id: number;
}

interface patchSet {
    number: number;
    revision: string;
    parents: Array<string>;
    ref: string;
    uploader: account;
    author: account;
    createdOn: number;
    kind: string;
    sizeInsertions: number;
    sizeDeletions: number;
}

interface change {
    project: string;
    branch: string;
    tag: string;
    id: string;
    number: number;
    subject: string;
    owner: account;
    url: string;
    commitMessage: string;
    hashtags: string;
    createdOn: number;
    lastUpdated: number;
    open: boolean;
    status: string;
    private: boolean;
    wip: boolean;
    comments: Array<message>;
    trackingIds: Array<trackingId>;
    currentPatchSet: patchSet;
    allReviwers: Array<account>;
}

export var lastQuerry: change;

export function isTopCommitPushed(path: string): [boolean, string] {
    const changeId: string = getTopChangeId(path);

    let ssh = new sshDetails;
    ssh.get_from_git(path);
    let result = execSync("ssh -p " + ssh.port.toString() + " " + ssh.address
        + " gerrit query --format JSON --current-patch-set " + changeId,
        { cwd: path });
    console.log(result.toString());
    let res: change = JSON.parse(result.toString().split('\n')[0]);
    lastQuerry = res;
    if (res.branch === undefined) {
        return [false, ""];
    } else {
        return [true, res.branch];
    }
}