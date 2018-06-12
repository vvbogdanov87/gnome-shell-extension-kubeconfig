const Lang = imports.lang;
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const KubePopupMenuItem = Me.imports.kubePopupMenuItem;

const KubeIndicator = new Lang.Class({
    Name: "Kube",
    Extends: PanelMenu.Button,

    _init: function(metadata, params) {
        this.parent(null, "Kube");
        this.kcPath = GLib.get_home_dir() + "/.kube/config";

        this.icon = new St.Icon({
            icon_name: 'logo',
            style_class: 'system-status-icon'
        });
        this.actor.add_actor(this.icon);

        this.setMenu(new PopupMenu.PopupMenu(this.actor, 0.25, St.Side.TOP));
        this._update();

        let kcFile = Gio.File.new_for_path(this.kcPath);
        this._monitor = kcFile.monitor(Gio.FileMonitorFlags.NONE, null);
        this._monitor.connect('changed', Lang.bind(this, this._update));
    },
    _onChange: function(m, f, of, eventType) {
        if (eventType == Gio.FileMonitorEvent.CHANGED){
            this._update()
        }
    },
    _update: function() {
        this.menu.removeAll()
        try {
            let contents = String(GLib.file_get_contents(this.kcPath)[1]);
            let re = new RegExp('current-context:\\s(.+)','gm');
            let match = re.exec(contents);
            let currentContext = '';
            if (match != null){
                currentContext = match[1];
            }

            re = new RegExp('-\\scontext:\\n.*\\n.*\\n.*name:\\s(.*)','gm');
            match = re.exec(contents);
            while (match != null) {
                let curr = false;
                if (match[1]==currentContext){
                    curr = true;
                }
                this.menu.addMenuItem(new KubePopupMenuItem.KubePopupMenuItem(match[1],curr));         
                match = re.exec(contents);
            }
        } catch (e) {
            log('gnome-shell-extension-kubeconfig',e);
        }
    }
});