import { Chat } from "../utils/chat.js";
import { DialogPrompt } from "../utils/prompt-dialog.js";

const METAL_CARAPACE_FEAT_ID = "Compendium.pf2e.feats-srd.Item.HbdOZ8YTtu8ykASc";
const METAL_CARAPACE_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.2Sgil2Rnze8hOAMy";
const METAL_CARAPACE_ARMOR_ID = "Compendium.pf2e-kineticists-companion.items.Item.lFwSITcv5vwrK5m1";
const METAL_CARAPACE_SHIELD_ID = "Compendium.pf2e-kineticists-companion.items.Item.rkP9Mj9bViIIT7cX";

const localize = (key, data) => game.i18n.format("pf2e-kineticists-companion.metal-carapace." + key, data);

export class MetalCarapace {
    static initialise() {
        Hooks.on(
            "preCreateChatMessage",
            message => {
                if (message.item?.sourceId === METAL_CARAPACE_FEAT_ID) {
                    const actor = message.item.actor;
                    if (!actor) {
                        return;
                    }

                    (async () => {
                        const creates = [];

                        // Delete any existing Metal Carapace effect, and create a new one
                        await actor.itemTypes.shield.find(shield => shield.sourceId === METAL_CARAPACE_SHIELD_ID)?.delete();
                        await actor.itemTypes.effect.find(effect => effect.sourceId === METAL_CARAPACE_EFFECT_ID)?.delete({ skipDeleteArmor: true });

                        creates.push((await fromUuid(METAL_CARAPACE_EFFECT_ID)).toObject());

                        // If we don't already have a Metal Carapace armor item, create one
                        const existingMetalCarapaceArmor = actor.itemTypes.armor.find(armor => armor.sourceId === METAL_CARAPACE_ARMOR_ID);
                        if (!existingMetalCarapaceArmor) {
                            const metalCarapaceArmorSource = (await fromUuid(METAL_CARAPACE_ARMOR_ID)).toObject();

                            if (actor.wornArmor) {
                                const previousArmorData = {
                                    "id": actor.wornArmor.id,
                                    "bulk": actor.wornArmor._source.system.bulk.value,
                                    "runes": actor.wornArmor._source.system.runes
                                };

                                metalCarapaceArmorSource.flags["pf2e-kineticists-companion"] = { "previous-armor": previousArmorData };
                                metalCarapaceArmorSource.system.runes = previousArmorData.runes;
                            }

                            creates.push(metalCarapaceArmorSource);
                        }

                        const createShield = await this.#shouldCreateShield(actor);
                        if (createShield) {
                            creates.push((await fromUuid(METAL_CARAPACE_SHIELD_ID)).toObject());
                        }

                        const createdItems = await actor.createEmbeddedDocuments("Item", creates);

                        const updates = [];

                        // If we created the armor, set it as worn
                        const metalCarapaceArmor = createdItems.find(item => item.sourceId === METAL_CARAPACE_ARMOR_ID);
                        if (metalCarapaceArmor) {
                            updates.push(
                                {
                                    "_id": metalCarapaceArmor.id,
                                    "system.equipped": {
                                        "inSlot": true,
                                        "invested": true
                                    }
                                }
                            );

                            const previousArmorData = metalCarapaceArmor.flags["pf2e-kineticists-companion"]?.["previous-armor"];
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

                        // If we created the shield, set it as held
                        const metalCarapaceShield = createdItems.find(item => item.sourceId === METAL_CARAPACE_SHIELD_ID);
                        if (metalCarapaceShield) {
                            updates.push(
                                {
                                    "_id": metalCarapaceShield.id,
                                    "system": {
                                        "equipped": {
                                            "carryType": "held",
                                            "handsHeld": 1
                                        },
                                        "hp.value": metalCarapaceShield.system.hp.max
                                    }
                                }
                            );
                        }

                        if (updates.length) {
                            actor.updateEmbeddedDocuments("Item", updates);
                        }
                    })();

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
                if (item.sourceId !== METAL_CARAPACE_EFFECT_ID) {
                    return;
                }

                const actor = item.actor;
                if (!actor) {
                    return;
                }

                const deletes = [];

                if (!context.skipDeleteArmor) {
                    const metalCarapaceArmor = actor.itemTypes.armor.find(armor => armor.sourceId === METAL_CARAPACE_ARMOR_ID);
                    if (metalCarapaceArmor) {
                        deletes.push(metalCarapaceArmor.id);

                        // Re-equip the previous armor
                        const previousArmorData = metalCarapaceArmor.flags["pf2e-kineticists-companion"]?.["previous-armor"];
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

                const metalCarapaceShield = actor.itemTypes.shield.find(shield => shield.sourceId === METAL_CARAPACE_SHIELD_ID);
                if (metalCarapaceShield) {
                    deletes.push(metalCarapaceShield.id);
                }

                if (deletes.length) {
                    actor.deleteEmbeddedDocuments("Item", deletes);
                }
            }
        );

        Hooks.on(
            "preUpdateItem",
            (item, update) => {
                if (item.sourceId !== METAL_CARAPACE_SHIELD_ID) {
                    return;
                }

                // We only care if we're updating the shield's HP
                if (!(update.system?.hp && Object.hasOwn(update.system?.hp, "value"))) {
                    return;
                }

                if (update.system.hp.value <= item.system.hp.brokenThreshold) {
                    item.delete();

                    Chat.postToChat(item.actor, this.localize("shield-destroyed", { name: item.actor.name }), item.img);

                    return false;
                }
            }
        );
    }

    static async #shouldCreateShield(actor) {
        if (!actor.handsFree) {
            return false;
        }

        const createShieldSetting = game.settings.get("pf2e-kineticists-companion", "metal-carapace-shield-prompt");
        if (createShieldSetting === "always") {
            return true;
        } else if (createShieldSetting === "never") {
            return false;
        }

        const response = await DialogPrompt.prompt(localize("shield-prompt.title"), localize("shield-prompt.content"));

        if (response.remember) {
            game.settings.set("pf2e-kineticists-companion", "metal-carapace-shield-prompt", response.answer ? "always" : "never");
        }

        return response.answer;
    }
} 
