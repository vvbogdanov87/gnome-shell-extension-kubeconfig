import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class KubeConfigExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
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

        window._settings = this.getSettings();

        const showCurrContext = new Adw.SwitchRow({
            title: _('Show current context'),
            subtitle: _('Whether to show the current kubernetes context'),
        });
        group.add(showCurrContext);
        window._settings.bind('show-current-context', showCurrContext, 'active',
            Gio.SettingsBindFlags.DEFAULT);

        const maxLength = new Adw.SpinRow({
            title: _('Max currrent context length'),
            subtitle: _('0 - unlimited'),
            lower: 0,
            step_increment: 1,
        });
        group.add(maxLength);
        window._settings = this.getSettings();
        window._settings.bind('max-current-context-lenght', maxLength, 'active',
            Gio.SettingsBindFlags.DEFAULT);
    }
}

