import { HookManager } from "../utils/hook.js";

const FEAT_ID = "Compendium.pf2e.feats-srd.Item.ijsMs8iv9AsHQWrv";
const IMMUNITY_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.ACk0TnQ6ErMiQnLe";

export class TorrentInTheBlood {
    static localize(key, data) {
        return game.i18n.format("pf2e-kineticists-companion.torrent-in-the-blood." + key, data);
    }

    static initialise() {
        if (!game.modules.get("lib-wrapper").active) {
            return;
        }

        HookManager.registerCheck(
            "CONFIG.PF2E.Actor.documentClasses.character.prototype.applyDamage",
            data => TorrentInTheBlood.#applyHealing(data)
        );

        HookManager.registerCheck(
            "CONFIG.PF2E.Actor.documentClasses.npc.prototype.applyDamage",
            data => TorrentInTheBlood.#applyHealing(data)
        );
    }

    /**
     * @returns boolean
     */
    static #applyHealing(data) {
        if (data.item?.sourceId === FEAT_ID) {
            const actor = data.token?.actor;
            if (!actor) {
                return true;
            }

            // If we're immune, don't apply the healing
            if (actor.itemTypes.effect.some(effect => effect.sourceId === IMMUNITY_EFFECT_ID)) {
                ui.notifications.warn(this.localize("immune", { name: actor.name }));
                return false;
            }

            // Create the immunity effect
            fromUuid(IMMUNITY_EFFECT_ID).then(immunityEffect => actor.createEmbeddedDocuments("Item", [immunityEffect.toObject()]));

            return true;
        }
    }
}
