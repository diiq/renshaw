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

var wander = function (grid, actor, depth) {
    depth = depth || 23;
    var term = function (s) {
        if (s.depth > depth) return true;
        return false;
    };
    var cmp = function (s1, s2) {
        if (s1.actor.x < s2.actor.x) return true;
        return false;
    };
    return search(grid, actor, term, cmp);
};

var can_i_win = function (grid, actor) {
    actor = new Actor(actor);
    actor.type = "search";
    var term = function (s) {
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
            return true;
        }
        if (grid.tiles[s.actor.x][s.actor.y].hash === "*" ||
            grid.tiles[s.actor.x][s.actor.y].hash === "^"){
            return true;
        }
        return false;
    };

    var ret, pre = grid.saved;

    try {
        search(grid, actor, term, cmp, esc);
        ret = false;
        console.log("fail");
    } catch (x) {
        console.log("esc");

        if(x.m === "Escape")
            ret = [x.s];
        else throw x;
    }

    grid.saved = pre;
    return ret;
};

var search = function (grid, actor, termination, score_cmp, escape) {
    escape = escape || function () {
        return false;
    };

    var i, j, memo = {};
    
    var match = function(tm1, tm2) {
        for(var e in tm1){
            if (tm1[e] !== tm2[e])
                return false;
        }
        return true;
    };

    var ko = function(tilemap, actor){
        var m = memo[""+actor.x+actor.y];
        if (m){
            for (var i=0; i<m.length; i++){
                if (match(tilemap, m[i][0]) && actor.color == m[i][1]){
                    return true;
                }
            }
        } else {
            memo[""+actor.x+actor.y] = [];
        }
        memo[""+actor.x+actor.y].push([tilemap, actor.color]);
        return false;
    };

    var step = function (s, mv) {
        grid.load(s.tilemap);
        var actor = new Actor(s.actor);
        if (grid.move(actor, mv[0], mv[1])){
            grid.transition();
            return deeper({tilemap:grid.tilemap, actor:actor, depth:s.depth+1});
        };
        return false;
    };

    var deeper = function (s) {
        var moves = [["x",  1],
                     ["x", -1],
                     ["y",  1],
                     ["y", -1]];
        var ss, mv, current = [s];

        if (ko(s.tilemap, s.actor)) return false; //been here before

        if (escape(s)){
            grid.load(s0.tilemap);
            throw {m:"Escape", s:s};
        }

        if (termination(s)) return current;

        for (mv in moves) {
            ss = step(s, moves[mv]);
            if (ss && score_cmp(current[0], ss[0])) {
                current = ss.concat([moves[mv]]);
            }
        }

        return current;
    };
    
    var s0 = {tilemap:grid.tilemap, actor:actor, depth:0};

    var ret = deeper(s0);  
    
    // TODO preserve grid state before running
    grid.load(s0.tilemap);
    return ret;
};