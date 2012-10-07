/* Ok, the goal for this file is a search algorithm, to find the
furthest possible point in a renshaw grid reachable in 23 steps.

Eventually, we want it to midfy the grid if no 23-step position is
reachable --- but that will mean recognizing ko, and other hard
things.

It would also be nice to have it place a *, and repeat. This will be
easy. */


var search = function (grid, maxdepth) {
    maxdepth = maxdepth || 23;
    

    var i, j, memo = [];
    for (i = 0; i<grid.tiles.length; i++){
        memo[i] = [];
        for (var j=0; j<grid.tiles[i].length; j++)
            memo[i][j] = [];
    }
    
    var match = function(tm1, tm2) {
        for(var e in tm1){
            if (tm1[e] !== tm2[e])
                return false;
        }
        return true;
    };

    var ko = function(tilemap, ren){
        var m = memo[ren.x][ren.y];
        if (m.length !== 0){
            for (var i=0; i<m.length; i++){
                if (match(tilemap, m[i][0]) && ren.color == m[i][1].color){
//                    console.log("trimmed", ren.x, ren.y);
                    return true;
                }
            }
        }
        memo[ren.x][ren.y].push([tilemap, ren]);
        return false;
    };

    // the biggest trick will be keeping track of the tilemap and ren.
    // I;ll need obj_copy for this? or no, I can steal a save.
    var step = function (tilemap, ren, mv, depth) {
        grid.load(tilemap, ren);
        if (grid.move.apply({}, mv)){
            var s = grid.save();
            return deeper(s[0], s[1], depth+1);
        };
        return false;
    };

    var deeper = function (tilemap, ren, depth) {
        depth = depth || 0;
        if (ko(tilemap, ren)) return [[-1, -1]];

        var moves = [["x", 1],
                     ["x", -1],
                     ["y", 1],
                     ["y", -1]];
        var s, mv, current = [[ren.x, ren.y]];
        if (depth < maxdepth) {
            for (mv in moves) {
                s = step(tilemap, ren, moves[mv], depth);
                if (s && s[0][0] > current[0][0]) {
                    current = s.concat([moves[mv]]);
                }
            }
        }
        return current;
    };
    
    var s = [grid.tilemap, grid.ren];
    var ret = deeper(grid.tilemap, grid.ren, 0);
    grid.load(s[0], s[1]);
    return ret;
};