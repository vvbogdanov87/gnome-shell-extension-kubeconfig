import St from 'gi://St';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

import { KubePopupMenuItem } from './kubePopupMenuItem.js';
import { Yaml } from './lib/yaml/Yaml.js';

export var KubeIndicator = GObject.registerClass({ GTypeName: 'KubeIndicator' },
    class KubeIndicator extends PanelMenu.Button {
        _init(extensionObject) {
            super._init(null, "Kube");
            this._extensionObject = extensionObject
            this._settings = this._extensionObject.getSettings();
            this.kcPath = GLib.get_home_dir() + "/.kube/config";

            this._setView()

            let kcFile = Gio.File.new_for_path(this.kcPath);
            this._monitor = kcFile.monitor(Gio.FileMonitorFlags.NONE, null);
            this._monitor.connect('changed', this._update.bind(this));

            this._bindSettingsChanges();
        }

        _onChange(m, f, of, eventType) {
            if (eventType == Gio.FileMonitorEvent.CHANGED) {
                this._update()
            }
        }

        _update() {
            this.menu.removeAll()
            try {
                const td = new TextDecoder();
                let contents = td.decode(GLib.file_get_contents(this.kcPath)[1]);
                const config = Yaml.parse(contents);
                let currentContext = config['current-context'];

                if (this._settings.get_boolean('show-current-context') == true) {
                    this.label.text = currentContext;
                }

                for (let i in config.contexts) {
                    const context = config.contexts[i].name;
                    this.menu.addMenuItem(new KubePopupMenuItem(this._extensionObject, context, context == currentContext));
                }

                // add seperator to popup menu
                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

                // add link to settings dialog
                this._menu_settings = new PopupMenu.PopupMenuItem(_("Settings"));
                this._menu_settings.connect("activate", function () {
                    this._extensionObject.openPreferences();
                });
                this.menu.addMenuItem(this._menu_settings);
            } catch (e) {
                log('gnome-shell-extension-kubeconfig', e);
            }
        }

        _setView() {
            this.remove_all_children();
            if (this._settings.get_boolean('show-current-context') == false) {
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
