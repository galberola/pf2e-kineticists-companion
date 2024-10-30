const ARMOR_IN_EARTH_FEAT_ID = "Compendium.pf2e.feats-srd.Item.plEZoAyPwjAOdY4e";
const ARMOR_IN_EARTH_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.5mp3CvkJ8sLeFB5o";
const ARMOR_IN_EARTH_ARMOR_ID = "Compendium.pf2e-kineticists-companion.items.Item.IITK3au9fVLTccHC";

export class ArmorInEarth {
    static initialise() {
        Hooks.on(
            "preCreateChatMessage",
            message => {
                if (message.item?.sourceId !== ARMOR_IN_EARTH_FEAT_ID) {
                    return;
                }

                const actor = message.item.actor;
                if (!actor) {
                    return;
                }

                (async () => {
                    const creates = [];

                    // Delete any existing Armor in Earth effect, and create a new one
                    await actor.itemTypes.effect.find(effect => effect.sourceId === ARMOR_IN_EARTH_EFFECT_ID)?.delete({ skipDeleteArmor: true });

                    creates.push((await fromUuid(ARMOR_IN_EARTH_EFFECT_ID)).toObject());

                    // If we don't already have an Armor in Earth armor item, create one
                    const existingArmorInEarthArmor = actor.itemTypes.armor.find(effect => effect.sourceId === ARMOR_IN_EARTH_ARMOR_ID);
                    if (!existingArmorInEarthArmor) {
                        const armorInEarthArmorSource = (await fromUuid(ARMOR_IN_EARTH_ARMOR_ID)).toObject();

                        // If we are already wearing armor, remember its details so we can re-equip it when the impulse ends
                        if (actor.wornArmor) {
                            const previousArmorData = {
                                "id": actor.wornArmor.id,
                                "bulk": actor.wornArmor._source.system.bulk.value,
                                "runes": actor.wornArmor._source.system.runes
                            };

                            armorInEarthArmorSource.flags["pf2e-kineticists-companion"] = { "previous-armor": previousArmorData };
                            armorInEarthArmorSource.system.runes = previousArmorData.runes;
                        }

                        creates.push(armorInEarthArmorSource);
                    }

                    const createdItems = await actor.createEmbeddedDocuments("Item", creates);

                    const armorInEarthArmor = createdItems.find(item => item.sourceId === ARMOR_IN_EARTH_ARMOR_ID);
                    if (armorInEarthArmor) {
                        const updates = [
                            {
                                "_id": armorInEarthArmor.id,
                                "system.equipped": {
                                    "inSlot": true,
                                    "invested": true
                                }
                            }
                        ];

                        const previousArmorData = armorInEarthArmor.flags["pf2e-kineticists-companion"]?.["previous-armor"];
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
                    }
                })();
            }
        );

        Hooks.on(
            "preDeleteItem",
            (item, context) => {
                if (item.sourceId !== ARMOR_IN_EARTH_EFFECT_ID || context.skipDeleteArmor) {
                    return;
                }

                const actor = item.actor;
                if (!actor) {
                    return;
                }

                const armorInEarthArmor = actor.itemTypes.armor.find(armor => armor.sourceId === ARMOR_IN_EARTH_ARMOR_ID);
                if (!armorInEarthArmor) {
                    return;
                }

                armorInEarthArmor.delete();

                const previousArmorData = armorInEarthArmor.flags["pf2e-kineticists-companion"]?.["previous-armor"];
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
        );
    }
}
