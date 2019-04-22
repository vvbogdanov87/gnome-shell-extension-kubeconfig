const Lang = imports.lang;
const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;

var KubePopupMenuItem = class extends PopupMenu.PopupBaseMenuItem {
    constructor(text,selected, params) {
        super(params);
		this.text = text;
        this.selected = selected;
		this.box = new St.BoxLayout({ style_class: 'popup-combobox-item' });

        if( this.selected == true ) {
            let gicon = Gio.icon_new_for_string( Me.path + '/icons/ball.svg' );
            this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon', icon_size: 16 });
            this.box.add(this.icon);
            this.text = " " + this.text
        }

        this.label = new St.Label({ text: this.text });
		this.box.add(this.label);
        
        this.actor.add_child(this.box);

        this.connect("activate", Lang.bind(this, function(){
            let path = GLib.get_home_dir() + "/.kube/config";
            try {
                let contents = String(GLib.file_get_contents(path)[1]);
                let re = new RegExp('current-context:\\s(.+)','gm');
                contents = contents.replace(re,'current-context: '+this.text.trim());
                GLib.file_set_contents(path, contents);
            } catch (e) {
                log('gnome-shell-extension-kubeconfig',e);
            }
        }));
	}
};