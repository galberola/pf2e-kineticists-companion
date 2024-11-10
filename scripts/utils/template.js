export class Template {
    static containsToken(tokenDocument, templateDocument, collisionMode = "move") {
        const grid = canvas.interface.grid;
        const dimensions = canvas.dimensions;

        if (!canvas.scene || !templateDocument.object.highlightId || !grid || !dimensions) {
            return false;
        }

        const gridHighlight = grid.getHighlightLayer(templateDocument.object.highlightId);
        if (!gridHighlight || canvas.grid.type !== CONST.GRID_TYPES.SQUARE) {
            return false;
        }

        const gridSize = canvas.grid.size;

        // Snap the token position to the grid
        const tokenX = Math.floor(tokenDocument.x / gridSize) * gridSize;
        const tokenY = Math.floor(tokenDocument.y / gridSize) * gridSize;

        const tokenPositions = [];

        for (let h = 0; h < tokenDocument.height; h++) {
            for (let w = 0; w < tokenDocument.width; w++) {
                tokenPositions.push(
                    {
                        x: tokenX + w * gridSize,
                        y: tokenY + h * gridSize
                    }
                );
            }
        }

        for (const position of tokenPositions) {
            if (!gridHighlight.positions.has(`${position.x},${position.y}`)) {
                continue;
            }

            const destination = {
                x: position.x + dimensions.size * 0.5,
                y: position.y + dimensions.size * 0.5
            };

            if (destination.x < 0 || destination.y < 0) {
                continue;
            }

            const hasCollision = CONFIG.Canvas.polygonBackends[collisionMode].testCollision(
                templateDocument.object.center,
                destination,
                {
                    type: collisionMode,
                    mode: "any"
                }
            );

            if (!hasCollision) {
                return true;
            }
        }

        return false;
    }
}
