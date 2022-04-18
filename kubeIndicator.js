const Lang = imports.lang;
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const ByteArray = imports.byteArray;
const GObject = imports.gi.GObject;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const KubePopupMenuItem = Me.imports.kubePopupMenuItem;

var KubeIndicator = GObject.registerClass ({GTypeName: 'KubeIndicator'},
    class KubeIndicator extends PanelMenu.Button {
    _init() {
        super._init(null, "Kube");
        this._settings = ExtensionUtils.getSettings();
        this.kcPath = GLib.get_home_dir() + "/.kube/config";

        this.setMenu(new PopupMenu.PopupMenu(this.actor, 0.25, St.Side.TOP));

        this._setView()

        let kcFile = Gio.File.new_for_path(this.kcPath);
        this._monitor = kcFile.monitor(Gio.FileMonitorFlags.NONE, null);
        this._monitor.connect('changed', Lang.bind(this, this._update));

        this._bindSettingsChanges();
    }

    _onChange(m, f, of, eventType) {
        if (eventType == Gio.FileMonitorEvent.CHANGED){
            this._update()
        }
    }

    _update() {
        this.menu.removeAll()
        try {
            let contents = ByteArray.toString(GLib.file_get_contents(this.kcPath)[1]);
            let re = new RegExp('current-context:\\s(.+)','gm');
            let match = re.exec(contents);
            let currentContext = '';
            if (match != null){
                currentContext = match[1];
                if ( this._settings.get_boolean('show-current-context') == true ){
                    this.label.text = currentContext;
                }
            }

            re = new RegExp('-\\scontext:(\\n.*){1,4}name:\\s(.*)','gm');
            match = re.exec(contents);
            while (match != null) {
                let curr = false;
                if (match[2]==currentContext){
                    curr = true;
                }
                this.menu.addMenuItem(new KubePopupMenuItem.KubePopupMenuItem(match[2],curr));
                match = re.exec(contents);
            }

            // add seperator to popup menu
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            
            // add link to settings dialog
            this._menu_settings = new PopupMenu.PopupMenuItem(_("Settings"));
            this._menu_settings.connect("activate", function(){
                // call gnome settings tool for this extension
                let app = Shell.AppSystem.get_default().lookup_app("org.gnome.Extensions.desktop");
                if( app!=null ) {
                    let info = app.get_app_info();
                    let timestamp = global.display.get_current_time_roundtrip();
                    info.launch_uris([Me.uuid], global.create_app_launch_context(timestamp, -1));
                }
            });
            this.menu.addMenuItem(this._menu_settings);
        } catch (e) {
            log('gnome-shell-extension-kubeconfig',e);
        }
    }

    _setView() {
        this.actor.remove_all_children();
        if ( this._settings.get_boolean('show-current-context') == false ){
            let gicon = Gio.icon_new_for_string( Me.path + '/icons/logo.svg' );
            this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon' });
            this.actor.add_actor(this.icon);
        } else {
            this.label = new St.Label({ text: _("kubectl"),
                y_align: Clutter.ActorAlign.CENTER });
            this.actor.add_actor(this.label);
        }
        this._update();
    }

    _bindSettingsChanges() {
        this._settings.connect('changed::show-current-context',Lang.bind(this, function() {
            this._setView();
        }));
    }
});
