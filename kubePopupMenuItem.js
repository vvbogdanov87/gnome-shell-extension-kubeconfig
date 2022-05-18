const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const byteArray = imports.byteArray;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;

var KubePopupMenuItem = GObject.registerClass({ GTypeName: 'KubePopupMenuItem' },
    class extends PopupMenu.PopupBaseMenuItem {
        _init(text, selected, params) {
            super._init(params);
            this.text = text;
            this.selected = selected;
            this.box = new St.BoxLayout({ style_class: 'popup-combobox-item' });

            if (this.selected == true) {
                let gicon = Gio.icon_new_for_string(Me.path + '/icons/ball.svg');
                this.icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon', icon_size: 16 });
                this.box.add(this.icon);
                this.text = " " + this.text
            }

            this.label = new St.Label({ text: this.text });
            this.box.add(this.label);

            this.add_child(this.box);

            this.connect("activate", () => {
                const path = GLib.build_filenamev([GLib.get_home_dir(), "/.kube/config"]);
                try {
                    const file = Gio.File.new_for_path(path);
                    const [_, buffer] = file.load_contents(null);
                    let contents = byteArray.toString(buffer);

                    const re = new RegExp('current-context:\\s(.+)', 'gm');
                    contents = contents.replace(re, `current-context: ${this.text.trim()}`);

                    // Using `Gio.FileCreateFlags.NONE` maintains file permissions
                    file.replace_contents(contents, null, false, Gio.FileCreateFlags.NONE, null);
                } catch (e) {
                    log('gnome-shell-extension-kubeconfig', e);
                }
            });
        }
    });
