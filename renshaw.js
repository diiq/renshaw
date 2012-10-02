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

grid.ren = {x:0, y:0, src:{white:"wren.png", green:"gren.png", orang:"oren.png"}, color : "white"};

var real_tile = function (tile) {
    if (tile.hash) return grid.tilemap[tile.hash];
    return tile;
};

grid.map = function (f) {
    var i, j, ret = [];
    for(i=0; i<width; i++){
        ret[i] = [];
        for(j=0; j<height; j++){
           ret[i][j] = f(i, j, grid.tiles[i][j]);
        }
    }
    return ret;
};

grid.realmap = function (f) {
    var i, j, ret = [];
    for(i=0; i<width; i++){
        ret[i] = [];
        for(j=0; j<height; j++){
           ret[i][j] = f(i, j, real_tile(grid.tiles[i][j]));
        }
    }
    return ret;
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

var map_swap = function (a, b){
  var swap = function(a, b){
    var t, at, bt;
    for (tile in grid.tilemap){
        if(grid.tilemap[tile].id === a) at = tile;
        if(grid.tilemap[tile].id === b) bt = tile;
    }
    t = grid.tilemap[at];
    grid.tilemap[at] = grid.tilemap[bt];
    grid.tilemap[bt] = t;
  };
  return function (ren){
      for(var i=0; i<a.length; i++){
          swap(a[i], b[i]);
      }
  };
};

var slide = function (axis, dist){
    return function(ren){
        if (color_step.call(this, ren)) {
            grid.move(axis, dist);
        }
    };
};

var copy_obj = function (obj){
    var ret = {};
    for(var t in obj){
        if (obj.hasOwnProperty(t)){
            ret[t] = obj[t];
        }
    }
    return ret;
}

var save = function (ren) {
    grid.saved = [copy_obj(grid.tilemap), copy_obj(ren)];
}

grid.load = function(){
    grid.tilemap = copy_obj(grid.saved[0]);
    grid.ren = copy_obj(grid.saved[1]);
}
// A through E are white and green tiles. 
// M through 
// F through L introduce orange.

grid.tilemap = {"A": {id:"white", src:"white.png",  color:"white", step : color_step},
                "B": {id:"green", src:"green.png",  color:"green", step : color_step},
                "F": {id:"orang", src:"orang.png",  color:"orang", step : color_step},

                "C": {id:"WGC", src:"wgchange.png", color:"white", step : color_change("green")},
                "D": {id:"GWC", src:"gwchange.png", color:"green", step : color_change("white")},
                "G": {id:"OGC", src:"ogchange.png", color:"orang", step : color_change("green")},
                "H": {id:"GOC", src:"gochange.png", color:"green", step : color_change("orang")},
                "I": {id:"OWC", src:"owchange.png", color:"orang", step : color_change("white")},
                "J": {id:"WOC", src:"wochange.png", color:"white", step : color_change("orang")},

                "E": {id:"GWS", src:"gwswap.png", step : map_swap(["white", 
                                                                   "WSL",
                                                                   "WSR",
                                                                   "WSU",
                                                                   "WSD"], ["green",
                                                                            "GSL",
                                                                            "GSR",
                                                                            "GSU",
                                                                            "GSD"])},
                "K": {id:"OWS", src:"owswap.png", step : map_swap(["orang", 
                                                                   "OSL",
                                                                   "OSR",
                                                                   "OSU",
                                                                   "OSD"], ["green",
                                                                            "GSL",
                                                                            "GSR",
                                                                            "GSU",
                                                                            "GSD"])},
                "L": {id:"GOS", src:"goswap.png", step : map_swap(["white", 
                                                                   "WSL",
                                                                   "WSR",
                                                                   "WSU",
                                                                   "WSD"], ["orang",
                                                                            "OSL",
                                                                            "OSR",
                                                                            "OSU",
                                                                            "OSD"])},

                "M": {id:"WSL", src:"wleft.png", color:"white", step : slide("x", -1)},
                "N": {id:"WSR", src:"wrigh.png", color:"white", step : slide("x", 1)},
                "O": {id:"WSD", src:"wdown.png", color:"white", step : slide("y", 1)},
                "P": {id:"WSU", src:"wupup.png", color:"white", step : slide("y", -1)},

                "Q": {id:"GSL", src:"gleft.png", color:"green", step : slide("x", -1)},
                "R": {id:"GSR", src:"grigh.png", color:"green", step : slide("x", 1)},
                "S": {id:"GSD", src:"gdown.png", color:"green", step : slide("y", 1)},
                "T": {id:"GSU", src:"gupup.png", color:"green", step : slide("y", -1)},

                "U": {id:"OSL", src:"oleft.png", color:"orang", step : slide("x", -1)},
                "V": {id:"OSR", src:"origh.png", color:"orang", step : slide("x", 1)},
                "W": {id:"OSD", src:"odown.png", color:"orang", step : slide("y", 1)},
                "X": {id:"OSU", src:"oupup.png", color:"orang", step : slide("y", -1)},

                "$": {id:"SAVE", src:"save.png", step : save},


};

grid.export = function () {
     var ret = [], rs = [], i, j;
     for(i =0; i<width; i++){
         for(j =0; j<height; j++){
             rs[j] = grid.tiles[i][j].hash;
         }
         ret[i] = rs.join(","); 
     }
     return ret.join(";");
}

grid.load_save = function (save) {///gardening here TODO
     var i, j;
     cols = save.split(";")
     width = cols.length;
     grid.tiles = [];
     for(i=0; i<width; i++){
         grid.tiles[i] = cols[i].split(",");
         for(j =0; j<grid.tiles[i].length; j++){
             grid.tiles[i][j] = {hash:grid.tiles[i][j]}
         }
     } 
}

grid.tiles = function (width, height) {
    var i, j, ret=[];
    for(i=0; i<width; i++){
        ret[i] = [];
        for(j=0; j<height; j++){
            ret[i][j] = {hash : "ABCDE$"[Math.floor(Math.random()*6)]}
        }
    }
    return ret;
}(width, height);

grid.saved = [copy_obj(grid.tilemap), copy_obj(grid.ren)];

return grid;
}