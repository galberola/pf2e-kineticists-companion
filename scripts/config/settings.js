export class Settings {
    static initialise() {
        game.settings.register(
            "pf2e-kineticists-companion",
            "armor-in-earth-unlimited-duration",
            {
                "name": game.i18n.localize("pf2e-kineticists-companion.armor-in-earth.config.unlimited-duration.name"),
                "hint": game.i18n.localize("pf2e-kineticists-companion.armor-in-earth.config.unlimited-duration.hint"),
                "scope": "world",
                config: true,
                type: Boolean,
                default: false
            }
        );

        game.settings.register(
            "pf2e-kineticists-companion",
            "hardwood-armor-shield-prompt",
            {
                name: game.i18n.localize("pf2e-kineticists-companion.hardwood-armor.config.create-shield.name"),
                scope: "client",
                config: true,
                type: String,
                choices: {
                    "ask": game.i18n.localize("pf2e-kineticists-companion.config.option.ask"),
                    "always": game.i18n.localize("pf2e-kineticists-companion.config.option.always"),
                    "never": game.i18n.localize("pf2e-kineticists-companion.config.option.never")
                },
                default: "ask"
            }
        );

        game.settings.register(
            "pf2e-kineticists-companion",
            "hardwood-armor-unlimited-duration",
            {
                "name": game.i18n.localize("pf2e-kineticists-companion.hardwood-armor.config.unlimited-duration.name"),
                "hint": game.i18n.localize("pf2e-kineticists-companion.hardwood-armor.config.unlimited-duration.hint"),
                "scope": "world",
                config: true,
                type: Boolean,
                default: false
            }
        );

        game.settings.register(
            "pf2e-kineticists-companion",
            "metal-carapace-shield-prompt",
            {
                name: game.i18n.localize("pf2e-kineticists-companion.metal-carapace.config.create-shield.name"),
                scope: "client",
                config: true,
                type: String,
                choices: {
                    "ask": game.i18n.localize("pf2e-kineticists-companion.config.option.ask"),
                    "always": game.i18n.localize("pf2e-kineticists-companion.config.option.always"),
                    "never": game.i18n.localize("pf2e-kineticists-companion.config.option.never")
                },
                default: "ask"
            }
        );

        game.settings.register(
            "pf2e-kineticists-companion",
            "metal-carapace-unlimited-duration",
            {
                "name": game.i18n.localize("pf2e-kineticists-companion.metal-carapace.config.unlimited-duration.name"),
                "hint": game.i18n.localize("pf2e-kineticists-companion.metal-carapace.config.unlimited-duration.hint"),
                "scope": "world",
                config: true,
                type: Boolean,
                default: false
            }
        );

        game.settings.register(
            "pf2e-kineticists-companion",
            "thermal-nimbus-apply-damage",
            {
                name: game.i18n.localize("pf2e-kineticists-companion.thermal-nimbus.config.auto-damage.name"),
                hint: game.i18n.localize("pf2e-kineticists-companion.thermal-nimbus.config.auto-damage.hint"),
                scope: "world",
                config: true,
                type: Boolean,
                default: true
            }
        );

        game.settings.register(
            "pf2e-kineticists-companion",
            "timber-sentinel-enable",
            {
                name: game.i18n.localize("pf2e-kineticists-companion.timber-sentinel.config.enable.name"),
                scope: "world",
                config: true,
                type: Boolean,
                default: true,
                requiresReload: true
            }
        );

        Hooks.on(
            "renderSettingsConfig",
            (_, html) => {
                const categorise = (groupName, settingNames) => {
                    for (const settingName of settingNames) {
                        html.find(`div[data-setting-id="pf2e-kineticists-companion.${settingName}"]`)
                            ?.closest(".form-group")
                            ?.addClass(groupName);
                    }

                    html.find(`.${groupName}`)
                        ?.wrapAll(`<fieldset style="border: 1px solid #a1a1a1;"></fieldset>`)
                        ?.parent()
                        ?.prepend(`<legend>${game.i18n.localize(`pf2e-kineticists-companion.${groupName}.name`)}</legend>`);
                };

                categorise(
                    "armor-in-earth",
                    [
                        "armor-in-earth-unlimited-duration"
                    ]
                );

                categorise(
                    "hardwood-armor",
                    [
                        "hardwood-armor-shield-prompt",
                        "hardwood-armor-unlimited-duration"
                    ]
                );

                categorise(
                    "metal-carapace",
                    [
                        "metal-carapace-shield-prompt",
                        "metal-carapace-unlimited-duration"
                    ]
                );

                categorise(
                    "thermal-nimbus",
                    [
                        "thermal-nimbus-apply-damage"
                    ]
                );

                categorise(
                    "timber-sentinel",
                    [
                        "timber-sentinel-enable"
                    ]
                );
            }
        );
    }
}
