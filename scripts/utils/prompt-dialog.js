const localize = (key) => game.i18n.localize("pf2e-kineticists-companion.config." + key);

export class DialogPrompt {
    /**
     * @returns {Promise<{answer: boolean, remember: boolean}>}
     */
    static async prompt(title, question, allowRemember) {
        let content = `
            <p>${question}</p>
        `;

        if (allowRemember) {
            content += `
                <form>
                    <div class="form-group">
                        <input class="remember-checkbox" type="checkbox" id="remember-my-answer" name="remember-my-answer">
                        <label for="remember-my-answer">${localize("dialog.remember-my-answer")}</label>
                    </div>
                </form>
            `;
        }

        const Dialog = foundry.utils.isNewerVersion(game.version, "13") ? DialogV2 : DialogV1;
        return new Promise(result => new Dialog(title, content, result).render(true));
    }
}

class DialogV2 extends foundry.applications.api.DialogV2 {
    constructor(title, content, result) {
        super(
            {
                window: {
                    title
                },
                position: {
                    width: 600
                },
                content,
                buttons: [
                    {
                        action: "yes",
                        label: localize("dialog.yes"),
                        callback: () => result(
                            {
                                answer: true,
                                remember: this.remember
                            }
                        )
                    },
                    {
                        action: "no",
                        label: localize("dialog.no"),
                        callback: () => result(
                            {
                                answer: false,
                                remember: this.remember
                            }
                        )
                    }
                ]
            }
        );
        this.remember = false;
    }

    _onRender() {
        const checkboxes = this.element.querySelectorAll(`.remember-checkbox`);
        for (const checkbox of checkboxes) {
            checkbox.addEventListener(
                "change",
                (event) => this.remember = event.currentTarget.checked
            );
        }
    }
}

class DialogV1 extends Dialog {
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
        this.remember = false;
    }

    activateListeners(html) {
        html.find(".remember-checkbox").on(
            "change",
            event => this.remember = event.currentTarget.checked
        );

        super.activateListeners(html);
    }
}
