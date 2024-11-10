export class HookManager {
    /** @type Map<string, ((args: any) => boolean | Promise<boolean>)[] */
    static checks = new Map();

    /**
     * Register for an async function. If any of the checks return false, we'll stop processing the others. If they all return true, then the wrapped function
     * will be called. The checks may alter the arguments.
     * 
     * @param {string} key 
     * @param {(args: any) => boolean | Promise<boolean>} func
     */
    static registerCheck(key, func) {
        let checks = this.checks.get(key);
        if (!checks) {
            libWrapper.register(
                "pf2e-kineticists-companion",
                key,
                async (wrapper, ...args) => {
                    // Loop through the checks. If any of them return false, 
                    for (const check of this.checks.get(key)) {
                        if (!await check(...args)) {
                            return;
                        }
                    }

                    return await wrapper(...args);
                },
                "MIXED"
            );

            checks = [];
            this.checks.set(key, checks);
        }

        checks.push(func);
    }
}
