/* This file defines the game-logic of Renshaw's Disco. 
 *  
 * */


var new_grid = function (url, callbacks) {

    var grid = {}, width, height;

    grid.map = function (f, xmin, xmax, ymin, ymax) {
        // Silently ignores values outside domain.
        xmin = xmin || 0; 
        ymin = ymin || 0;
        xmax = (xmax === undefined) ? width : Math.min(xmax, width); 
        ymax = (ymax === undefined) ? height : Math.min(ymax, height);
        // f still sees this as running from 0 to some width, 
        // and 0 to some height, regardless of xmin and ymin.
        var i, j, ret = [];
        for(i=xmax-1; i>=Math.max(xmin, 0); i--){
            // This one goes backwards sheerly for rendering convenience.
            ret[i-xmin] = [];
            for(j=Math.max(ymin, 0); j<ymax; j++){
                ret[i-xmin][j-ymin] = f(i-xmin, j-ymin, grid.tiles[i][j], i, j);
            }
        }
        return ret;
    };

    grid.real_map = function (f, xmin, xmax, ymin, ymax) {
        return grid.map(function (i, j, tile, ri, rj){
                            f(i, j, grid.tilemap[tile.hash], ri, rj);
                        }, xmin, xmax, ymin, ymax);
    };



    grid.load = function(from){
        if (from instanceof Actor){
            var s = from.load();
            if(s) { 
                grid.tilemap = s;
            } else if (localStorage.saved_game){
                s = JSON.parse(localStorage.saved_game);
                from.load(s[1]);
                grid.tilemap = unbrief_tilemap(s[0]);
            }
        } else {
            grid.tilemap = copy_obj(from);
        }
    };



    // This is a count of steps since last * checkpoint.
    var count = 0;

    // This is a list of tilemap-operations waiting to be applied.
    var transitions = [];

    // This function will apply the waiting transitions; it returns
    // false if there are no transitions waiting.
    grid.transition = function () {
        if (transitions.length === 0) return false;
        for (var i = 0; i<transitions.length; i++){
            transitions[i]();
        }
        transitions = [];
        return true;
    };

    grid.move = function (actor, axis, dist) {
        // Move ren, call tile stepped on. Return false if move can't be made.
        // Checks for falling off, then calls the given tile's step method.
        if (actor.type === "player") count++;
        var prev = {x:actor.x, y:actor.y};
        actor.prev = prev;
        actor[axis] += dist;
        if (actor.x < 0 || actor.x >= width ||
            actor.y < 0 || actor.y >= height ||
            // Okay, I'm sorry for this one. Mea Culpa. Disculpe.
            !grid.tilemap[grid.tiles[actor.x][actor.y].hash].step(actor)) {
            actor.x = prev.x; actor.y = prev.y;
            return false;
        }
        actor.prev = prev;
        return true;
    };



    /** These are tile stepping-upon functions. They return true if
     * ren moves, and false if ren may not move there. **/
 
    var no_go = function (actor) { 
        // Can't step here.
        return false;
    };

    var color_step = function (actor) { 
        // Step here only if you're the right color.
        if(actor.color !== this.color){
            return false;
        }
        return true;
    };

    var color_change = function (color) {
        // Changes your color if you step here, to color.
        return function (actor) {
            if (color_step.call(this, actor)) {
                transitions.push(function () {
                                     actor.color = color;
                                 });
                return true;
            }
            return false;
        };
    };

    var map_swap = function (a){
        // Switches around the tilemap; takes a dictionary of ids to swap.
        return function (actor){
            if(actor.type !== "hater" && actor.type !== "possible") {
                transitions.push(
                    function () {
                        var ids = {};
                        for(tile in grid.tilemap){
                            ids[grid.tilemap[tile].id] = grid.tilemap[tile];
                        }
                        for(tile in grid.tilemap){
                            if (a[grid.tilemap[tile].id]) {
                                grid.tilemap[tile] = ids[a[grid.tilemap[tile].id]];
                            }
                        }
                    });
            }
            return true;
        };
    };

    var slide_memo = {};
    var slide = function (axis, dist){
        // Pushes you another step if you step here.
        return function(actor){
            // Note that this would cause infinite recursion if two arrows
            // point at one another; therefore, I memoize.
            var adr = "" + actor.x + actor.y; // fails when ymax > 10.
            if (slide_memo[adr] === "recursion")
                                     return false;
            slide_memo[adr] = "recursion";

            if (color_step.call(this, actor) && grid.move(actor, axis, dist)) {
                delete slide_memo[adr];
                return true;
            }

            delete slide_memo[adr];
            return false;
        };
    };

    var minor_save = function (actor) {
        // You can teleport to this spot if you step here. 
        actor.minor_save();
        return true;
    };

    var save_squares = {};
    var dingsave = function (actor) {
        // A checkpoint; saves your game and goes 'ding'
        if (actor.type === "player") {
            grid.tiles[actor.x][actor.y].hash = "_";
            if (!save_squares["" + actor.x + actor.y]){
                save_squares["" + actor.x + actor.y] = 
                    {color:actor.color, tilemap:brief_tilemap(grid.tilemap)};
            }
            transitions.push(function(){
                                 if (callbacks.ding)
                                     callbacks.ding(count);
                                 count = 0;
                                 grid.tiles[actor.x][actor.y].hash = "_";
                                 actor.color = save_squares["" + actor.x + actor.y].color;
                                 grid.tilemap = unbrief_tilemap(save_squares["" + actor.x + actor.y].tilemap);
                                 actor.save(grid);
                             });
        }
        return true;
    };

    var next_level = function (actor) {
        if(actor.type === "player"){
            grid.mport(grid.next_level);
            callbacks.next_level();
            actor.save(grid);
        } 
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
                    "*": {id:"SAVE", src:"save.png", otop:-25, oleft:-10, step : dingsave},
                    "^": {id:"NEXT", src:"save.png", otop:-25, oleft:-10, step : next_level},
                    "_": {id:"SAVED", src:"saved.png", step : function(){return true;}},

                    "~": {id:"WATER", src:"water.png", step : no_go}

                   };



    /** Special Tiles **/
    
    // These are tiles that are rendered atop the mapped grid; they
    // are individual. they'll be arranged in blocks of 7*30; at no
    // time will I need to ask about more than two blocks. 

    grid.map_specials = function (f, xmin, xmax) {
        // Map across specials. Assumes that the range is only one screenful.
        // A screenful is hard-coded at 22, at the moment, which is SILLY.
        // TODO: fix this.
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
                rs[j] = rs[j] == "_" ? "*" : rs[j]; 
            }
            ret[i] = rs.join(""); 
        }
        return JSON.stringify({grid: ret.join(":"), save_squares:save_squares, url:"", next_url:""});
    };

    grid.mport = function (save) {///gardening here TODO
        save_squares = save.save_squares;
        grid.url = save.url;
        var i, j, cols = save.grid.split(":");
        width = cols.length;
        grid.tiles = [];
        for(i=0; i<width; i++){
            grid.tiles[i] = cols[i].split("");
            for(j =0; j<grid.tiles[i].length; j++){
                grid.tiles[i][j] = {hash:grid.tiles[i][j]};
            }
        } 
        $.ajax({url:save.next_url, dataType:"json", async:true, 
                success:function(e) {grid.next_level = e;}});

        height = grid.tiles[0].length;
    };

    /** Saving and loading position, color, and tilemap **/


    grid.random_fill = function (w, h, set) {
        // This doesn't really belong here, but it will fill up with random tiles.
        // Set is a string of hashes: "ABCDE"
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
        // Adds a row to tiles. Used for the level editor; 
        // could be removed from release.
        grid.tiles[grid.tiles.length] = $.extend(true, [], grid.tiles[grid.tiles.length-1]); 
        width++;
    };
    


    /** Load 'er up! **/

    $.ajax({url:url, dataType:"json", async:false, success:grid.mport});

    grid.specials = {//3:[{src:"baobad.png", x:66, y:2, offset:[-95, -287]}],
                     //3:[{src:"baobab.png", x:66, y:2, offset:[-110, -370]}]
                     //3:[{src:"clockwork.png", x:66, y:2, offset:[-50, -235]}]
    };

   return grid;
};