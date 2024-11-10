
export class Document {
    static async getSource(uuid) {
        return (await fromUuid(uuid)).toObject();
    }

    static get(uuid) {
        return fromUuidSync(uuid);
    }
}
