import { Settings } from "./config/settings.js";
import { ArmorInEarth } from "./actions/armor-in-earth.js";
import { FreshProduce } from "./actions/fresh-produce.js";
import { ThermalNimbus } from "./actions/thermal-nimbus.js";
import { MetalCarapace } from "./actions/metal-carapace.js";
import { HardwoodArmor } from "./actions/hardwood-armor.js";
import { TimberSentinel } from "./actions/timber-sentinel.js";
import { Socket } from "./utils/socket.js";

Hooks.once(
    "socketlib.ready",
    () => {
        Socket.initialise();
    }
);

Hooks.on(
    "init",
    () => {
        // Config
        Settings.initialise();

        // Earth
        ArmorInEarth.initialise();

        // Fire
        ThermalNimbus.initialise();

        // Metal
        MetalCarapace.initialise();

        // Wood
        FreshProduce.initialise();
        HardwoodArmor.initialise();
        TimberSentinel.initialise();
    }
);
