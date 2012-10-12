/* Ok, the goal for this file is a search algorithm, to find the
furthest possible point in a renshaw grid reachable in 23 steps.

Eventually, we want it to midfy the grid if no 23-step position is
reachable --- but that will mean recognizing ko, and other hard
things.

It would also be nice to have it place a *, and repeat. This will be
easy. 



Termination is a predicate over tilemap, ren, and depth. It returns
true when a positive result is reached. 

A state is an object: 
 .map
 .ren
 .depth

can I win MUST run quickly, but it's function is non-essential; so it
assumes you can win if it takes more than 16ms to decide. That gives
me plenty of time left over for resposive rendering, even when I'm
rendering like an idiot (which I am).

*/

var wander = function (grid, depth) {
    depth = depth || 23;
    var term = function (s) {
        if (s.depth > depth) return true;
        return false;
    };
    var cmp = function (s1, s2) {
        if (s1.ren.x < s2.ren.x) return true;
        return false;
    };
    return search(grid, term, cmp);
};

var can_i_win = function (grid, depth) {
    depth = depth || 50;
    var term = function (s) {
        if (s.depth > depth) return true;
        return false;
    };
    var cmp = function (s1, s2) {
        return false;
    };
    var d = new Date();
    var time = d.getTime();
    var esc = function(s){
        var d = new Date();
        if (d.getTime() - 16 > time) {
            //console.log("hoo");
            return true;
        }
        if (grid.tiles[s.ren.x][s.ren.y].hash === "*"){
            //console.log("here", s);
            return true;
        }
        return false;
    };

    var ret, pre = grid.saved.slice(0);

    try {
        search(grid, term, cmp, esc);
        ret = false;

    } catch (x) {
        if(x.m === "Escape")
            ret = [x.s];
        else throw x;
    }

    grid.saved = pre;
    return ret;
};

var search = function (grid, termination, score_cmp, escape) {
    escape = escape || function () {
        return false;
    };

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
                    return true;
                }
            }
        }
        memo[ren.x][ren.y].push([tilemap, ren]);
        return false;
    };

    var step = function (s, mv) {
        grid.load(s.tilemap, s.ren);
        if (grid.move.apply({}, mv)){
            var ps = grid.save();
            return deeper({tilemap:ps[0], ren:ps[1], depth:s.depth+1});
        };
        return false;
    };

    var deeper = function (s) {
        var moves = [["x", 1, true],
                     ["x", -1, true],
                     ["y", 1, true],
                     ["y", -1, true]];
        var ss, mv, current = [s];
        if (ko(s.tilemap, s.ren)) return false; //been here before

        if (escape(s)){
            grid.load(s0.tilemap, s0.ren);
            throw {m:"Escape", s:s};
        }

        if (!termination(s)) {
            for (mv in moves) {
                ss = step(s, moves[mv]);
                if (ss && score_cmp(current[0], ss[0])) {
                    current = ss.concat([moves[mv]]);
                }
            }
        }
        return current;
    };
    
    var s0 = {tilemap:grid.tilemap, ren:grid.ren, depth:0};
    var ret = deeper(s0);  
    
    // TODO preserve grid state before running
    grid.load(s0.tilemap, s0.ren);
    return ret;
};