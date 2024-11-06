import { HookManager } from "../utils/hook.js";

const FEAT_ID = "Compendium.pf2e.feats-srd.Item.azyp4nQgAPDI6nKv";
const IMMUNITY_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.ogbeabaSGu4GfWKj";

export class DashOfHerbs {
    static localize(key, data) {
        return game.i18n.format("pf2e-kineticists-companion.dash-of-herbs." + key, data);
    }

    static initialise() {
        if (!game.modules.get("lib-wrapper").active) {
            return;
        }

        HookManager.registerCheck(
            "CONFIG.PF2E.Actor.documentClasses.character.prototype.applyDamage",
            data => DashOfHerbs.#applyHealing(data)
        );

        HookManager.registerCheck(
            "CONFIG.PF2E.Actor.documentClasses.npc.prototype.applyDamage",
            data => DashOfHerbs.#applyHealing(data)
        );
    }

    static #applyHealing(data) {
        if (data.item?.sourceId === FEAT_ID) {
            const actor = data.token?.actor;
            if (!actor) {
                return;
            }

            // If we're immune, don't apply the healing
            if (actor.itemTypes.effect.some(effect => effect.sourceId === IMMUNITY_EFFECT_ID)) {
                ui.notifications.warn(this.localize("immune", { name: actor.name }));
                return false;
            }

            // Create the immunity effect
            fromUuid(IMMUNITY_EFFECT_ID).then(immunityEffect => actor.createEmbeddedDocuments("Item", [immunityEffect]));
        }

        return true;
    }
}