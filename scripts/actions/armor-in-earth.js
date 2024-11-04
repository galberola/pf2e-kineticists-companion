import { ArmorImpulse } from "./common/armor-impulse.js";

const ARMOR_IN_EARTH_FEAT_ID = "Compendium.pf2e.feats-srd.Item.plEZoAyPwjAOdY4e";
const ARMOR_IN_EARTH_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.5mp3CvkJ8sLeFB5o";
const ARMOR_IN_EARTH_ARMOR_ID = "Compendium.pf2e-kineticists-companion.items.Item.IITK3au9fVLTccHC";

export class ArmorInEarth {
    static initialise() {
        Hooks.on(
            "preCreateChatMessage",
            message => {
                // If we post the Armor in Earth impulse, apply its effects
                if (message.item?.sourceId === ARMOR_IN_EARTH_FEAT_ID) {
                    const actor = message.item.actor;
                    if (!actor) {
                        return;
                    }

                    ArmorImpulse.applyImpulse(
                        actor,
                        {
                            impulseSlug: "armor-in-earth",
                            effectId: ARMOR_IN_EARTH_EFFECT_ID,
                            armorId: ARMOR_IN_EARTH_ARMOR_ID
                        }
                    );
                }
            }
        );

        Hooks.on(
            "preDeleteItem",
            (item, context) => {
                return ArmorImpulse.preDeleteItem(
                    item,
                    context,
                    {
                        effectId: ARMOR_IN_EARTH_EFFECT_ID,
                        armorId: ARMOR_IN_EARTH_ARMOR_ID
                    }
                );
            }
        );
    }
}
