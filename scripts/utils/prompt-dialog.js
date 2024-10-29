const localize = (key) => game.i18n.localize("pf2e-kineticists-companion.config." + key);

export class DialogPrompt extends Dialog {
    constructor(title, content, result) {
        super(
            {
                title,
                content,
                buttons: {
                    "yes": {
                        label: localize("dialog.yes"),
                        callback: () => result(
                            {
                                answer: true,
                                remember: this.remember
                            }
                        )
                    },
                    "no": {
                        label: localize("dialog.no"),
                        callback: () => result(
                            {
                                answer: false,
                                remember: this.remember
                            }
                        )
                    }
                }
            }
        );
    }

    static async prompt(title, question) {
        let content = `<p>${question}</p>`

        content += `
            <form>
                <div class="form-group">
                    <input class="remember-checkbox" type="checkbox" id="remember-my-answer" name="remember-my-answer">
                    <label for="remember-my-answer">${localize("dialog.remember-my-answer")}</label>
                </div>
            </form>
        `

        return new Promise(result => new DialogPrompt(title, content, result).render(true));
    }

    activateListeners(html) {
        html.find(".remember-checkbox").on(
            "change",
            event => this.remember = event.currentTarget.checked
        );

        super.activateListeners(html);
    }
}
