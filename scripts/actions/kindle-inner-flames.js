const KINDLE_INNER_FLAMES_EFFECT_ID = "Compendium.pf2e.feat-effects.Item.bWvOkRT3alzllsiG";
const AURA_JUNCTION_EFFECT_ID = "Compendium.pf2e.feat-effects.Item.QOWjsM4GYUHw6pFA";

export class KindleInnerFlames {
    static initialise() {
        Hooks.on(
            "preCreateItem",
            item => {
                if (item.sourceId === KINDLE_INNER_FLAMES_EFFECT_ID) {
                    item._source.system.rules.push(
                        {
                            key: "RollOption",
                            option: "kindle-inner-flames-damage",
                            toggleable: true,
                            label: "Have taken a move action this turn"
                        },
                        {
                            key: "RollOption",
                            option: "kindle-inner-flames:origin:{item|origin.signature}"
                        },
                        {
                            key: "FlatModifier",
                            selector: "strike-damage",
                            damageType: "fire",
                            value: 2,
                            label: "Kindle Inner Flames",
                            predicate: [
                                "kindle-inner-flames-damage",
                                {
                                    "lt": [
                                        "parent:origin:level",
                                        12
                                    ]
                                }
                            ]
                        },
                        {
                            key: "AdjustStrike",
                            mode: "add",
                            property: "property-runes",
                            value: "flaming",
                            predicate: [
                                "kindle-inner-flames-damage",
                                {
                                    "gte": [
                                        "parent:origin:level",
                                        12
                                    ]
                                }
                            ]
                        }
                    );
                } else if (item.sourceId === AURA_JUNCTION_EFFECT_ID) {
                    item._source.system.rules = [
                        {
                            key: "Weakness",
                            type: "custom",
                            label: "PF2E.IWR.Custom.ImpulseFireFrom",
                            definition: [
                                "damage:type:fire",
                                {
                                    or: [
                                        {
                                            and: [
                                                "origin:signature:{item|origin.signature}",
                                                "item:trait:impulse"
                                            ]
                                        },
                                        {
                                            and: [
                                                "kindle-inner-flames:origin:{item|origin.signature}",
                                                "kindle-inner-flames-damage",
                                                "action:strike"
                                            ]
                                        }
                                    ]
                                }
                            ],
                            value: "max(1, floor(@item.level/2))"
                        }
                    ];
                }
            }
        );
    }
}
