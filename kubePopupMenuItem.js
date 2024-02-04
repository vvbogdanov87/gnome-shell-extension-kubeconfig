import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import St from 'gi://St';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { KubectlConfig } from './kubectl.js';


export const KubePopupMenuItem = GObject.registerClass(
    {
        GTypeName: 'KubePopupMenuItem'
    },
    class extends PopupMenu.PopupBaseMenuItem {
        constructor(extensionObject, text, selected, params) {
            super(params);
            this._extensionObject = extensionObject;
            this.text = text;
            this.selected = selected;
            this.box = new St.BoxLayout({ style_class: 'popup-combobox-item' });

            if (this.selected === true) {
                let gicon = Gio.icon_new_for_string(this._extensionObject.path + '/icons/ball.svg');
                this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon', icon_size: 16 });
                this.box.add(this.icon);
                this.text = " " + this.text;
            }

            this.label = new St.Label({ text: this.text });
            this.box.add(this.label);

            this.add_child(this.box);

            this.connect("activate", () => {
                KubectlConfig.useContext(this.text.trim());
            });
        }
    });
