import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { KubeIndicator } from './kubeIndicator.js';

export default class KubeConfigExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this.kube = new KubeIndicator(this);
        Main.panel.addToStatusArea("Kube", this.kube);
    }

    disable() {
        this.kube.destroy();
        this.kube = null;
        this._settings = null;
    }
}