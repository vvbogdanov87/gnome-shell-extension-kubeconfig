const Lang = imports.lang;
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const KubePopupMenu = Me.imports.kubePopupMenu;

const KubeIndicator = new Lang.Class({
    Name: "Kube",
    Extends: PanelMenu.Button,

    _init: function(metadata, params) {
        this.parent(null, "Kube");
        
        this.icon = new St.Icon({
            icon_name: 'logo',
            style_class: 'system-status-icon'
        });
        this.actor.add_actor(this.icon);

        this.setMenu(new KubePopupMenu.KubePopupMenu(this.actor, 0.25, St.Side.TOP));
        
        this.actor.connect("button-press-event", Lang.bind(this, this.update));
    },
    update: function() {
        this.menu.update();
    }
});