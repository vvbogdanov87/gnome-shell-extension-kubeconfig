import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class KubeConfigExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Create a settings object
        window._settings = this.getSettings();

        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Configure the appearance of the extension'),
        });
        page.add(group);

        // Create a new preferences row
        const row = new Adw.SwitchRow({
            title: _('Show current context'),
            subtitle: _('Whether to show the current kubernetes context'),
        });
        group.add(row);

        // Bind the row to the `show-current-context` key
        window._settings.bind('show-current-context', row, 'active',
            Gio.SettingsBindFlags.DEFAULT);

        const groupInstrumentation = new Adw.PreferencesGroup({
            title: _('Instrumentation'),
            description: _('Configure extension tools'),
        });
        page.add(groupInstrumentation);

        // Create a new preferences row
        const clusterReachability = new Adw.SpinRow({
            title: _('Poll context cluster every (sec)'),
            subtitle: _('Cluster context reachability poll interval'),
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 60,
                step_increment: 1
            })
        });

        groupInstrumentation.add(clusterReachability);

        // Bind the row to the `cluster-poll-interval-seconds` key
        window._settings.bind('cluster-poll-interval-seconds', clusterReachability,
            'value', Gio.SettingsBindFlags.DEFAULT);


    }
}

