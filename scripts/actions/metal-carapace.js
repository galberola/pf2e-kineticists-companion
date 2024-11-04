import { Chat } from "../utils/chat.js";
import { ArmorImpulse } from "./common/armor-impulse.js";

const METAL_CARAPACE_FEAT_ID = "Compendium.pf2e.feats-srd.Item.HbdOZ8YTtu8ykASc";
const METAL_CARAPACE_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.2Sgil2Rnze8hOAMy";
const METAL_CARAPACE_ARMOR_ID = "Compendium.pf2e-kineticists-companion.items.Item.lFwSITcv5vwrK5m1";
const METAL_CARAPACE_SHIELD_ID = "Compendium.pf2e-kineticists-companion.items.Item.rkP9Mj9bViIIT7cX";

const METAL_CARAPACE_SLUG = "metal-carapace";
const METAL_CARAPACE_SHIELD_SLUG = "metal-carapace-shield";

export class MetalCarapace {
    static initialise() {
        Hooks.on(
            "preCreateChatMessage",
            message => {
                // If we post the Metal Carapace impulse, apply its effects
                if (message.item?.sourceId === METAL_CARAPACE_FEAT_ID) {
                    const actor = message.item.actor;
                    if (!actor) {
                        return;
                    }

                    ArmorImpulse.applyImpulse(
                        actor,
                        {
                            impulseSlug: METAL_CARAPACE_SLUG,
                            effectId: METAL_CARAPACE_EFFECT_ID,
                            armorId: METAL_CARAPACE_ARMOR_ID,
                            shield: {
                                sourceId: METAL_CARAPACE_SHIELD_ID,
                                slug: METAL_CARAPACE_SHIELD_SLUG
                            }
                        }
                    );

                    return;
                }

                // If we take damage from a critical hit, Metal Carapace ends
                const context = message.flags.pf2e?.context;
                if (context?.type === "damage-taken" && context?.options?.includes("check:outcome:critical-success")) {
                    const actor = message.actor;
                    if (!actor) {
                        return;
                    }

                    const metalCarapaceEffect = actor.itemTypes.effect.find(effect => effect.sourceId === METAL_CARAPACE_EFFECT_ID);
                    if (metalCarapaceEffect) {
                        metalCarapaceEffect.delete();
                        Chat.postToChat(actor, this.localize("armor-destroyed", { name: actor.name }), metalCarapaceEffect.img);
                    }
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
                        effectId: METAL_CARAPACE_EFFECT_ID,
                        armorId: METAL_CARAPACE_ARMOR_ID,
                        shieldSlug: METAL_CARAPACE_SHIELD_SLUG
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
                        impulseSlug: METAL_CARAPACE_SLUG,
                        shieldSlug: METAL_CARAPACE_SHIELD_SLUG
                    }
                );
            }
        );
    }
} 
