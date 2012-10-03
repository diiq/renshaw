/* This file defines the methods of game objects:

move(direction, distance); axis is 'x' or 'y', distance 1 or -1
map(function(x, y, tile); applies a function to every tile in grid
realmap applies a function to every mapped tile;

window_realmap(f, xmin, xmax, ymin, ymax) applies a function to every
tile in a window -- and x, y, ARE SHRUNK TO THAT DOMAIN; so when the
real x == xmin, it will be sent to f as 0.

Tiles provide functions for when they're stepped on.

There will also be special objects; this is not yet implemented.

*/


var new_grid = function (width, height) {

    var grid = {};

    // Ren is the player character; he changes color, so he's got multiple sources.
    grid.ren = {x:0, y:0, 
                src:{white:"wren.png", green:"gren.png", orang:"oren.png"},
                color : "white"};

    var real_tile = function (tile) {
    // Acceptable architechural artifact.
        return grid.tilemap[tile.hash];
    };


    grid.map = function (f, xmin, xmax, ymin, ymax) {
        // Silently ignore values outside domain.
        xmin = xmin || 0; 
        ymin = ymin || 0;
        xmax = xmax ? Math.min(xmax, width) : width; 
        ymax = ymax ? Math.min(ymax, height) : height;
        // f still sees this as running from 0 to some width, 
        // and 0 to some height, regardless of xmin and ymin.
        // Consider: is this the place to add content loading?
        var i, j, ret = [];
        for(i=xmax-1; i>=Math.min(Math.abs(xmin), 0); i--){
            // this one goes backwards for rendering convenience.
            ret[i-xmin] = [];
            for(j=Math.min(Math.abs(ymin), 0); j<ymax; j++){
                ret[i-xmin][j-ymin] = f(i-xmin, j-ymin, grid.tiles[i][j]);
            }
        }
        return ret;
    };

    // This one passes the actual tile
    grid.real_map = function (f, xmin, xmax, ymin, ymax) {
        return grid.map(function (i, j, tile){
                            f(i, j, real_tile(tile));
                        }, xmin, xmax, ymin, ymax);
    };


    grid.move = function (axis, dist) {
        // Move ren, call tile stepped on.
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

    /** These are tile stepping-upon functions. **/

    var no_go = function (ren) {
        ren.x = ren.prev.x; ren.y = ren.prev.y;
        return false;
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
        };
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

    var minor_save = function (ren) {
        grid.minor_saved = [ren.x, ren.y];
    };

    grid.minor_load = function(){
        if (grid.minor_saved){
            grid.ren.x = grid.minor_saved[0];
            grid.ren.y = grid.minor_saved[1];
        }
    };

    /** The default tile mapping **/

    // A through E are white and green tiles. 
    // M through T are arrows.
    // F through L introduce orange; T - X are orange arrows.
    // $ saves; ~'s water.
    // These lines are > 80 chars. Cope.
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

                    "$": {id:"SAVE", src:"save.png", step : minor_save},
                    "~": {id:"WATER", src:"water.png", step : no_go}

                   };

    /** Saving and loading a game grid **/

    grid.export = function () {
        var ret = [], rs = [], i, j;
        for(i =0; i<width; i++){
            for(j =0; j<height; j++){
                rs[j] = grid.tiles[i][j].hash;
            }
            ret[i] = rs.join(""); 
        }
        return ret.join("\n");
    };

    grid.import = function (save) {///gardening here TODO
        var i, j, cols = save.split("\n");
        width = cols.length;
        grid.tiles = [];
        for(i=0; i<width; i++){
            grid.tiles[i] = cols[i].split("");
            for(j =0; j<grid.tiles[i].length; j++){
                grid.tiles[i][j] = {hash:grid.tiles[i][j]};
            }
        } 
    };

    grid.tiles = function (width, height) {
        var i, j, ret=[];
        for(i=0; i<width; i++){
            ret[i] = [];
            for(j=0; j<height; j++){
                ret[i][j] = {hash : "ABCDE"[Math.floor(Math.random()*5)]};
            }
        }
        return ret;
    }(width, height);


    /** Saving and loading position, color, and tilemap **/

    var copy_obj = function (obj){
        var ret = {};
        for(var t in obj){
            if (obj.hasOwnProperty(t)){
                ret[t] = obj[t];
            }
        }
        return ret;
    };

    var save = function (ren) {
        grid.saved = [copy_obj(grid.tilemap), copy_obj(ren)];
    };

    grid.load = function(){
        grid.tilemap = copy_obj(grid.saved[0]);
        grid.ren = copy_obj(grid.saved[1]);
    };

    grid.saved = [copy_obj(grid.tilemap), copy_obj(grid.ren)];

    return grid;
}