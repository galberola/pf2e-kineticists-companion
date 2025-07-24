import { ArmorInEarth } from "./actions/armor-in-earth.js";
import { DashOfHerbs } from "./actions/dash-of-herbs.js";
import { FreshProduce } from "./actions/fresh-produce.js";
import { HardwoodArmor } from "./actions/hardwood-armor.js";
import { IgniteTheSun } from "./actions/ignite-the-sun.js";
import { KindleInnerFlames } from "./actions/kindle-inner-flames.js";
import { MetalCarapace } from "./actions/metal-carapace.js";
import { OceansBalm } from "./actions/oceans-balm.js";
import { Sustain } from "./actions/sustain.js";
import { ThermalNimbus } from "./actions/thermal-nimbus.js";
import { TimberSentinel } from "./actions/timber-sentinel.js";
import { TorrentInTheBlood } from "./actions/torrent-in-the-blood.js";
import { Settings } from "./config/settings.js";
import { Damage } from "./utils/damage.js";
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

        // Utility
        Damage.initialise();

        // Action
        Sustain.initialise();

        // Earth
        ArmorInEarth.initialise();

        // Fire
        ThermalNimbus.initialise();
        IgniteTheSun.initialise();
        KindleInnerFlames.initialise();

        // Metal
        MetalCarapace.initialise();

        // Water
        OceansBalm.initialise();
        TorrentInTheBlood.initialise();

        // Wood
        DashOfHerbs.initialise();
        FreshProduce.initialise();
        HardwoodArmor.initialise();
        TimberSentinel.initialise();
    }
);
