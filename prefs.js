const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.lib.convenience;

let settings;

function init() {
    settings = Convenience.getSettings();
}

function option() {
    let hBox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
    let hbLabel = new Gtk.Label({label: "show current context", xalign: 0});
    let hbSwitch = new Gtk.Switch();

    settings.bind('show-current-context',
        hbSwitch,
        'active',
        Gio.SettingsBindFlags.DEFAULT);

    hBox.pack_start(hbLabel,false, false, 0);
    hBox.pack_end(hbSwitch,false, false, 0);
    
    return hBox;
}

function buildPrefsWidget() {
	let window = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });
    window.add(option())

    window.show_all();

	return window;
}