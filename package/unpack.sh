# Set up FVTT CLI to point to this folder
fvtt configure set dataPath E:/Foundry/Data/dev/foundrydata-v12-dev
fvtt package workon "pf2e-kineticists-companion" --type "Module"

rm -r packs-source

fvtt package unpack effects --in packs --out packs-source/effects
fvtt package unpack items --in packs --out packs-source/items
