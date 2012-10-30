/* This file contains the code for player and non-player actors.
 * 
 * 
 */

var Actor =  function(x, y, color, srcs, offset, type){
    if (x instanceof Actor) {
        this.x = x.x;
        this.y = x.y;
        this.offset = x.offset;
        this.src = x.srcs;
        this.color = x.color;
        this.prev = x.prev;
        this.saved = [null, null];
        this.minor_saved = null;
        this.type = x.type;        
    } else {
        this.x = x;
        this.y = y;
        this.offset = offset;
        this.src = srcs;
        this.color = color;
        this.prev = {x:x, y:y};
        this.saved = [null, null];
        this.minor_saved = null;
        this.type = type;
    }
};

Actor.prototype.save = function (grid) {
    this.saved = [copy_obj(grid.tilemap),
                  new Actor(this.x, this.y, this.color, this.src, this.offset, this.type)];
    this.saved[1].minor_saved = this.minor_saved;
    if (this.type){
        localStorage.saved_game = JSON.stringify(
            [brief_tilemap(this.saved[0]), 
             this.saved[1],
             grid.url]);
    }
    return this.saved;

};
Actor.prototype.direction = function () {
    console.log([this.prev.x - this.x, this.prev.y - this.y]);
    return {x:this.prev.x - this.x, y:this.prev.y - this.y};
};

Actor.prototype.load = function (actor) {
    var recov = actor || this.saved[1];
    if (recov) {
        var tmp = this.saved;
        for(var t in recov){
            if (recov.hasOwnProperty(t)){
                this[t] = recov[t];
            }
        }
        this.saved = tmp;
        return copy_obj(this.saved[0]);
    }
    return null;
};
Actor.prototype.minor_save = function (){
    this.minor_saved = {x:this.x, y:this.y};
};
Actor.prototype.minor_load = function () {
    // Teleport back to that spot (minor_save)
    if (this.minor_saved){
        this.x = this.minor_saved[0];
        this.y = this.minor_saved[1];
    }
};


var move_hater = function(actor, goal, grid) {
    console.log(goal);
    var moves = [["x",  1],
                 ["x", -1],
                 ["y",  1],
                 ["y", -1]];
    var locs = [], tact, i=0, dist, min=10000, choice;
    for (i=0; i<moves.length; i++) {
        tact = new Actor(actor);
        grid.move(tact, moves[i][0], moves[i][1]);
        locs[i] = [tact.x, tact.y];
    }
    console.log(locs, goal.x, goal.y);
    // need a minimize TODO
    for (i=0; i<moves.length; i++) {
        dist = (Math.pow(goal.x - locs[i][0], 2) +
                Math.pow(goal.y - locs[i][1], 2));
        console.log(dist);
        if (dist < min) {
            min = dist;
            choice = i;
        }
    }
    console.log(choice);
    grid.move(actor, moves[choice][0], moves[choice][1]);
};

