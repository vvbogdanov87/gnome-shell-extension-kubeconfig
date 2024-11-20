import St from 'gi://St';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import { KubePopupMenuItem } from './kubePopupMenuItem.js';
import { Kubectl } from './kubectl.js';
import { throttle } from './utils.js';


export const KubeIndicator = GObject.registerClass({ GTypeName: 'KubeIndicator' },
    class KubeIndicator extends PanelMenu.Button {
        _init(extensionObject) {
            super._init(null, "Kube");
            this._extensionObject = extensionObject
            this._extensionUuid = extensionObject.metadata.uuid;
            this._settings = this._extensionObject.getSettings();

            this._monitors = [];

            this._buildMenu();

            this._setView();

            let kConfigFiles = [];

            if (GLib.getenv('KUBECONFIG') !== null) {
                // we expect absolute paths in KUBECONFIG
                kConfigFiles = GLib.getenv('KUBECONFIG').split(':');
            }
            else {
                // monitor for default kubeconfig file.
                kConfigFiles.push(GLib.get_home_dir() + "/.kube/config");
            }

            // A throttled function listening file changes is needed because some editor save
            // multiple times, e.g. Sublime Text, and this broke interface
            const throttledOnKcFileChange = throttle(this._onKcFileChange.bind(this), 500);
            for (const kConfigFile of kConfigFiles) {
                const kcFile = Gio.File.new_for_path(kConfigFile);
                const monitor = kcFile.monitor(Gio.FileMonitorFlags.NONE, null);
                this._monitors.push(monitor);
                monitor.connect('changed', (...args) => throttledOnKcFileChange(...args));
            }

            this._bindSettingsChanges();
        }

        _onKcFileChange(m, f, of, eventType) {
            if (eventType === Gio.FileMonitorEvent.CHANGED) {
                this._update();
            }
        }

        _buildMenu() {
            // contexts list section menu
            this.contextsMenuSection = new PopupMenu.PopupMenuSection();
            this.menu.addMenuItem(this.contextsMenuSection);

            // add seperator to popup menu
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // add actions section menu
            const actionsSection = new PopupMenu.PopupMenuSection();
            const actionsBox = new St.BoxLayout({ vertical: false, style_class: 'popup-menu-ornament' });
            actionsSection.actor.add_child(actionsBox);
            this.menu.addMenuItem(actionsSection);

            // a space
            actionsBox.add_child(new St.BoxLayout({ x_expand: true }));

            // actions: add link to settings dialog
            const settingsMenuItem = new PopupMenu.PopupMenuItem('');
            settingsMenuItem.add_child(
                new St.Icon({
                    icon_name: 'emblem-system-symbolic',
                    style_class: 'popup-menu-icon',
                })
            );
            settingsMenuItem.connect("activate", (_item, _event) =>
                this._extensionObject.openPreferences()
            );
            actionsBox.add_child(settingsMenuItem);
        }

        async _update() {
            this.contextsMenuSection.removeAll();
            try {
                const currentContext = await Kubectl.getCurrentContext();

                if (this._settings.get_boolean('show-current-context') === true) {
                    this.label.text = currentContext;
                }

                const contexts = await Kubectl.getContexts();

                for (const context of contexts) {
                    const item = new KubePopupMenuItem(this._extensionObject, context, context === currentContext);
                    this.contextsMenuSection.addMenuItem(item);
                }
            } catch (e) {
                console.error(`${this._extensionObject.metadata.uuid}: ${e}`);
            }
        }

        _setView() {
            this.remove_all_children();
            if (this._settings.get_boolean('show-current-context') === false) {
                let gicon = Gio.icon_new_for_string(this._extensionObject.path + '/icons/logo.svg');
                this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon' });
                this.add_child(this.icon);
            } else {
                this.label = new St.Label({
                    text: _("kubectl"),
                    y_align: Clutter.ActorAlign.CENTER
                });
                this.add_child(this.label);
            }
            this._update();
        }

        _bindSettingsChanges() {
            this._settings.connect('changed::show-current-context', () => {
                this._setView();
            });
        }

        destroy() {
            super.destroy();
            for (const monitor of this._monitors) {
                monitor.cancel();
            }
            this._monitors = [];
        }
    });
