$(document).ready(
function () {

    /* This file provides a 2d view of a renshaw grid, with additional
     tools for use as a level editor. 

     */

    var 
    twidth = 25,
    theight = 25,
    grid = new_grid("../level1.ren"),
    current = "A";

    var pallete = function () {
        var i = -1;
        $("#pallete").empty();
        $("#pallete").css("top", theight*(8));
        for(var t in grid.tilemap){
            if (grid.tilemap.hasOwnProperty(t)){
                i++;
                var $tile = $("<img />");
                $tile.attr("src", grid.tilemap[t].src);
                $tile.attr("class", "tile");
                $tile.css({left: (i%40)*twidth+100+"px",
                           top:  Math.floor(i/40)*theight +"px"});
                $tile.click(function(t){return function () {current = t;};}(t));
                $("#pallete").append($tile);
            }
        }
        var thing = $("<a id='foo'>Add Row</a>").click(function () { 
            grid.add_row();
            render(grid);});
        $("#pallete").append(thing);
    }();

    var tile_set = function(x, y){
        grid.tiles[x][y].hash = current;
    };

    var render_tile = function (x, y, tile, rx, ry){
        var $tile = $("<img />");
        $tile.attr("src", tile.src);
        $tile.attr("class", "tile");
        $tile.css({left: x*theight+"px",
                   top:  y*twidth +"px"});
        $tile.click(function () {
                        tile_set(rx, ry);
                        render(grid);
                    });
        $("#grid").append($tile);
    };

    var render_ren = function (ren){
        var $tile = $("<img />");
        $tile.attr("src", ren.src[ren.color]);
        $tile.attr("class", "ren");
        $tile.css({left: 15*theight+"px",
                   top:  ren.y*twidth +"px"});
        $("#grid").append($tile);
    };

    var render = function (grid) {
        $("#grid").empty();
        grid.real_map(render_tile, grid.ren.x-15, grid.ren.x+30);
        render_ren(grid.ren);
//        pallete();
    };

    /** User input **/

    var move = function(a, d){
        return function () {grid.move(a, d);};
    };
    var keymap = {37:move("x", -1),   // left
                  38:move("y", -1),   // up
                  39:move("x",  1),  // right
                  40:move("y",  1),  // down
                  82:grid.load,      // r
                  32: grid.minor_load// space
                 };
    $("body").keydown(function (e) {
                          if (keymap[e.which]) keymap[e.which]();
                          render(grid);
                      });

    $("#export").click(function(){
                           $("#output").val(grid.xport());
                       });

    $("#load").click(function(){
                         grid.mport($("#output").val());
                         render(grid);
                     });

    $("#fill").click(function(){
                          grid.random_fill($("#width").val(), $("#height").val(), $("#filler").val());
                          render(grid);
                      });


    render(grid);

});