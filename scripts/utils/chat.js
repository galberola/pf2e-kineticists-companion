export class Chat {
    static async postToChat(actor, message, imgPath) {
        ChatMessage.create(
            {
                type: CONST.CHAT_MESSAGE_STYLES.EMOTE,
                speaker: ChatMessage.getSpeaker({ actor }),
                content: await renderTemplate(
                    "./systems/pf2e/templates/chat/action/content.hbs",
                    {
                        imgPath,
                        message
                    }
                )
            }
        );
    }
}
