# Set up FVTT CLI to point to this folder
fvtt configure set dataPath E:/Foundry/Data/dev/foundrydata-v12-dev
fvtt package workon "pf2e-kineticists-companion" --type "Module"

rm -r packs

fvtt package pack actors --in packs-source/actors --out packs
fvtt package pack items --in packs-source/items --out packs

7z u pf2e-kineticists-companion.zip -uq0 assets/ lang/ packs/ scripts/ CHANGELOG.md module.json README.md
