import { Settings } from "../config/settings.js";
import { Document } from "./document.js";
import { User } from "./user.js";
import { Util } from "./util.js";

export class Damage {
    static initialise() {
        Hooks.on(
            "createChatMessage",
            message => {
                if (!message.item) {
                    return;
                }

                const flags = Util.getFlags(message)?.["applyDamage"];
                if (!flags) {
                    return;
                }

                if (!Settings.get(`${message.item.slug}-apply-damage`)) {
                    return;
                }

                const tokenId = flags["tokenId"];
                const token = Document.get(tokenId);
                if (!token) {
                    return;
                }

                const preferredUpdater = User.getPreferredUpdater(token.actor);
                if (preferredUpdater === game.user) {
                    token.actor.applyDamage(
                        {
                            damage: message.rolls[0],
                            token: token,
                            item: message.item,
                            rollOptions: new Set(
                                [
                                    ...message.flags?.pf2e?.context?.options?.map(option => option.replace(/^self:/, "origin:")) ?? [],
                                    ...token.actor.getRollOptions()
                                ]
                            )
                        }
                    );
                } else if (!preferredUpdater) {
                    ui.notifications.warn(this.localize("no-user.apply-damage"));
                    return;
                }
            }
        );
    }
}
