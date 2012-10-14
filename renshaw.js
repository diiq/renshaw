/* This file defines the game-logic of Renshaw's Disco. 
 * There are four important data structures:
 *     grid.tiles --- a 2D array of objects; each has a .hash member, 
 *                    which refers *indirectly* to a tile object.
 *     grid.tilemap - the mapping from hash to tile objects. Altering the tilemap
 *                    alters every tile in the grid -- this is how transitions such as
 *                    green/white swaps and arrow rotations are accomplished.
 *     grid.ren ----- an object representing the player character; has position
 *                    (.x, .y), a previous position (.prev), 
 *                    a color (the player can change color) and 
 *                    img sources (as a dictionary, by color).  
 *     grid.specials  an array, indexed by blocks of adjacent x-rows, of 
 *                    tile-like objects. These are one-offs, for special effects.
 * 
 *     Tile objects include an id, an img source, and a function to be called if the
 *     player steps on that tile.
 * 
 * Important methods of grid include: 
 * 
 *     map(function, xmin, xmax, ymin, ymax), 
 *         which maps a function across tiles in grid.tiles in a given range. 
 *         all args bu function are optional.
 * 
 *     real_map(function, xmin, xmax, ymin, ymax), 
 *         which maps a function across tiles, after they are converted to tile objects
 *         all args but function are optional.
 * 
 *     map_specials(function, xmin, xmax),
 *         which maps a function across the special tiles in a given range.
 *  
 *     save(fake),
 *         which permanently saves the current game state (temporarily, if fake is true)
 * 
 *     load(tilemap, ren)
 *         which loads a game. Both arguments are optional; loads from save w/ no args.
 * 
 *     move(axis, dist, fake)
 *         which represents a player movement; axis is "x" or "y" and distance is 
 *         usually 1 or -1. Returns false if movement is disallowed. If fake is true, 
 *         all transitions caused by the movement are enacted *immediately*; otherwise,
 *         they are postponed until transition() is called.
 * 
 *     transition()
 *         which enacts all postponed transitions. These are usually changes to the 
 *         tilemap, or alterations to ren. Returns false if none waiting.
 * 
 *     xport() and mport(s), which produce and read grid.tiles to and a string
 * 
 *     random_fill(width, height, set)
 *         which creates a new grid filled with random tiles, hashes 
 *         chosen from the list 'set'
 * 
 *     This should be UI neutral, but you will have to pass in two externalities 
 *     when making a new grid;  a url from which to load an mport, 
 *     and an object of callbacks, currently only containing 'ding', a function to 
 *     perform on 'save', because it was easier that way. Pooh.
 *  
 * */


var new_grid = function (url, callbacks) {

    var grid = {}, width, height;

    // Ren is the player character; he changes color, so he's got multiple sources.
    grid.ren = {x:0, y:3, 
                src:{white:"wren.png", green:"gren.png", orang:"oren.png"},
                color : "white",
                prev:{x:0, y:3}};



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



    grid.save = function (fake) {
        var s = [copy_obj(grid.tilemap), copy_obj(grid.ren)];
        grid.saved = s;
        // Long term save uses localStorage. Fails in IE7.
        if (!fake){
            // To safely stringify the tilemap, convert to id/hash pairs.
            var tm = {};
            for (var ch in grid.tilemap){
                tm[grid.tilemap[ch].id] = ch;
            }
            localStorage.saved_game = JSON.stringify([tm, s[1]]);
        }
       return s;
    };

    grid.load = function(tilemap, ren){
        if (tilemap && ren) {
            grid.tilemap = copy_obj(tilemap);
            grid.ren = copy_obj(ren);
        } else {
            var s =  grid.saved;
            if(s) {
                grid.tilemap = copy_obj(s[0]);
                grid.ren = copy_obj(s[1]);
            } else if (localStorage.saved_game){
                s = JSON.parse(localStorage.saved_game);
                grid.ren = s[1];
                var newtm = {};
                // Convert back from hash/id pairs.
                for (var ch in grid.tilemap){
                    newtm[s[0][grid.tilemap[ch].id]] = grid.tilemap[ch];
                }
                grid.tilemap = newtm;
                console.log(newtm);
            }
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

    grid.move = function (axis, dist, fake) {
        // Move ren, call tile stepped on. Return false if move can't be made.
        // Checks for falling off, then calls the given tile's step method.
        if (!fake) count++;
        var ren = grid.ren;
        var prev = {x:ren.x, y:ren.y};
        ren.prev = prev;
        grid.ren[axis] += dist;
        if (ren.x < 0 || ren.x >= width ||
            ren.y < 0 || ren.y >= height ||
            // Okay, I'm sorry for this one. Mea Culpa. Disculpe.
            !grid.tilemap[grid.tiles[ren.x][ren.y].hash].step(ren, fake)) {
            ren.x = prev.x; ren.y = prev.y;
            return false;
        }
        if (fake) grid.transition();
        ren.prev = prev;
        return true;
    };



    /** These are tile stepping-upon functions. They return true if
     * ren moves, and false if ren may not move there. **/

    var no_go = function (ren) { 
        // Can't step here.
        return false;
    };

    var color_step = function (ren) { 
        // Step here only if you're the right color.
        if(ren.color !== this.color){
            return false;
        }
        return true;
    };

    var color_change = function (color) {
        // Changes your color if you step here, to color.
        return function (ren) {
            if (color_step.call(this, ren)) {
                transitions.push(function () {
                                     ren.color = color;
                                     });
                return true;
            }
            return false;
        };
    };

    var map_swap = function (a){
        // Switches around the tilemap; takes a dictionary of ids to swap.
        return function (ren){
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
            return true;
        };
    };

    // TODO memoize to avoid infinite regression? Or change behavior entirely?
    // If two arrows point to one another, this hangs and then blows the stack.
    var slide = function (axis, dist){
        // Pushes you another step if you step here.
        return function(ren){
            if (color_step.call(this, ren) && grid.move(axis, dist)) {
                    return true;
            }
            return false;
        };
    };

    var minor_save = function (ren) {
        // You can teleport to this spot if you step here. 
        grid.minor_saved = [ren.x, ren.y];
        return true;
    };

    grid.minor_load = function(){
        // Teleport back to that spot (minor_save)
        if (grid.minor_saved){
            grid.ren.x = grid.minor_saved[0];
            grid.ren.y = grid.minor_saved[1];
        }
    };

    var dingsave = function (ren, fake) {
        // A checkpoint; saves your game and goes 'ding'
        if (!fake) {
            grid.save();
            transitions.push(function(){
                                 if (callbacks.ding)
                                     callbacks.ding(count);
                                 count = 0;
                                 grid.tiles[ren.x][ren.y].hash = "_";
                             });
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

    $.ajax({url:url, dataType:"text", async:false, success:grid.mport});
    grid.specials = {//3:[{src:"baobad.png", x:66, y:2, offset:[-95, -287]}],
                     //3:[{src:"baobab.png", x:66, y:2, offset:[-110, -370]}]
                     //3:[{src:"clockwork.png", x:66, y:2, offset:[-50, -235]}]
    };

   return grid;
};