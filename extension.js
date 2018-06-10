const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const KubeIndicator = Me.imports.kubeIndicator;

function init(extensionMeta) {
    let theme = imports.gi.Gtk.IconTheme.get_default();
	theme.append_search_path(extensionMeta.path + "/icons");
}

function enable() {
    Kube = new KubeIndicator.KubeIndicator();
    Main.panel.addToStatusArea("Kube", Kube);
}

function disable() {
    Kube.destroy();
    Kube = null;
}

