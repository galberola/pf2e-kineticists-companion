export class Util {
    static getFlags(object) {
        return object?.flags?.["pf2e-kineticists-companion"];
    }

    static findItem(actor, type, sourceId) {
        return actor.itemTypes[type].find(item => item.sourceId === sourceId);
    }
}
