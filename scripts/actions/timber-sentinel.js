import { Chat } from "../utils/chat.js";
import { Socket } from "../utils/socket.js";

const TIMBER_SENTINEL_FEAT_ID = "Compendium.pf2e.feats-srd.Item.aHlcMMNQ85VLK7QT";
const PROTECTOR_TREE_ACTOR_ID = "Compendium.pf2e-kineticists-companion.actors.Actor.EaXKh9W9jU3g1xdy";
const PROTECTOR_TREE_EFFECT_ID = "Compendium.pf2e-kineticists-companion.items.Item.qFGdtxGT86J1Kj5R";

export class TimberSentinel {
    static localize(key, data) {
        return game.i18n.format("pf2e-kineticists-companion.timber-sentinel." + key, data);
    }

    static initialise() {
        // We need these modules for this functionality to work
        if (!(
            game.modules.get("portal-lib").active &&
            game.modules.get("socketlib").active &&
            game.modules.get("lib-wrapper").active
        )) {
            return;
        }

        if (!game.settings.get("pf2e-kineticists-companion", "timber-sentinel-enable")) {
            return;
        }

        Hooks.on(
            "ready",
            () => {
                Socket.register("initialiseProtectorTree", data => TimberSentinel.#initialiseProtectorTree(data));
                Socket.register("damageProtectorTrees", (...args) => TimberSentinel.#damageProtectorTrees(...args));
            }
        );

        Hooks.on(
            "preCreateChatMessage",
            message => {
                if (message.item?.sourceId === TIMBER_SENTINEL_FEAT_ID) {
                    const actor = message.item.actor;
                    if (!actor) {
                        return;
                    }

                    const token = actor.getActiveTokens()?.[0];
                    if (!token) {
                        return;
                    }

                    (async () => {
                        const portal = new Portal()
                            .addCreature(PROTECTOR_TREE_ACTOR_ID)
                            .origin(token)
                            .range(30);

                        // Choose where to spawn the protector tree
                        await portal.pick();

                        // Check that there's an active GM in the game.
                        if (!game.users.activeGM) {
                            ui.notifications.error(this.localize("no-gamemaster.create"));
                            return;
                        }

                        const [protectorTreeToken] = await portal.spawn();
                        if (protectorTreeToken) {
                            Socket.call(
                                "initialiseProtectorTree",
                                {
                                    sceneId: token.scene.id,
                                    tokenId: protectorTreeToken.id,
                                    origin: {
                                        rank: Math.ceil(actor.level / 2),
                                        alliance: actor.alliance,
                                        signature: actor.signature
                                    }
                                }
                            );
                        }
                    })();
                }
            }
        );

        libWrapper.register(
            "pf2e-kineticists-companion",
            "CONFIG.PF2E.Actor.documentClasses.character.prototype.applyDamage",
            async (applyDamage, data) => await TimberSentinel.#applyDamage(applyDamage, data)
        );

        libWrapper.register(
            "pf2e-kineticists-companion",
            "CONFIG.PF2E.Actor.documentClasses.npc.prototype.applyDamage",
            async (applyDamage, data) => await TimberSentinel.#applyDamage(applyDamage, data)
        );
    }

    /**
     * @param {{sceneId: string, tokenId: string, origin:{alliance: string, rank: number, signature: stirng}}} data
     * @returns {Promise<void>}
     */
    static async #initialiseProtectorTree(data) {
        const scene = game.scenes.get(data.sceneId);
        if (!scene) {
            return;
        }

        // Find any other protector trees on the scene created, by the same actor, and delete their protector tree effects
        scene.tokens
            .map(tokenDocument => tokenDocument.object?.actor)
            .filter(actor => !!actor)
            .flatMap(actor => actor.itemTypes.effect.filter(effect => effect.sourceId === PROTECTOR_TREE_EFFECT_ID))
            .filter(protectorTreeEffect => protectorTreeEffect.flags["pf2e-kineticists-companion"]?.["origin-signature"] === data.origin.signature)
            .forEach(protectorTreeEffect => protectorTreeEffect.delete());

        // Find the new protector tree token and update its statistics for the rank and alliance
        const token = scene.tokens.get(data.tokenId);
        if (!token?.object?.actor) {
            return;
        }

        const actor = token.object.actor;

        const prototypeTokenSource = actor.prototypeToken.toObject();
        token.update(
            {
                "texture": prototypeTokenSource.texture,
                "bar1": prototypeTokenSource.bar1,
                "bar2": prototypeTokenSource.bar2,
                "displayName": prototypeTokenSource.displayName,
                "displayBars": prototypeTokenSource.displayBars
            }
        );

        await actor.update(
            {
                "system": {
                    "attributes.hp": {
                        "max": data.origin.rank * 10
                    }
                }
            }
        );

        // We need to do the current HP update after the max HP update
        actor.update({ "system.attributes.hp.value": data.origin.rank * 10 });

        // Add the new protector tree effect
        const protectorTreeEffectSource = (await fromUuid(PROTECTOR_TREE_EFFECT_ID)).toObject();
        protectorTreeEffectSource.flags["pf2e-kineticists-companion"] = {
            "alliance": data.origin.alliance,
            "origin-signature": data.origin.signature
        };

        actor.createEmbeddedDocuments("Item", [protectorTreeEffectSource]);
    }

    static async #applyDamage(wrapped, data) {
        // If the damage isn't from a strike, apply normally.
        if (!data.rollOptions.has("origin:action:slug:strike")) {
            return await wrapped(data);
        }

        // If the damage isn't being applied to a token, apply normally.
        const token = data.token?.object;
        if (!token) {
            return await wrapped(data);
        }

        // Find any adjacent tokens that have the Protector Tree effect
        const protectorTreeTokenIds = canvas.tokens.placeables
            .filter(protectorToken =>
                protectorToken.actor.itemTypes.effect.some(effect =>
                    effect.sourceId === PROTECTOR_TREE_EFFECT_ID &&
                    effect.flags["pf2e-kineticists-companion"]?.["alliance"] === token.actor.alliance
                )
            )
            .filter(protectorToken => protectorToken.isAdjacentTo(token))
            .map(protectorToken => protectorToken.document.uuid);

        if (!protectorTreeTokenIds.length) {
            return await wrapped(data);
        }

        if (!game.users.activeGM) {
            ui.notifications.warn(this.localize("no-gamemaster.intercept"));
            return await wrapped(data);
        }

        let remainingDamage = data.damage.total;
        if (game.user.isGM) {
            remainingDamage = await this.#damageProtectorTrees(protectorTreeTokenIds, remainingDamage);
        } else {
            remainingDamage = await Socket.call("damageProtectorTrees", protectorTreeTokenIds, remainingDamage);
        }

        // If we reduced the damage to 0, we don't need to apply the damage.
        if (remainingDamage == 0) {
            return;
        };

        data.damage = this.#buildReducedDamage(data.damage, data.damage.total - remainingDamage);

        return await wrapped(data);
    }

