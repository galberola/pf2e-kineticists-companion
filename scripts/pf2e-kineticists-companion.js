import { ArmorInEarth } from "./actions/armor-in-earth.js";
import { FreshProduce } from "./actions/fresh-produce.js";
import { ThermalNimbus } from "./actions/thermal-nimbus.js";

export let DamageRoll = null;

Hooks.on(
    "init",
    () => {
        DamageRoll = CONFIG.Dice.rolls.find((r) => r.name === "DamageRoll");

        ThermalNimbus.initialise();
        FreshProduce.initialise();
        ArmorInEarth.initialise();
    }
);
