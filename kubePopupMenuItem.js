import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { Kubectl } from './kubectl.js';
import { throttle } from './utils.js';

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
            this._settings = this._extensionObject.getSettings();

            // TODO: How to know if item is already destroyed?
            this._destroyed = false;

            // current context ornament
            if (selected === true) {
                this.setOrnament(PopupMenu.Ornament.DOT);
                //this.setOrnament(PopupMenu.Ornament.CHECK);
            } else {
                this.setOrnament(PopupMenu.Ornament.NONE);
            }

            // connect signals
            this.connect("activate", (_item, _event) => {
                Kubectl.useContext(this.label.get_text());
            });
            this.connect('destroy', this._onDestroy.bind(this));

            // initialize cluster status icon
            this._clusterStatusIcon = null;
            this._setClusterStatusIcon('network-error-symbolic');

            // bind settings and start cluster polling
            this._timerid = null;
            this._bindSettingsChanges();
            // initial update because GLib.timeout_add_seconds call first time
            // after interval, not immediately
            this._updateClusterStatus().catch(e => console.error(`${this._extensionObject.uuid}: ${e}`));
            this._restartClusterPoll();
        }

        _bindSettingsChanges() {
            // limit too frequent updates
            const throttledClusterPoll = throttle(this._restartClusterPoll.bind(this), 500);
            this._settings.connect('changed::cluster-poll-interval-seconds', () => {
                throttledClusterPoll();
            });
        }

        _restartClusterPoll() {
            this._stopClusterPoll();

            this._timerid = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                this._settings.get_int('cluster-poll-interval-seconds'),
                () => this._updateClusterStatus().catch(e => console.error(`${this._extensionObject.uuid}: ${e}`))
            );
        }

        _stopClusterPoll() {
            if (this._timerid !== null) {
                if (GLib.source_remove(this._timerid)) {
                    this._timerid = null;
                } else {
                    console.error(`${this._extensionObject.uuid}: cannot remove timer ${this._timerid}`);
                }
            }
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
