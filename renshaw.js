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


var new_grid = function (url, callbacks) {

    var grid = {}, width, height;

    // Ren is the player character; he changes color, so he's got multiple sources.
    grid.ren = {x:0, y:3, 
                src:{white:"wren.png", green:"gren.png", orang:"oren.png"},
                color : "white"};

    var real_tile = function (tile) {
    // Acceptable architectural artifact.
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
        for(i=xmax-1; i>=Math.max(xmin, 0); i--){
            // this one goes backwards for rendering convenience.
            ret[i-xmin] = [];
            for(j=Math.max(ymin, 0); j<ymax; j++){
                ret[i-xmin][j-ymin] = f(i-xmin, j-ymin, grid.tiles[i][j], i, j);
            }
        }
        return ret;
    };

    // This one passes the actual tile
    grid.real_map = function (f, xmin, xmax, ymin, ymax) {
        return grid.map(function (i, j, tile, ri, rj){
                            f(i, j, real_tile(tile), ri, rj);
                        }, xmin, xmax, ymin, ymax);
    };

    var count = 0;

    grid.move = function (axis, dist) {
        // Move ren, call tile stepped on.
        count++;
        var ren = grid.ren;
        var prev = {x:ren.x, y:ren.y};
        ren.prev = prev;
        grid.ren[axis] += dist;
        if (ren.x < 0 || ren.x >= width ||
            ren.y < 0 || ren.y >= height ||
            !real_tile(grid.tiles[ren.x][ren.y]).step(ren)) {
            ren.x = prev.x; ren.y = prev.y;
            return false;
        }
        return true;
    };

    /** These are tile stepping-upon functions. They return true if
     * ren moves, and false if ren may not move there. **/

    var no_go = function (ren) {
        return false;
    };

    var color_step = function (ren) {
        if(ren.color !== this.color){
            return false;
        }
        return true;
    };

    var color_change = function (color) {
        return function (ren) {
            if (color_step.call(this, ren)) {
                ren.color = color;
                return true;
            }
            return false;
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
            return true;
        };
    };

    var slide = function (axis, dist){
        return function(ren){
            if (color_step.call(this, ren) && grid.move(axis, dist)) {
                    return true;
            }
            return false;
        };
    };

    var minor_save = function (ren) {
        grid.minor_saved = [ren.x, ren.y];
        return true;
    };

    grid.minor_load = function(){
        if (grid.minor_saved){
            grid.ren.x = grid.minor_saved[0];
            grid.ren.y = grid.minor_saved[1];
        }
    };

    var save = function (ren) {
        var s = [copy_obj(grid.tilemap), copy_obj(grid.ren)];
        grid.saved.push(s);
        return s;
    };
    grid.save = save;

    grid.load = function(tilemap, ren){
        if (tilemap && ren) {
            grid.tilemap = copy_obj(tilemap);
            grid.ren = copy_obj(ren);
        } else {
            var s = grid.saved.pop();        
            if(s) {
                grid.tilemap = copy_obj(s[0]);
                grid.ren = copy_obj(s[1]);
            }
        }
    };

    var dingsave = function (ren) {
        var t = [ren.x, ren.y];
        ren.x = ren.prev.x; ren.y = ren.prev.y;
        save();
        ren.x = t[0], ren.y = t[1];
        if (callbacks.ding)
            callbacks.ding(count);
        count = 0;
        grid.tiles[ren.x][ren.y].hash = "_";
        return true;
    };

    /** The default tile mapping **/

    // A through E are white and green tiles. 
    // M through T are arrows.
    // F through L introduce orange; T - X are orange arrows.
    // $ saves minor, *saves level; ~'s water.
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

                    "$": {id:"MSAVE", src:"msave.png", step : minor_save},
                    "*": {id:"SAVE", src:"save.png", step : dingsave},
                    "_": {id:"SAVED", src:"saved.png", step : function (ren) {
                              var t = [ren.x, ren.y];
                              ren.x = ren.prev.x; ren.y = ren.prev.y;
                              save();
                              ren.x = t[0], ren.y = t[1];
                              return true;
                          }},

                    "~": {id:"WATER", src:"water.png", step : no_go}

                   };

    /** Special Tiles **/
    
    // These are tiles that are rendered atop the mapped grid; they
    // are individual. they'll be arranged in blocks of 7*30; at no
    // time will I need to ask about more than two blocks. 

    grid.map_specials = function (f, xmin, xmax) {
        var i,
        loblock = grid.specials[Math.floor(Math.max(xmin, 0) / 22)],
        hiblock = grid.specials[Math.floor(Math.min(xmax, width) / 22)];
        if (loblock)
            for (i=loblock.length-1; i>=0; i--){
                if (loblock[i].x >= xmin && loblock[i].x < xmax)
                    f(loblock[i].x-xmin, loblock[i].y, loblock[i]);
            };
        if (hiblock && hiblock !== loblock)
            for (i=hiblock.length-1; i>=0; i--){
                if (hiblock[i].x >= xmin && hiblock[i].x < xmax)
                    f(hiblock[i].x-xmin, hiblock[i].y, hiblock[i]);
            };
    };

    /** Saving and loading a game grid **/

    grid.xport = function () {
        var ret = [], rs = [], i, j;
        for(i =0; i<width; i++){
            for(j =0; j<height; j++){
                rs[j] = grid.tiles[i][j].hash;
            }
            ret[i] = rs.join(""); 
        }
        return ret.join("\n");
    };

    grid.mport = function (save) {///gardening here TODO
        var i, j, cols = save.split("\n");
        width = cols.length;
        grid.tiles = [];
        for(i=0; i<width; i++){
            grid.tiles[i] = cols[i].split("");
            for(j =0; j<grid.tiles[i].length; j++){
                grid.tiles[i][j] = {hash:grid.tiles[i][j]};
            }
        } 
        height = grid.tiles[0].length;
    };

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

    grid.random_fill = function (w, h, set) {
        // This doesn't really belong here, but it will fill up with random tiles.
        // Set is a string of hashes: "ABCDE"
       // console.log(set);
        var i, j, ret=[];
        width = w; height = h;
        for(i=0; i<width; i++){
            ret[i] = [];
            for(j=0; j<height; j++){
                ret[i][j] = {hash :  set[Math.floor(Math.random()*set.length)]};
            }
        }
        grid.tiles = ret;
    };

    grid.add_row = function () {
        grid.tiles[grid.tiles.length] = $.extend(true, [], grid.tiles[grid.tiles.length-1]); 
        width++;
    };



    /** Load 'er up! **/

    $.ajax({url:url, dataType:"text", async:false, success:grid.mport});
    grid.specials = {//3:[{src:"baobad.png", x:66, y:2, offset:[-95, -287]}],
                     //3:[{src:"baobab.png", x:66, y:2, offset:[-110, -370]}]
                     //3:[{src:"clockwork.png", x:66, y:2, offset:[-50, -235]}]
    };

    grid.saved = [];
    return grid;
}