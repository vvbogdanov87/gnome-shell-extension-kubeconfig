import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { Kubectl } from './kubectl.js';


export const KubePopupMenuItem = GObject.registerClass(
    {
        GTypeName: 'KubePopupMenuItem'
    },
    class extends PopupMenu.PopupMenuItem {
        /**
         * @param {Extension} extensionObject
         * @param {String} text
         * @param {boolean} selected
         * @param {Object} params : PopupBaseMenuItem additional item properties (https://gjs.guide/extensions/topics/popup-menu.html#popupbasemenuitem)
         */
        constructor(extensionObject, text, selected, params) {
            super(text.trim(), params);
            this._extensionObject = extensionObject;

            // FIXME: How to know if item is already disposed?
            this._destroyed = false;

            // current context ornament
            if (selected === true) {
                this.setOrnament(PopupMenu.Ornament.DOT);
                //this.setOrnament(PopupMenu.Ornament.CHECK);
            } else {
                this.setOrnament(PopupMenu.Ornament.NONE);
            }
            this.connect('destroy', this._onDestroy.bind(this));

            // initialize cluster status icon
            this._clusterStatusIcon = null;
            this._setClusterStatusIcon('network-error-symbolic');

            // connect signal
            this.connect("activate", (_item, _event) => {
                Kubectl.useContext(this.label.get_text());
            });

            // update cluster status, i.e. cluster status icon
            this._updateClusterStatus().catch(e => console.error(e));

            // ... and schedule status update each 5 seconds
            // TODO: make timer configurable in extension settings and/or
            //       based on device power settings.
            this._timerid = GLib.timeout_add(
                GLib.PRIORITY_DEFAULT,
                5000,
                () => this._updateClusterStatus().catch(e => console.error(e))
            );
        }

        async _updateClusterStatus() {
            const status = await Kubectl.clusterIsReachable(this.label.get_text());
            if (this._destroyed) {
                return;
            }
            if (status) {
                this._setClusterStatusIcon('network-transmit-receive-symbolic');
            } else {
                this._setClusterStatusIcon('network-error-symbolic');
            }
        }

        /**
         * Set cluster status icon.
         *
         * @param {String} iconName
         */
        _setClusterStatusIcon(iconName) {
            if (this._clusterStatusIcon === null) {
                this._clusterStatusIcon = new St.Icon({
                    icon_name: iconName,
                    style_class: 'popup-menu-icon',
                    x_align: Clutter.ActorAlign.END,
                    x_expand: true,
                    y_expand: true,
                });
                this.add_child(this._clusterStatusIcon);
            } else {
                this._clusterStatusIcon.set_icon_name(iconName);
            }
        }

        _onDestroy() {
            this._destroyed = true;
            this._stopClusterPoll();
        }
    });
