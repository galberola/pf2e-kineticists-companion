import { Settings } from "./config/settings.js";
import { ArmorInEarth } from "./actions/armor-in-earth.js";
import { FreshProduce } from "./actions/fresh-produce.js";
import { ThermalNimbus } from "./actions/thermal-nimbus.js";
import { MetalCarapace } from "./actions/metal-carapace.js";
import { HardwoodArmor } from "./actions/hardwood-armor.js";

Hooks.on(
    "init",
    () => {
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
    }
);
