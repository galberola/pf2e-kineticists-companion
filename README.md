# FVTT PF2e Kineticist's Companion
A module for the Foundry VTT Pathfinder 2e system that provides improved automation for the Kineticist class.

![Github All Releases](https://img.shields.io/github/downloads/JDCalvert/pf2e-kineticists-companion/total.svg)
![Github Latest Release](https://img.shields.io/github/downloads/JDCalvert/pf2e-kineticists-companion/1.2.0/total)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/jdcalvert)

## Issues and System Compatibility
This module is built for the Pathfinder 2e system, which receives regular updates, and some of those updates may occassionally break the functionality of this module. I will do my best to fix issues caused by updates, but this may require losing support for earlier versions of the system. Also, some parts of this module may require features/functions from the latest release of the Pathfinder 2e system.

In summary, each release of this module only officially supports the latest release of the Pathfinder 2e system at the time of release, which will be listed in the [Changelog](/CHANGELOG.md). If you encounter an issue, please make sure you're using the latest system version. If the issue persists on the most recent version, please [report it](https://github.com/JDCalvert/pf2e-kineticists-companion/issues/new)!

## Features

### Thermal Nimbus Automation
When you use the Thermal Nimbus stance, enemies inside the aura will receive the <b>Effect: Thermal Nimbus Damage</b> effect. If an enemy is inside the aura at the
start of its turn, or they move into the aura during their turn, the Thermal Nimbus damage will automatically be rolled and applied to that enemy.

<small><b>Note:</b> A gamemaster must be present for this damage to be applied automatically.</small>

### Fresh Produce Automation
When you use the Fresh Produce impulse, a Fresh Produce item is created in your target's inventory* (or your inventory, if you have no target). If you use Fresh
Produce on yourself in combat, or on anyone outside of combat, the item is posted to chat with a "use" button for easy immediate use. Using this item will
automatically apply the healing and the void resistance effect.

Any Fresh Produce items created are automatically deleted at the start of your next turn*.

<small>*A gamemaster or the actor's owner must be present.</small>
