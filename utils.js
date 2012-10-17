/*
 *  These are functions that don't have a good home yet.
 *  For the sake of sanitation, they need to find a place
 *  someday. 
 * 
 */

var brief_tilemap = function(tilemap) {
    // A shortened, stringifyiable version of the tilemap
    tilemap = tilemap || grid.tilemap;
    var tm = {};
    for (var ch in tilemap){
        tm[tilemap[ch].id] = ch;
    }
    return tm;
};

var unbrief_tilemap = function(tm) {
    // Reverse the process of brief_tilemap
    var tilemap = {};
    for (var ch in grid.tilemap){
        tilemap[tm[grid.tilemap[ch].id]] = grid.tilemap[ch];
    }
    return tilemap;
};

var copy_obj = function (obj){
    var ret = {};
    for(var t in obj){
        if (obj.hasOwnProperty(t)){
            ret[t] = obj[t];
        }
    }
    return ret;
};

var obj_map = function (f, obj) {
    for (var k in obj) {
        if(obj.hasOwnProperty(k))
            f(obj[k], k);
    }
}