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

grid.ren = {x:0, y:0, src:"ren.png", color : "white"};

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
    var ren = grid.ren,
        prev = {x:ren.x, y:ren.y};
    grid.ren[axis] += dist;
    if (ren.x < 0 || ren.x >= width ||
        ren.y < 0 || ren.y >= height) {
        ren.x = prev.x; ren.y = prev.y; // here, I begin to think .x is dumb.
    } else {
        ren.prev = prev;
        real_tile(grid.tiles[ren.x][ren.y]).step(ren);
    }
};

var color_step = function (ren) {
    if(ren.color !== this.color){
        ren.x = ren.prev.x;
        ren.y = ren.prev.y;
        return false;
    }
    return true;
};

var color_change = function (color) {
    return function (ren) {
        if (color_step.call(this, ren)) {
            ren.color = color;
        }
    }
};

grid.tilemap = {"A": {src:"white.png",  color:"white", step : color_step},
                "B": {src:"green.png",  color:"green", step : color_step},
                "C": {src:"wgchange.png", color:"white", step : color_change("green")},
                "D": {src:"gwchange.png", color:"green", step : color_change("white")}
};


return grid;
}