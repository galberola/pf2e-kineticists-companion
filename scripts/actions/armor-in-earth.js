const ARMOR_IN_EARTH_FEAT_ID = "Compendium.pf2e.feats-srd.Item.plEZoAyPwjAOdY4e";
const ARMOR_IN_EARTH_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.5mp3CvkJ8sLeFB5o";
const ARMOR_IN_EARTH_ITEM_ID = "Compendium.pf2e-kineticists-companion.items.Item.IITK3au9fVLTccHC";

export class ArmorInEarth {
    static initialise() {
        Hooks.on(
            "preCreateChatMessage",
            message => {
                const messageItem = message.item;
                if (!messageItem) {
                    return;
                }

                const actor = messageItem.actor;
                if (!actor) {
                    return;
                }

                if (messageItem.sourceId === ARMOR_IN_EARTH_FEAT_ID) {
                    (async () => {
                        // If we already have an Armor in Earth item, copy the previous armor data from it, or if we're wearing armor, build the previous
                        // armor data from it.
                        let previousArmorData = null;

                        const existingArmorInEarthItem = actor.itemTypes.armor.find(effect => effect.sourceId === ARMOR_IN_EARTH_ITEM_ID);
                        if (existingArmorInEarthItem) {
                            previousArmorData = existingArmorInEarthItem.flags["pf2e-kineticists-companion"]?.["previous-armor"];
                        } else if (actor.wornArmor) {
                            previousArmorData = {
                                "id": actor.wornArmor.id,
                                "bulk": actor.wornArmor._source.system.bulk.value
                            };
                        }

                        // Find and delete any previous instances of Armor in Earth
                        await actor.itemTypes.effect.find(effect => effect.sourceId === ARMOR_IN_EARTH_EFFECT_ID)?.delete();

                        // Create the new items
                        const armorInEarthEffectSource = (await fromUuid(ARMOR_IN_EARTH_EFFECT_ID)).toObject();

                        const armorInEarthItemSource = (await fromUuid(ARMOR_IN_EARTH_ITEM_ID)).toObject();
                        if (previousArmorData) {
                            armorInEarthItemSource.flags["pf2e-kineticists-companion"] = {
                                "previous-armor": previousArmorData
                            };
                            armorInEarthItemSource.system.runes = actor.wornArmor._source.system.runes;
                        }

                        const createdItems = await actor.createEmbeddedDocuments("Item", [armorInEarthEffectSource, armorInEarthItemSource]);
                        
                        // Update the armor to be equipped, and any existing armor to be unequipped
                        const armorInEarthItem = createdItems.find(item => item.sourceId === ARMOR_IN_EARTH_ITEM_ID);
                        if (!armorInEarthItem) {
                            return;
                        }

                        const updates = [
                            {
                                "_id": armorInEarthItem.id,
                                "system.equipped": {
                                    "inSlot": true,
                                    "invested": true
                                }
                            }
                        ];

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

                        actor.updateEmbeddedDocuments("Item", updates);
                    })();
                }
            }
        );

        Hooks.on(
            "preDeleteItem",
            item => {
                if (item.sourceId === ARMOR_IN_EARTH_EFFECT_ID) {
                    const actor = item.actor;
                    if (!actor) {
                        return;
                    }

                    const armorInEarthItem = actor.itemTypes.armor.find(armor => armor.sourceId === ARMOR_IN_EARTH_ITEM_ID);
                    if (!armorInEarthItem) {
                        return;
                    }

                    armorInEarthItem.delete();

                    const previousArmorData = armorInEarthItem.flags["pf2e-kineticists-companion"]?.["previous-armor"];
                    if (!previousArmorData) {
                        return;
                    }

                    const previousArmor = actor.itemTypes.armor.find(armor => armor.id === previousArmorData.id);
                    if (!previousArmor) {
                        return;
                    }

                    previousArmor.update(
                        {
                            "system": {
                                "bulk.value": previousArmorData.bulk,
                                "equipped.inSlot": true
                            }
                        }
                    );
                }
            }
        );
    }
}
