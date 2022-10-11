import { execSync } from 'child_process';

export class sshDetails {
    address: string;
    port: number;
    constructor(address = "", port = 29418) {
        this.address = address;
        this.port = port;
    }
    get_from_git(path: string): boolean {
        let result = execSync("git remote get-url --push origin", {
            cwd: path
        }).toString();
        let regex = new RegExp("ssh:\/*(\\S*):([0-9]*)", "gmi");
        let match;
        let str: string = result.toString();
        while ((match = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            match.forEach((match, groupIndex) => {
                if (groupIndex === 1) {
                    this.address = match;
                } else if (groupIndex === 2) {
                    this.port = parseInt(match);
                }
            });
        }
        if (this.address != "") {
            return true;
        } else {
            return false;
        }
    }

}