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


var new_grid = function (width, height) {

var grid = {};

grid.ren = {x:0, y:0, src:"ren.png"};

var real_tile = function (tile) {
    if (tile.hash) return grid.tilemap[tile.hash];
    return tile;
};

grid.tiles = function (width, height) {
    var i, j, ret=[];
    for(i=0; i<width; i++){
        ret[i] = [];
        for(j=0; j<height; j++){
            ret[i][j] = {hash : "A"}
        }
    }
    return ret;
}(width, height);

grid.map = function (f) {
    var i, j, ret = [];
    for(i=0; i<width; i++){
        ret[i] = [];
        for(j=0; j<height; j++){
            ret[i][j] = f(i, j, real_tile(grid.tiles[i][j]));
        }
    }
};

grid.move = function (axis, dist) {
    grid.ren[axis] += dist;
};

grid.tilemap = {"A": {src:"white.png", on_step : function () {}}};


return grid;
}