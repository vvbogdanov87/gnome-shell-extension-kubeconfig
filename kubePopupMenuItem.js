import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import St from 'gi://St';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { KubectlConfig } from './kubectl.js';


export const KubePopupMenuItem = GObject.registerClass(
    {
        GTypeName: 'KubePopupMenuItem'
    },
    class extends PopupMenu.PopupMenuItem {
        constructor(extensionObject, text, selected, params) {
            super(text.trim(), params);
            this._extensionObject = extensionObject;
            // current context ornament
            if (selected === true) {
                this.setOrnament(PopupMenu.Ornament.DOT);
                //this.setOrnament(PopupMenu.Ornament.CHECK);
            } else {
                this.setOrnament(PopupMenu.Ornament.NONE);
            }
            // connect signal
            this.connect("activate", (_item, _event) => {
                Kubectl.useContext(this.label.get_text());
            });
        }
    });
