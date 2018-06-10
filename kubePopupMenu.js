const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const KubePopupMenuItem = Me.imports.kubePopupMenuItem;

const KubePopupMenu = new Lang.Class({
	Name: 'PopupMenu',
	Extends: PopupMenu.PopupMenu,

	_init: function(sourceActor, arrowAlignment, arrowSide) {
        this.parent(sourceActor, arrowAlignment, arrowSide);
    },
    update: function() {
        this.removeAll()

        let path = GLib.get_home_dir() + "/.kube/config";
        try {
            let contents = String(GLib.file_get_contents(path)[1]);
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
                this.addMenuItem(new KubePopupMenuItem.KubePopupMenuItem(match[1],curr));         
                match = re.exec(contents);
            }
        } catch (e) {
            log('gnome-shell-extension-kubeconfig',e);
        }        
    },
});