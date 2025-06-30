export class Util {
    static getFlags(object) {
        return object?.flags?.["pf2e-kineticists-companion"];
    }

    static findItem(actor, type, sourceId) {
        return actor.itemTypes[type].find(item => item.sourceId === sourceId);
    }

    static isUsingApplicationV2() {
        return foundry.utils.isNewerVersion(game.version, "13");
    }

    static async render(path, data) {
    if (this.isUsingApplicationV2()) {
        return foundry.applications.handlebars.renderTemplate(path, data);
    } else {
        return renderTemplate(path, data);
    }
}
}
