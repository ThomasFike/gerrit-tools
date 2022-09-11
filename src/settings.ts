import { PushFlags, PushFlagsPickOptions } from './types';
import * as vscode from 'vscode';

export class Settings {
    push_defaultPushOption: PushFlags;
    constructor() {
        this.push_defaultPushOption = this.push_defaultPushOption = PushFlags.NONE;
    };
    updateSettings() {
        let configuration = vscode.workspace.getConfiguration("gerrit-tools");
        if (configuration.has("push.defaultPushOption")) {
            this.push_defaultPushOption = PushFlagsPickOptions.get(configuration.get("push.defaultPushOption")!)!;
        }
    }
}
