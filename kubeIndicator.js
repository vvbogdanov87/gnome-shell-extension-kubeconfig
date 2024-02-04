import St from 'gi://St';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import { KubePopupMenuItem } from './kubePopupMenuItem.js';
import { KubectlConfig } from './kubectl.js';


export const KubeIndicator = GObject.registerClass({ GTypeName: 'KubeIndicator' },
    class KubeIndicator extends PanelMenu.Button {
        _init(extensionObject) {
            super._init(null, "Kube");
            this._extensionObject = extensionObject
            this._settings = this._extensionObject.getSettings();

            this._monitors = [];

            this._setView()

            let kConfigFiles = [];

            if (GLib.getenv('KUBECONFIG') !== null) {
                // we expect absolute paths in KUBECONFIG
                kConfigFiles = GLib.getenv('KUBECONFIG').split(':');
            }
            else {
                // monitor for default kubeconfig file.
                kConfigFiles.push(GLib.get_home_dir() + "/.kube/config");
            }

            for (const kConfigFile of kConfigFiles) {
                const kcFile = Gio.File.new_for_path(kConfigFile);
                const monitor = kcFile.monitor(Gio.FileMonitorFlags.NONE, null);
                this._monitors.push(monitor);
                monitor.connect('changed', this._onChange.bind(this));
            }

            this._bindSettingsChanges();
        }

        _onChange(m, f, of, eventType) {
            if (eventType === Gio.FileMonitorEvent.CHANGED) {
                this._update()
            }
        }

        async _update() {
            this.menu.removeAll();
            try {
                let currentContext = await KubectlConfig.getCurrentContext();

                if (this._settings.get_boolean('show-current-context') === true) {
                    this.label.text = currentContext;
                }

                const contexts = await KubectlConfig.getContexts();

                for (const context of contexts) {
                    this.menu.addMenuItem(
                        new KubePopupMenuItem(this._extensionObject, context, context === currentContext)
                    );
                }

                // add seperator to popup menu
                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

                // add link to settings dialog
                this._menu_settings = new PopupMenu.PopupMenuItem(_("Settings"));
                this._menu_settings.connect("activate", (_item, _event) =>
                    this._extensionObject.openPreferences());
                this.menu.addMenuItem(this._menu_settings);
            } catch (e) {
                console.error(`${this._extensionObject.metadata.uuid}: ${e}`);
            }
        }

        _setView() {
            this.remove_all_children();
            if (this._settings.get_boolean('show-current-context') === false) {
                let gicon = Gio.icon_new_for_string(this._extensionObject.path + '/icons/logo.svg');
                this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon' });
                this.add_actor(this.icon);
            } else {
                this.label = new St.Label({
                    text: _("kubectl"),
                    y_align: Clutter.ActorAlign.CENTER
                });
                this.add_actor(this.label);
            }
            this._update();
        }

        _bindSettingsChanges() {
            this._settings.connect('changed::show-current-context', () => {
                this._setView();
            });
        }
    });
