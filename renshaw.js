/* This file defines the methods of game objects:

move(direction, distance); axis is 'x' or 'y', distance 1 or -1
map(function(x, y, tile); applies a function to every tile in grid
realmap applies a function to every mapped tile;

window_realmap(f, xmin, xmax, ymin, ymax) applies a function to every
tile in a window -- and x, y, ARE SHRUNK TO THAT DOMAIN; so when the
real x == xmin, it will be sent to f as 0.

Tiles provide functions for when they're stepped on.

There will also be special objects; this is not eyt implemented.

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
    for(i=width-1; i>=0; i--){
        ret[i] = [];
        for(j=0; j<height; j++){
           ret[i][j] = f(i, j, grid.tiles[i][j]);
        }
    }
    return ret;
};

grid.realmap = function (f) {
    var i, j, ret = [];
    for(i=width-1; i>=0; i--){
        ret[i] = [];
        for(j=0; j<height; j++){
           ret[i][j] = f(i, j, real_tile(grid.tiles[i][j]));
        }
    }
    return ret;
};

grid.window_realmap = function (f, xmin, xmax, ymin, ymax) {
// Right now, no loading, no fancy: just ignore it when we get to the edge.
    var i, j, ret = [];
    for(i=Math.min(xmax-1, width-1); i>=Math.min(ymin, 0); i--){
        ret[i-xmin] = [];
        for(j=Math.min(ymin, 0); j<Math.min(ymax, height); j++){
           ret[i-xmin][j-ymin] = f(i-xmin, j-ymin, real_tile(grid.tiles[i][j]));
        }
    }
    return ret;
};

grid.move = function (axis, dist) {
    var ren = grid.ren;
    ren.prev = {x:ren.x, y:ren.y};
    grid.ren[axis] += dist;
    if (ren.x < 0 || ren.x >= width ||
        ren.y < 0 || ren.y >= height) {
        no_go(ren);
    } else {
        real_tile(grid.tiles[ren.x][ren.y]).step(ren);
    }
};

var no_go = function (ren) {
    ren.x = ren.prev.x; ren.y = ren.prev.y;
    return false;
}

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

var map_swap = function (a){
    return function (ren){
      var ids = {};
      for(tile in grid.tilemap){
          ids[grid.tilemap[tile].id] = grid.tilemap[tile];
      }
      for(tile in grid.tilemap){
          if (a[grid.tilemap[tile].id]) {
              grid.tilemap[tile] = ids[a[grid.tilemap[tile].id]];
          }
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

                "E": {id:"GWS", src:"gwswap.png", step : map_swap(
                    {"white":"green",
                     "WSL":"GSL",
                     "WSR":"GSR",
                     "WSU":"GSU",
                     "WSD":"GSD",
                     "green":"white",
                     "GSL":"WSL",
                     "GSR":"WSR",
                     "GSU":"WSU",
                     "GSD":"WSD"})}, 
                "K": {id:"OWS", src:"owswap.png", step : map_swap(
                    {"white":"orang",
                     "WSL":"OSL",
                     "WSR":"OSR",
                     "WSU":"OSU",
                     "WSD":"OSD",
                     "orang":"white",
                     "OSL":"WSL",
                     "OSR":"WSR",
                     "OSU":"WSU",
                     "OSD":"WSD"})}, 
                "L": {id:"GOS", src:"goswap.png", step : map_swap(
                    {"green":"orang",
                     "GSL":"OSL",
                     "GSR":"OSR",
                     "GSU":"OSU",
                     "GSD":"OSD",
                     "orang":"green",
                     "OSL":"GSL",
                     "OSR":"GSR",
                     "OSU":"GSU",
                     "OSD":"GSD"})}, 

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

                "Y": {id:"RCL", src:"clock.png", step : map_swap(
                       {"WSL":"WSU",
                        "GSL":"GSU",
                         "OSL":"OSU",
                         "WSU":"WSR",
                         "GSU":"GSR",
                         "OSU":"OSR",
                         "WSR":"WSD",
                         "GSR":"GSD",
                         "OSR":"OSD",
                         "WSD":"WSL",
                         "GSD":"GSL",
                         "OSD":"OSL"})},

                "Z": {id:"RCC", src:"cclock.png", step : map_swap(
                       {"WSL":"WSD",
                        "GSL":"GSD",
                        "OSL":"OSD",
                        "WSU":"WSL",
                        "GSU":"GSL",
                        "OSU":"OSL",
                        "WSR":"WSU",
                        "GSR":"GSU",
                        "OSR":"OSU",
                        "WSD":"WSR",
                        "GSD":"GSR",
                        "OSD":"OSR"})},

                "$": {id:"SAVE", src:"save.png", step : save},
                "~": {id:"WATER", src:"water.png", step : no_go},

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

grid.import = function (save) {///gardening here TODO
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
            ret[i][j] = {hash : "ABCDE"[Math.floor(Math.random()*5)]}
        }
    }
    return ret;
}(width, height);

grid.saved = [copy_obj(grid.tilemap), copy_obj(grid.ren)];

return grid;
}