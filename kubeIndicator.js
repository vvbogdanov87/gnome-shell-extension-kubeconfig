const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const ByteArray = imports.byteArray;
const GObject = imports.gi.GObject;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const KubePopupMenuItem = Me.imports.kubePopupMenuItem;
const YAML = Me.imports.lib.yaml.Yaml.Yaml;
const Util = imports.misc.util;

const KubeIndicator = GObject.registerClass({ GTypeName: 'KubeIndicator' },
    class KubeIndicator extends PanelMenu.Button {
        _init() {
            super._init(null, "Kube");
            this._settings = ExtensionUtils.getSettings();
            this.kcPath = GLib.get_home_dir() + "/.kube/config";

            this.setMenu(new PopupMenu.PopupMenu(this.actor, 0.25, St.Side.TOP));

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
                let contents = ByteArray.toString(GLib.file_get_contents(this.kcPath)[1]);
                const config = YAML.parse(contents);
                let currentContext = config['current-context'];

                if (this._settings.get_boolean('show-current-context') == true) {
                    this.label.text = currentContext;
                }

                for (let i in config.contexts) {
                    const context = config.contexts[i].name;
                    this.menu.addMenuItem(new KubePopupMenuItem.KubePopupMenuItem(context, context == currentContext));
                }

                // add seperator to popup menu
                this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

                // add link to settings dialog
                this._menu_settings = new PopupMenu.PopupMenuItem(_("Settings"));
                this._menu_settings.connect("activate", function () {
                    Util.spawn(["gnome-shell-extension-prefs", "kube_config@vvbogdanov87.gmail.com"]);
                });
                this.menu.addMenuItem(this._menu_settings);
            } catch (e) {
                log('gnome-shell-extension-kubeconfig', e);
            }
        }

        _setView() {
            this.actor.remove_all_children();
            if (this._settings.get_boolean('show-current-context') == false) {
                let gicon = Gio.icon_new_for_string(Me.path + '/icons/logo.svg');
                this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon' });
                this.actor.add_actor(this.icon);
            } else {
                this.label = new St.Label({
                    text: _("kubectl"),
                    y_align: Clutter.ActorAlign.CENTER
                });
                this.actor.add_actor(this.label);
            }
            this._update();
        }

        _bindSettingsChanges() {
            this._settings.connect('changed::show-current-context', () => {
                this._setView();
            });
        }
    });
