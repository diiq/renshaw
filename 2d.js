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

grid = new_grid(50, 7);

var render_tile = function (x, y, tile){
    var $tile = $("<img />");
    $tile.attr("src", tile.src);
    $tile.attr("class", "tile");
    $tile.css({left: x*theight+"px",
               top:  y*twidth +"px"});
    $("#grid").append($tile);
}

grid.map(render_tile);
render_tile(grid.ren.x, grid.ren.y, grid.ren);

});