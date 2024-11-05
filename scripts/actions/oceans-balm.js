import { HookManager } from "../utils/hook.js";

const OCEANS_BALM_FEAT_ID = "Compendium.pf2e.feats-srd.Item.1gtWb6lKWMw1Wp1q";
const OCEANS_BALM_EFFECT_ID = "Compendium.pf2e.feat-effects.Item.uG1EljvrnC9HGwUh";
const OCEANS_BALM_IMMUNITY_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.jvOKOj17qKPDZA1G";

export class OceansBalm {
    static localize(key, data) {
        return game.i18n.format("pf2e-kineticists-companion.oceans-balm." + key, data);
    }

    static initialise() {
        if (!game.modules.get("lib-wrapper").active) {
            return;
        }

        HookManager.registerCheck(
            "CONFIG.PF2E.Actor.documentClasses.character.prototype.applyDamage",
            data => OceansBalm.#applyHealing(data)
        );

        HookManager.registerCheck(
            "CONFIG.PF2E.Actor.documentClasses.npc.prototype.applyDamage",
            data => OceansBalm.#applyHealing(data)
        );
    }

    /**
     * @returns boolean
     */
    static #applyHealing(data) {
        if (data.item?.sourceId === OCEANS_BALM_FEAT_ID) {
            const actor = data.token?.actor;
            if (!actor) {
                return true;
            }

            const effects = actor.itemTypes.effect;

            // Regardless of immunity, we can re-apply the resistance effect
            effects.find(effect => effect.sourceId === OCEANS_BALM_EFFECT_ID)?.delete();

            const hasImmunity = effects.some(effect => effect.sourceId === OCEANS_BALM_IMMUNITY_EFFECT_ID);

            // Create the effects that we need to asynchronously
            (async () => {
                const creates = [(await fromUuid(OCEANS_BALM_EFFECT_ID)).toObject()];

                if (!hasImmunity) {
                    creates.push((await fromUuid(OCEANS_BALM_IMMUNITY_EFFECT_ID)).toObject());
                }

                actor.createEmbeddedDocuments("Item", creates);
            })();

            // If we already have immunity, don't do the healing
            if (hasImmunity) {
                ui.notifications.info(this.localize("immune", { name: actor.name }));
                return false;
            }
        }

        return true;
    }
}
