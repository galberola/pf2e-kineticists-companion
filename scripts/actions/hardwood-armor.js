import { ArmorImpulse } from "./common/armor-impulse.js";

const HARDWOOD_ARMOR_FEAT_ID = "Compendium.pf2e.feats-srd.Item.cZa6br5C3Iyzqqi9";
const HARDWOOD_ARMOR_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.T5eTAW1TOgDO3Kec";
const HARDWOOD_ARMOR_ARMOR_ID = "Compendium.pf2e-kineticists-companion.items.Item.g9VJMFAv3MHzxOkm";
const HARDWOOD_SHIELD_ID = "Compendium.pf2e-kineticists-companion.items.Item.bWt0k2tPn0mLKsAZ";

const HARDWOOD_ARMOR_SLUG = "hardwood-armor";
const HARDWOOD_SHIELD_SLUG = "hardwood-shield";

export class HardwoodArmor {
    static initialise() {
        Hooks.on(
            "preCreateChatMessage",
            message => {
                // If we post the Hardwood Armor impulse, apply its effects
                if (message.item?.sourceId === HARDWOOD_ARMOR_FEAT_ID) {
                    const actor = message.item.actor;
                    if (!actor) {
                        return;
                    }

                    ArmorImpulse.applyImpulse(
                        actor,
                        {
                            impulseSlug: HARDWOOD_ARMOR_SLUG,
                            effectId: HARDWOOD_ARMOR_EFFECT_ID,
                            armorId: HARDWOOD_ARMOR_ARMOR_ID,
                            shield: {
                                sourceId: HARDWOOD_SHIELD_ID,
                                slug: HARDWOOD_SHIELD_SLUG
                            }
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
                        effectId: HARDWOOD_ARMOR_EFFECT_ID,
                        armorId: HARDWOOD_ARMOR_ARMOR_ID,
                        shieldSlug: HARDWOOD_SHIELD_SLUG
                    }
                );
            }
        );

        Hooks.on(
            "preUpdateItem",
            (item, update) => {
                return ArmorImpulse.handleShieldDamage(
                    item,
                    update,
                    {
                        impulseSlug: HARDWOOD_ARMOR_SLUG,
                        shieldSlug: HARDWOOD_SHIELD_SLUG
                    }
                );
            }
        );
    }
}
