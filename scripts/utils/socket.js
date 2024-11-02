export class Socket {
    static socket;

    static initialise() {
        this.socket = socketlib.registerModule("pf2e-kineticists-companion");
    }

    static register(name, handler) {
        this.socket.register(name, handler)
    }
    
    static async call(name, ...args) {
        return await this.socket.executeAsGM(name, ...args);
    }
}
