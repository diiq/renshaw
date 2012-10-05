$(document).ready(
function () {

    var preload = function () {
        var j, k;
        for(var i =0; i<arguments.length; i++){
        j = new Image();
            j.src = arguments[i];
            k = $("<img>");
            k.attr("src", arguments[i]);
            $("body").append(k.hide());
        }
    };
    
    preload("img/clockwork.png",
            "img/green.png",
            "img/gren.png",
            "img/gwchange.png",
            "img/gwswap.png",
            "img/save.png",
            "img/waterb.png",
            "img/wgchange.png",
            "img/white.png",
            "img/wren.png");


    /* This file provides a function to render a game board in iso:

     API: render(game)

     Where game is an object:
     ren is a player object
     A player object must have .x and .y integer coords.
     map, a function that applies a function to each elt in game grid.
     signature:   game.map ( function (x, y, tile) )

     */


    var
    width = 22,    // in view at one time
    height = 7,
    x_magic = [-50, -27],  // magic #s are offsets for isometric grid tiles
    y_magic = [-66, 7],
    max_left = -((width-3)*x_magic[0]),  // offset for the whole grid
    max_top = -((width)*x_magic[1]+(height)*y_magic[1]);
    
    var grid = new_grid("level1.ren");


    // Dups! Fix yo'sel!    
    var render_tile = function (x, y, tile, rx, ry){
        var $tile = $("<img />");
        $tile.attr("src", "img/"+tile.src);
        $tile.attr("class", "tile");
        $tile.css({left: max_left+(y*y_magic[0]+x*x_magic[0])+"px",
                   top:  max_top+(y*y_magic[1]+x*x_magic[1]) +"px"});
        // REMOVE FOLLOWING LINE FROM PRODUCTION CODE TODO WARNING
        $tile.click(function(){grid.ren.x = rx; grid.ren.y = ry;render(grid);});
        $("#grid").append($tile);
    };

    var render_ren = function (ren){
        // Some duplication here; gardening to do.
        var $tile = $("<img />");
        $tile.attr("src", "img/"+ren.src[ren.color]);
        $tile.attr("class", "ren");
        var x = 11, y=ren.y;
        $tile.css({left: max_left+(y*y_magic[0]+x*x_magic[0])+4+"px",
                   top:  max_top+(y*y_magic[1]+x*x_magic[1])-90 +"px"});

        $("#mask").css("background-position",  -ren.x*x_magic[0]+"px " + 
                                               -ren.x*x_magic[1]+"px");

        $("#grid").append($tile);
        $("#mask").css("background-color", {green:"#563", white:"#555"}[ren.color]);
    };

    var render_special = function (x, y, tile){
        var $tile = $("<img />");
        $tile.attr("src", "img/"+tile.src);
        $tile.attr("class", "tile");
        $tile.css({left: max_left+(y*y_magic[0]+x*x_magic[0])+tile.offset[0]+"px",
                   top:  max_top+(y*y_magic[1]+x*x_magic[1]) +tile.offset[1]+"px"});
        $("#grid").append($tile);
    };

    var render = function (grid) {
        $("#grid").empty();
        grid.real_map(render_tile, grid.ren.x-width/2, grid.ren.x+width/2);
        grid.map_specials(render_special, grid.ren.x-width/2, grid.ren.x+width/2);
        render_ren(grid.ren);
    };


    /** User input: **/

    var move = function(a, d){
        return function () {grid.move(a, d);};
    };
    var keymap = {37:move("y",  1),   // left
                  38:move("x",  1),   // up
                  39:move("y", -1),   // right
                  40:move("x", -1),   // down
                  82:grid.load,       // r
                  32:grid.minor_load  // space
                 };
    $("body").keydown(function (e) {
                          if (keymap[e.which]) {
                              keymap[e.which]();
                              render(grid);
                          }
                      });

    $("#load").click(function(){
                         grid.mport($("#output").val());
                         render(grid);
                     });

    render(grid);

});


/* This is a dumb place for a preloader. */

