const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const KubePopupMenuItem = Me.imports.kubePopupMenuItem;

const KubePopupMenu = new Lang.Class({
	Name: 'PopupMenu',
	Extends: PopupMenu.PopupMenu,

	_init: function(sourceActor, arrowAlignment, arrowSide) {
        this.parent(sourceActor, arrowAlignment, arrowSide);

        this.ppItem1 = new KubePopupMenuItem.KubePopupMenuItem("production",false);
        this.ppItem2 = new KubePopupMenuItem.KubePopupMenuItem("staging",true);

        this.addMenuItem(this.ppItem1);
        this.addMenuItem(this.ppItem2);
    }
});