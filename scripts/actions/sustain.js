import { SelectDialog } from "../utils/select-dialog.js";
import { User } from "../utils/user.js";
import { Util } from "../utils/util.js";

const SUSTAIN_ACTION_ID = "Compendium.pf2e.actionspf2e.Item.3f5DMFu8fPiqHpRg";

export class Sustain {
    static sustainableEffects = new Map();

    static localize(key, data) {
        return game.i18n.format("pf2e-kineticists-companion.sustain." + key, data);
    }

    static registerSustainableEffect(sourceId, callback) {
        this.sustainableEffects.set(sourceId, callback);
    }

    static initialise() {
        Hooks.on(
            "preCreateChatMessage",
            message => {
                if (message.item?.sourceId === SUSTAIN_ACTION_ID) {
                    const actor = message.item.actor;
                    if (!actor) {
                        return;
                    }

                    const effects = actor.itemTypes.effect
                        .filter(effect => this.sustainableEffects.has(effect.sourceId))
                        .filter(effect => {
                            const flags = Util.getFlags(effect);
                            return !flags || !flags.sustain.sustained || flags.sustain.canSustainMoreThanOnce;
                        });

                    if (!effects.length) {
                        return;
                    }

                    SelectDialog.selectItem(this.localize("prompt.title"), this.localize("prompt.content"), effects)
                        .then(
                            async item => {
                                if (!item) {
                                    return;
                                }

                                item = await item.update({ "flags.pf2e-kineticists-companion.sustain.sustained": true });

                                this.sustainableEffects.get(item.sourceId)(item);
                            }
                        );
                }
            }
        );

        Hooks.on(
            "combatTurnChange",
            (encounter, previousState, currentState) => {
                // If we've gone back a turn, skip processing
                if (currentState.round < previousState.round || (currentState.round == previousState.round && currentState.turn < previousState.turn)) {
                    return;
                }

                // Previous combatant - if any effects have not been sustained, delete them
                const previousCombatant = encounter.combatants.get(previousState.combatantId)?.actor;
                if (previousCombatant && User.isPrimaryUpdater(previousCombatant)) {
                    const effectIdsToDelete = previousCombatant.itemTypes.effect
                        .filter(effect => this.sustainableEffects.has(effect.sourceId))
                        .filter(effect => !Util.getFlags(effect).sustain.sustained)
                        .map(effect => effect.id);

                    if (effectIdsToDelete.length) {
                        previousCombatant.deleteEmbeddedDocuments("Item", effectIdsToDelete);
                    }
                }

                // Current combatant - reset the sustained flag
                const currentCombatant = encounter.combatant?.actor;
                if (currentCombatant && User.isPrimaryUpdater(currentCombatant)) {
                    const updates = currentCombatant.itemTypes.effect
                        .filter(effect => this.sustainableEffects.has(effect.sourceId))
                        .filter(effect => Util.getFlags(effect).sustain.sustained)
                        .map(
                            effect => {
                                return {
                                    _id: effect.id,
                                    "flags.pf2e-kineticists-companion.sustain.sustained": false
                                };
                            }
                        );

                    if (updates.length) {
                        currentCombatant.updateEmbeddedDocuments("Item", updates);
                    }
                }
            }
        );
    }
}
