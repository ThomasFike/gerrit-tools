import { execSync } from 'child_process';

export function fetch(path: string) {
    execSync("git fetch", {
        cwd: path
    });
}