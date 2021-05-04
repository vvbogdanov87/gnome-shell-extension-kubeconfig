const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const KubeIndicator = Me.imports.kubeIndicator;

let Kube;

function enable() {
    Kube = new KubeIndicator.KubeIndicator();
    Main.panel.addToStatusArea("Kube", Kube);
}

function disable() {
    Kube.destroy();
    Kube = null;
}
