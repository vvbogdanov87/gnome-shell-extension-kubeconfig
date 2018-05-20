const Lang = imports.lang;
const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;

const KubePopupMenuItem = new Lang.Class({
	Name: 'PopupMenuItem',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function(text, selected, params) {
		this.parent(params);
		this.text = text;
		this.selected = selected;
		this.box = new St.BoxLayout({ style_class: 'popup-combobox-item' });

        if( this.selected == true ) {
            this.icon = new St.Icon({
                icon_name: 'kubernetes-logo',
                style_class: 'system-status-icon',
                icon_size: 16
            });
            this.box.add(this.icon);
            this.text = " " + this.text
        }

        this.label = new St.Label({ text: this.text });
		this.box.add(this.label);
        
        this.actor.add_child(this.box);
	},
});