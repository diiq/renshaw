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
        localStorage.saved_game = JSON.stringify([brief_tilemap(this.saved[0]), this.saved[1]]);
    }
    return this.saved;

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
};
Actor.prototype.minor_save = function (){
    this.minor_saved = [this.x, this.y];
};
Actor.prototype.minor_load = function () {
    // Teleport back to that spot (minor_save)
    if (this.minor_saved){
        this.x = this.minor_saved[0];
        this.y = this.minor_saved[1];
    }
};


var move_hater = function(actor, ren, grid) {
    var move;
    var dir = ren.x - actor.x;
    if (dir != 0){
        move = [actor, "x", dir/Math.abs(dir)];
        if(grid.move.apply(grid, move))
            return;
    }
    dir = ren.y - actor.y;
    if (dir != 0){
        move = [actor, "y", dir/Math.abs(dir)];
        grid.move.apply(grid, move);
    }
};

var move_haters = function(actors, grid){
    for (k in actors) {
      if (k != "ren" && actors.hasOwnProperty(k))
          move_hater(actors[k], actors.ren, grid);
    }
};