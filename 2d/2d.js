$(document).ready(
function () {

    /* This file provides a 2d view of a renshaw grid, with additional
     tools for use as a level editor. 

     */

    var 
    twidth = 25,
    theight = 25,
    grid = new_grid(50, 7),
    current = "A";

    var pallete = function () {
        var i = -1;
        $("#pallete").css("top", theight*(8));
        for(var t in grid.tilemap){
            if (grid.tilemap.hasOwnProperty(t)){
                i++;
                var $tile = $("<img />");
                $tile.attr("src", grid.tilemap[t].src);
                $tile.attr("class", "tile");
                $tile.css({left: (i%40)*twidth+"px",
                           top:  Math.floor(i/40)*theight +"px"});
                $tile.click(function(t){return function () {current = t;};}(t));
                $("#pallete").append($tile);
            }
        }
    }();

    var tile_set = function(x, y){
        grid.tiles[x][y].hash = current;
    };

    var render_tile = function (x, y, tile){
        var $tile = $("<img />");
        $tile.attr("src", tile.src);
        $tile.attr("class", "tile");
        $tile.css({left: x*theight+"px",
                   top:  y*twidth +"px"});
        $tile.click(function () {
                        tile_set(x, y);
                        render(grid);
                    });
        $("#grid").append($tile);
    };

    var render_ren = function (ren){
        var $tile = $("<img />");
        $tile.attr("src", ren.src[ren.color]);
        $tile.attr("class", "ren");
        $tile.css({left: ren.x*theight+"px",
                   top:  ren.y*twidth +"px"});
        $("#grid").append($tile);
    };

    var render = function (grid) {
        $("#grid").empty();
        grid.real_map(render_tile);
        render_ren(grid.ren);
    };

    /** User input **/

    var move = function(a, d){
        return function () {grid.move(a, d);};
    };
    var keymap = {37:move("y", 1),   // left
                  38:move("x", 1),   // up
                  39:move("y",  -1), // right
                  40:move("x",  -1), // down
                  82:grid.load,      // r
                  32: grid.minor_load// space
                 };
    $("body").keydown(function (e) {
                          if (keymap[e.which]) keymap[e.which]();
                          render(grid);
                      });

    $("#export").click(function(){
                           $("#output").val(grid.export());
                       });

    $("#load").click(function(){
                         grid.import($("#output").val());
                         render(grid);
                     });

    $("#clear").click(function(){
                          grid.map(function(x, y, t){t.hash = "A";});
                          render(grid);
                      });

    render(grid);

});