    /**
     * @param {string[]} tokenIds
     * @param {number} totalDamage
     */
    static async #damageProtectorTrees(tokenIds, totalDamage) {
        for (const tokenId of tokenIds) {
            const token = await fromUuid(tokenId);
            if (!token?.object?.actor) {
                continue;
            }

            const actor = token.object.actor;

            const currentHitPoints = actor.system.attributes.hp.value;
            if (currentHitPoints > totalDamage) {
                actor.update({ "system.attributes.hp.value": currentHitPoints - totalDamage });

                Chat.postToChat(
                    actor,
                    this.localize("take-damage", { name: token.name, damage: totalDamage }),
                    "systems/pf2e/icons/spells/protector-tree.webp"
                );

                return 0;
            } else {
                token.delete();

                Chat.postToChat(
                    actor,
                    this.localize("take-damage-destroyed", { name: token.name, damage: currentHitPoints }),
                    "systems/pf2e/icons/spells/protector-tree.webp"
                );

                totalDamage -= currentHitPoints;
                if (totalDamage <= 0) {
                    break;
                }
            }
        }

        return totalDamage;
    }

    static #buildReducedDamage(damage, damageToReduce) {
        const newDamage = damage.clone();

        newDamage._evaluated = true;
        newDamage._total = damage._total - damageToReduce;

        let iNewTerm = 0;
        for (let iTerm = 0; iTerm < damage.terms.length; iTerm++) {
            const instancePool = damage.terms[iTerm];
            const newInstancePool = newDamage.terms[iNewTerm];

            newInstancePool._evaluated = true;

            let iNewInstance = 0;
            for (let iInstance = 0; iInstance < instancePool.rolls.length; iInstance++) {
                const instance = instancePool.rolls[iInstance];
                const newInstance = newInstancePool.rolls[iNewInstance];

                if (instance._total > damageToReduce) {
                    newInstance._evaluated = true;
                    newInstance._total = instance._total - damageToReduce;
                    newInstancePool.results.push({ "result": newInstance._total, "active": true });

                    damageToReduce = 0;

                    iNewInstance++;
                } else {
                    newInstancePool.rolls.shift();

                    damageToReduce -= instance._total;
                }
            }
        }

        return newDamage;
    }
}
