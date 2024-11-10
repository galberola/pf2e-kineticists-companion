export class SelectDialog extends Dialog {
    constructor(title, content, items, result) {
        super(
            {
                title,
                content,
                buttons: {}
            },
            {
                height: "100%",
                width: "100%",
                id: "item-dialog"
            }
        );
        this.items = new Map(items.map(item => [item.id, item]));
        this.result = result;
    }

    static async selectItem(title, header, items) {
        let content = `
            <div class="item-buttons" style="min-width: 200px; max-width: max-content; justify-items: center; margin: auto;">
                <p style="width: 200px; min-width: 100%">${header}</p>
        `;

        content += `
                <fieldset style="border: 1px solid #a1a1a1; padding: 5px;">
            `;

        for (const item of items) {
            content += `
                <button
                    class="item-button"
                    type="button"
                    value="${item.id}"
                    style="display: flex; align-items: center; margin: 4px auto"
                >
                    <img src="${item.img}" style="border: 1px solid #444; height: 1.6em; margin-right: 0.5em"/>
                    <span>${item.name}</span>
                </button>
            `;
        }

        content += `</fieldset>`;

        content += `
            </div>
        `;

        return new Promise(result => new SelectDialog(title, content, items, result).render(true));
    }

    activateListeners(html) {
        html.find(".item-button").on(
            "click",
            event => {
                this.itemId = event.currentTarget.value;
                this.close();
            }
        );

        super.activateListeners(html);
    }

    async close() {
        await super.close();
        if (this.itemId) {
            this.result(this.items.get(this.itemId));
        } else {
            this.result(null);
        }
    }
}
