import { DialogPrompt } from "../utils/prompt-dialog.js";

const HARDWOOD_ARMOR_FEAT_ID = "Compendium.pf2e.feats-srd.Item.cZa6br5C3Iyzqqi9";
const HARDWOOD_ARMOR_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.T5eTAW1TOgDO3Kec";
const HARDWOOD_ARMOR_ARMOR_ID = "Compendium.pf2e-kineticists-companion.items.Item.g9VJMFAv3MHzxOkm";
const WOODEN_SHIELD_ID = "Compendium.pf2e.equipment-srd.Item.ezVp13Uw8cWW08Da";

const localize = (key, data) => game.i18n.format("pf2e-kineticists-companion.hardwood-armor." + key, data);

export class HardwoodArmor {
    static initialise() {
        Hooks.on(
            "preCreateChatMessage",
            message => {
                if (message.item?.sourceId === HARDWOOD_ARMOR_FEAT_ID) {
                    const actor = message.item.actor;
                    if (!actor) {
                        return;
                    }

                    (async () => {
                        const creates = [];

                        // Delete any existing Hardwood Armor effect, and create a new one
                        await actor.itemTypes.shield.find(shield => shield.slug === "hardwood-shield")?.delete();
                        await actor.itemTypes.effect.find(effect => effect.sourceId === HARDWOOD_ARMOR_EFFECT_ID)?.delete({ skipDeleteArmor: true });

                        creates.push((await fromUuid(HARDWOOD_ARMOR_EFFECT_ID)).toObject());

                        // If we don't already have a Hardwood Armor item, create one
                        const existingHardwoodArmor = actor.itemTypes.armor.find(armor => armor.sourceId === HARDWOOD_ARMOR_ARMOR_ID);
                        if (!existingHardwoodArmor) {
                            const hardwoodArmorSource = (await fromUuid(HARDWOOD_ARMOR_ARMOR_ID)).toObject();

                            if (actor.wornArmor) {
                                const previousArmorData = {
                                    "id": actor.wornArmor.id,
                                    "bulk": actor.wornArmor._source.system.bulk.value,
                                    "runes": actor.wornArmor._source.system.runes
                                };

                                hardwoodArmorSource.flags["pf2e-kineticists-companion"] = { "previous-armor": previousArmorData };
                                hardwoodArmorSource.system.runes = previousArmorData.runes;
                            }

                            creates.push(hardwoodArmorSource);
                        }

                        const createShield = await this.#shouldCreateShield(actor);
                        if (createShield) {
                            const hardwoodShieldSource = (await fromUuid(WOODEN_SHIELD_ID)).toObject();
                            hardwoodShieldSource.system.slug = "hardwood-shield";

                            creates.push(hardwoodShieldSource);
                        }

                        const createdItems = await actor.createEmbeddedDocuments("Item", creates);

                        const updates = [];

                        // If we created hardwood armor, set it as worn
                        const hardwoodArmor = createdItems.find(item => item.sourceId === HARDWOOD_ARMOR_ARMOR_ID);
                        if (hardwoodArmor) {
                            updates.push(
                                {
                                    "_id": hardwoodArmor.id,
                                    "system.equipped": {
                                        "inSlot": true,
                                        "invested": true
                                    }
                                }
                            );

                            const previousArmorData = hardwoodArmor.flags["pf2e-kineticists-companion"]?.["previous-armor"];
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

                        const hardwoodShield = createdItems.find(item => item.sourceId === WOODEN_SHIELD_ID);
                        if (hardwoodShield) {
                            updates.push(
                                {
                                    "_id": hardwoodShield.id,
                                    "system": {
                                        "equipped": {
                                            "carryType": "held",
                                            "handsHeld": 1
                                        },
                                        "hp.value": hardwoodShield.system.hp.max
                                    }
                                }
                            );
                        }

                        if (updates.length) {
                            actor.updateEmbeddedDocuments("Item", updates);
                        }
                    })();
                }
            }
        );

        Hooks.on(
            "preDeleteItem",
            (item, context) => {
                if (item.sourceId !== HARDWOOD_ARMOR_EFFECT_ID) {
                    return;
                }

                const actor = item.actor;
                if (!actor) {
                    return;
                }

                const deletes = [];

                if (!context.skipDeleteArmor) {
                    const hardwoodArmor = actor.itemTypes.armor.find(armor => armor.sourceId === HARDWOOD_ARMOR_ARMOR_ID);
                    if (hardwoodArmor) {
                        deletes.push(hardwoodArmor.id);

                        const previousArmorData = hardwoodArmor.flags["pf2e-kineticists-companion"]?.["previous-armor"];
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
                }

                const hardwoodShield = actor.itemTypes.shield.find(shield => shield.slug === "hardwood-shield");
                if (hardwoodShield) {
                    deletes.push(hardwoodShield.id);
                }

                if (deletes.length) {
                    actor.deleteEmbeddedDocuments("Item", deletes);
                }
            }
        );

        Hooks.on(
            "preUpdateItem",
            (item, update) => {
                if (item.slug !== "hardwood-shield") {
                    return;
                }

                // We only care if we're updating the shield's HP
                if (!(update.system?.hp && Object.hasOwn(update.system?.hp, "value"))) {
                    return;
                }

                if (update.system.hp.value <= item.system.hp.brokenThreshold) {
                    item.delete();

                    this.#postToChat(item.actor, "shield-destroyed", item.img);

                    return false;
                }
            }
        );
    }

    static async #shouldCreateShield(actor) {
        if (!actor.handsFree) {
            return false;
        }

        const createShieldSetting = game.settings.get("pf2e-kineticists-companion", "hardwood-armor-shield-prompt");
        if (createShieldSetting === "always") {
            return true;
        } else if (createShieldSetting === "never") {
            return false;
        }

        const response = await DialogPrompt.prompt(localize("shield-prompt.title"), localize("shield-prompt.content"));

        if (response.remember) {
            game.settings.set("pf2e-kineticists-companion", "hardwood-armor-shield-prompt", response.answer ? "always" : "never");
        }

        return response.answer;
    }

    static async #postToChat(actor, message, img) {
        const content = await renderTemplate(
            "./systems/pf2e/templates/chat/action/content.hbs",
            {
                imgPath: img,
                message: localize(message, { name: actor.name })
            }
        );

        ChatMessage.create(
            {
                type: CONST.CHAT_MESSAGE_STYLES.EMOTE,
                speaker: ChatMessage.getSpeaker({ actor }),
                content
            }
        );
    }
}
