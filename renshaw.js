/* This file defines the methods of game objects:

move(direction, distance); axis is 'x' or 'y', distance 1 or -1
map(function(x, y, tile); applies a function to every tile in grid

It also defines tile objects, of which I imagine two sorts:
  mappable tiles, which are mostly identical, accessed through a tilemap, and
  direct tiles, which are not.

This difference is flagged by tile.hash, teh presence of which signals a mapped tile.

Tiles provide functions for two actions:
initialization and
being stepped on

Initialization lets tiles register for additional callbacks on player action.

*/