import { Settings } from "./config/settings.js";
import { ArmorInEarth } from "./actions/armor-in-earth.js";
import { FreshProduce } from "./actions/fresh-produce.js";
import { ThermalNimbus } from "./actions/thermal-nimbus.js";
import { MetalCarapace } from "./actions/metal-carapace.js";
import { HardwoodArmor } from "./actions/hardwood-armor.js";

export let DamageRoll = null;

Hooks.on(
    "init",
    () => {
        DamageRoll = CONFIG.Dice.rolls.find((r) => r.name === "DamageRoll");

        Settings.initialise();

        ThermalNimbus.initialise();

        FreshProduce.initialise();

        ArmorInEarth.initialise();
        HardwoodArmor.initialise();
        MetalCarapace.initialise();
    }
);
