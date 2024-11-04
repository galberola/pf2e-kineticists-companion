import { Chat } from "../../utils/chat.js";
import { DialogPrompt } from "../../utils/prompt-dialog.js";

export class ArmorImpulse {
    /**
     * @param {{
     *      impulseSlug: string,
     *      effectId: string,
     *      armorId: string,
     *      shield: {
     *          sourceId: string,
     *          slug: string
     *      }?
     * }} data
     */
    static async applyImpulse(actor, data) {
        const creates = [];

        // Delete any existing armor effect, and its shield (if there is one)
        if (data.shield) {
            await actor.itemTypes.shield.find(shield => shield.slug === data.shield.slug)?.delete();
        }

        await actor.itemTypes.effect.find(effect => effect.sourceId === data.effectId)?.delete({ skipDeleteArmor: true });

        const effectSource = (await fromUuid(data.effectId)).toObject();

        if (game.settings.get("pf2e-kineticists-companion", `${data.impulseSlug}-unlimited-duration`)) {
            effectSource.system.duration = {
                expiry: null,
                sustained: false,
                unit: "unlimited",
                value: -1
            };
        }

        creates.push(effectSource);

        // If we don't already have the armor item, create one
        const existingArmor = actor.itemTypes.armor.find(armor => armor.sourceId === data.armorId);
        if (!existingArmor) {
            const armorSource = (await fromUuid(data.armorId)).toObject();

            if (actor.wornArmor) {
                const previousArmorData = {
                    "id": actor.wornArmor.id,
                    "bulk": actor.wornArmor._source.system.bulk.value,
                    "runes": actor.wornArmor._source.system.runes
                };

                armorSource.flags["pf2e-kineticists-companion"] = { "previous-armor": previousArmorData };
                armorSource.system.runes = previousArmorData.runes;
            }

            creates.push(armorSource);
        }

        // Create the shield
        if (data.shield && await this.#shouldCreateShield(actor, data.impulseSlug)) {
            creates.push((await fromUuid(data.shield.sourceId)).toObject());
        }

        const createdItems = await actor.createEmbeddedDocuments("Item", creates);

        const updates = [];

        // If we created the armor, set it as worn
        const armor = createdItems.find(item => item.sourceId === data.armorId);
        if (armor) {
            updates.push(
                {
                    "_id": armor.id,
                    "system.equipped": {
                        "inSlot": true,
                        "invested": true
                    }
                }
            );

            // If we're currently wearing armor, unequip it and update its Bulk so it doesn't weight more (as we're thematically still wearing it)
            const previousArmorData = armor.flags["pf2e-kineticists-companion"]?.["previous-armor"];
            if (previousArmorData) {
                updates.push(
                    {
                        "_id": previousArmorData.id,
                        "system": {
                            "bulk.value": previousArmorData.bulk > 1 ? previousArmorData.bulk - 1 : previousArmorData.bulk == 1 ? 0.1 : 0,
                            "equipped.inSlot": false
                        }
                    }
                );
            }
        }

        // If we created a shield, set it as held, and set its HP to maximum
        const shield = createdItems.find(item => item.sourceId === data.shield?.sourceId);
        if (shield) {
            updates.push(
                {
                    "_id": shield.id,
                    "system": {
                        "equipped": {
                            "carryType": "held",
                            "handsHeld": 1
                        },
                        "hp.value": shield.system.hp.max
                    }
                }
            );
        }

        if (updates.length) {
            actor.updateEmbeddedDocuments("Item", updates);
        }
    }

    /**
     * @param {{
     *      effectId: string,
     *      armorId: string,
     *      shieldSlug: string?
     * }} data
     */
    static preDeleteItem(item, context, data) {
        const actor = item.actor;
        if (!actor) {
            return true;
        };

        if (item.sourceId === data.effectId && !context.skipDeleteArmor) {
            const deletes = [];

            const armor = actor.itemTypes.armor.find(armor => armor.sourceId === data.armorId);
            if (armor) {
                deletes.push(armor.id);

                // Re-equip the previous armor, if any
                const previousArmorData = armor.flags["pf2e-kineticists-companion"]?.["previous-armor"];
                if (previousArmorData) {
                    actor.itemTypes.armor.find(armor => armor.id === previousArmorData.id)?.update(
                        {
                            "system": {
                                "bulk.value": previousArmorData.bulk,
                                "equipped.inSlot": true
                            }
                        }
                    );
                }
            }

            const shield = actor.itemTypes.shield.find(shield => shield.slug === data.shieldSlug);
            if (shield) {
                deletes.push(shield.id);
            }

            if (deletes.length) {
                actor.deleteEmbeddedDocuments("Item", deletes, { skipDeleteEffect: true });
            }
        } else if (item.sourceId === data.armorId && !context.skipDeleteEffect) {
            const effect = actor.itemTypes.effect.find(effect => effect.sourceId === data.effectId);
            if (effect) {
                effect.delete();
                return false;
            }
        }

        return true;
    }

    /**
     * @param {{impulseSlug: string, shieldSlug: string}} data 
     */
    static handleShieldDamage(item, update, data) {
        if (item.slug === data.shieldSlug &&
            update.system?.hp?.value != null &&
            update.system.hp.value <= item.system.hp.brokenThreshold
        ) {
            item.delete();

            Chat.postToChat(
                item.actor,
                game.i18n.format(
                    `pf2e-kineticists-companion.${data.impulseSlug}.shield-destroyed`,
                    {
                        name: item.actor.name
                    }
                ),
                item.img
            );

            return false;
        }

        return true;
    }

    static async #shouldCreateShield(actor, impulseSlug) {
        if (!actor.handsFree) {
            return false;
        }

        const createShieldSetting = game.settings.get("pf2e-kineticists-companion", `${impulseSlug}-shield-prompt`);
        if (createShieldSetting === "always") {
            return true;
        } else if (createShieldSetting === "never") {
            return false;
        }

        const response = await DialogPrompt.prompt(
            game.i18n.localize(`pf2e-kineticists-companion.${impulseSlug}.shield-prompt.title`),
            game.i18n.localize(`pf2e-kineticists-companion.${impulseSlug}.shield-prompt.content`)
        );

        if (response.remember) {
            game.settings.set("pf2e-kineticists-companion", `${impulseSlug}-shield-prompt`, response.answer ? "always" : "never");
        }

        return response.answer;
    }
}
