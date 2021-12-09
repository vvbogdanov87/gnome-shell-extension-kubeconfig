const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;


const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let settings;

function init() {
    settings = ExtensionUtils.getSettings();
}

function option() {
    let hBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });

    let hbLabel = new Gtk.Label({ label: "show current context " });
    let hbSwitch = new Gtk.Switch();

    settings.bind('show-current-context',
        hbSwitch,
        'active',
        Gio.SettingsBindFlags.DEFAULT);

    hBox.append(hbLabel);
    hBox.append(hbSwitch);

    return hBox;
}

function buildPrefsWidget() {
    let window = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10 });
    window.set_margin_top(20);
    window.set_margin_bottom(20);
    window.set_margin_start(20);
    window.set_margin_end(20);

    window.append(option());

    return window;
}
