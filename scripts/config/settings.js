export class Settings {
    static initialise() {
        game.settings.register(
            "pf2e-kineticists-companion",
            "metal-carapace-shield-prompt",
            {
                name: game.i18n.localize("pf2e-kineticists-companion.metal-carapace.config.name"),
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
            "hardwood-armor-shield-prompt",
            {
                name: game.i18n.localize("pf2e-kineticists-companion.hardwood-armor.config.name"),
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
            "timber-sentinel-enable",
            {
                name: game.i18n.localize("pf2e-kineticists-companion.timber-sentinel.config.enable"),
                scope: "world",
                config: true,
                type: Boolean,
                default: true,
                requiresReload: true
            }
        );
    }
}
