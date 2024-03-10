import GLib from 'gi://GLib';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { execCommunicateAsync } from './commandLineUtil.js';

class BaseKubectl {
    static _kubectlExes = ['kubectl', 'oc'];
    static _kubectlExe = null;

    /**
     *
     * @param {Extension} extension
     */
    static init(uuid) {
        this._extensionUUID = uuid;

        // ensure one executable is installed
        for (const exe of this._kubectlExes) {
            if (GLib.find_program_in_path(exe) !== null) {
                this._kubectlExe = exe;
                return;
            }
        }

        // alert user on missing executable
        Main.notifyError(this._extensionUUID, _(`${this._kubectlExes.join(_(' or '))} not in PATH`));
    }
}

export class KubectlConfig extends BaseKubectl {

    /**
     * Get kubeconfg contexts
     *
     * @returns {Promise<String[]>}
     */
    static async getContexts() {
        if (this._kubectlExe === null) {
            return [];
        }

        const argv = [KubectlConfig._kubectlExe, 'config', 'get-contexts', '-oname'];
        try {
            const output = await execCommunicateAsync(argv);
            const lines = output.split('\n');
            return lines;
        } catch (e) {
            Main.notifyError(this._extensionUUID, _(`cannot retrieve kubeconfig contexts: ${e}`));
            return [];
        }
    }

    /**
     * Get kubeconfg current-context
     *
     * @returns {Promise<string>}
     */
    static async getCurrentContext() {
        if (this._kubectlExe === null) {
            return "";
        }

        const argv = [KubectlConfig._kubectlExe, 'config', 'current-context'];
        try {
            return await execCommunicateAsync(argv);
        } catch (e) {
            Main.notifyError(this._extensionUUID, _(`cannot retrieve current kubeconfig contexts: ${e}`));
            return "";
        }
    }

    /**
     * Set kubeconfg use-context
     *
     * @param {Promise<boolean>} context
     */
    static async useContext(context) {
        if (this._kubectlExe === null) {
            return false;
        }

        const argv = [KubectlConfig._kubectlExe, 'config', 'use-context', `${context}`];
        try {
            await execCommunicateAsync(argv);
            return true;
        } catch (e) {
            Main.notifyError(this._extensionUUID, _(`cannot set kubeconfig context '${context}': ${e}`));
            return false;
        }
    }
}
