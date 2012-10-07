var preloaded = {};

$(document).ready(
function () {

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

    var ding = function (i) {
        $("#ding").get(0).play();
        $("#rewards").append("<div class='reward'>"+i+"</div>");
    };

    var grid = new_grid(window.location.hash.slice(1) || "level1.ren", 
                       {ding:ding});


    /** Rendering **/

    // Dups! Fix yo'sel!    
    var render_obj = function (x, y, ol, ot, cls, src) {
        var $obj = preloaded["img/"+src].clone();        
        $obj.attr("class", cls);
        $obj.css({left: max_left+(y*y_magic[0]+x*x_magic[0])+ol+"px",
                   top:  max_top+(y*y_magic[1]+x*x_magic[1])+ot+"px"});
        $("#grid").append($obj);
        return $obj;
    };

    var render_tile = function (x, y, tile){
        render_obj(x, y, 0, 0, "tile", tile.src);
    };

    var render_ren = function (ren){
        render_obj(9, ren.y, 4, -90, "ren", ren.src[ren.color]);
        // Shift bg to match
        $("#mask").css("background-position",  -ren.x*x_magic[0]+"px " + 
                                               -ren.x*x_magic[1]+"px");
        $("#mask").css("background-color", {orang:"#653", 
                                            green:"#563", 
                                            white:"#555"}[ren.color]);
    };

    var render_special = function (x, y, tile){
        render_obj(x, y, tile.offset[0], tile.offset[1], "tile", tile.src);
    };

    var render = function (grid) {
        $("#grid").empty();
        grid.real_map(render_tile, grid.ren.x-width/2+2, grid.ren.x+width/2+2);
        grid.map_specials(render_special, grid.ren.x-width/2+2, grid.ren.x+width/2+2);
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
//                  32:story_next       // space
                 };
    $("body").keydown(function (e) {
                          if (keymap[e.which]) {
                              keymap[e.which]();
                              render(grid);
                          }
                      });

    render(grid);

});


var preload = function () {
    var j, k;
    for(var i =0; i<arguments.length; i++){
        j = new Image();
        j.src = arguments[i];
        k = $("<img>");
        k.attr("src", arguments[i]);
        preloaded[arguments[i]] = k.clone();
        $("body").append(k.hide());
    }
}("img/baobab.png", "img/clockwork.png", "img/clock.png", "img/cclock.png", 
  "img/gleft.png", "img/gren.png", "img/gupup.png", "img/gwswap.png", 
  "img/water.png", "img/wgchange.png", "img/wleft.png", "img/wrigh.png", 
  "img/baobad.png", "img/gdown.png", "img/green.png", "img/grigh.png", 
  "img/gwchange.png", "img/save.png", "img/saved.png", "img/waterb.png", 
  "img/wdown.png", "img/white.png", "img/wren.png", "img/wupup.png", 
  "img/orang.png", "img/oren.png", "img/owchange.png", "img/wochange.png", 
  "img/gochange.png", "img/ogchange.png", "img/goswap.png", "img/owswap.png");
