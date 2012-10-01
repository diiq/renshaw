/* This file provides a function to render a game board in 2d:

API: render(game)

Where game is an object:
     ren is a player object
          A player object must have .x and .y integer coords.
     map, a function that applies a function to each elt in game grid.
          signature:   game.map ( function (x, y, tile) )

*/

var 
twidth = 25,
theight = 25;


$(document).ready(function () {

var grid = new_grid(50, 7);

var cycle = function() {
    var tile, ret = {}, prev = null;
    for(tile in grid.tilemap){
        if (grid.tilemap.hasOwnProperty(tile)) {
            ret[tile] = prev;
            prev = tile;
        }
    }
    for(tile in grid.tilemap){
        if (grid.tilemap.hasOwnProperty(tile)) {
            ret[tile] = prev;
            return ret;
        }
    }
}();

var tile_rot = function(grid, x, y){
    grid.tiles[x][y].hash = cycle[grid.tiles[x][y].hash];
};

var render_tile = function (x, y, tile){
    var $tile = $("<img />");
    $tile.attr("src", tile.src);
    $tile.attr("class", "tile");
    $tile.css({left: x*theight+"px",
               top:  y*twidth +"px"});
    $tile.click(function () {
                    tile_rot(grid, x, y);
                    render(grid);
                    });
    $("#grid").append($tile);
}

var render_ren = function (ren){
    var $tile = $("<img />");
    $tile.attr("src", ren.src[ren.color]);
    $tile.attr("class", "ren");
    $tile.css({left: ren.x*theight+"px",
               top:  ren.y*twidth +"px"});
    $("#grid").append($tile);
}

var render = function (grid) {
    $("#grid").empty();
    grid.map(render_tile);
    render_ren(grid.ren);
};

$("body").keydown(function (e) {
var keymap = {37:["x", -1], //left
              38:["y", -1], // up
              39:["x",  1], // right
              40:["y",  1], //down
             };
    if (keymap[e.which]){
        grid.move.apply({}, keymap[e.which]);
        render(grid);
    }
});

render(grid);

});