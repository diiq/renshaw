var grid, actors;
$(document).ready(
function () {

    /* This file provides a 2d view of a renshaw grid, with additional
     tools for use as a level editor. 

     */
    
    var 
    twidth = 25,
    theight = 25,
    current = "A";
    grid = new_grid(window.location.hash.slice(1) || "../level1.ren", 
                    {ding:function(){$("#ding").get(0).play();}}),
    actors  = {ren:new Actor(0, 3, "white", 
                            {white:"wren.png", green:"gren.png", orang:"oren.png"}, 
                            {l:4, t:-95}, "player")};

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
        grid.real_map(render_tile, actors.ren.x-15, actors.ren.x+30);
        render_ren(actors.ren);
//        pallete();
    };

    /** User input **/

    var move = function(a, d){
        return function () {grid.move(actors.ren, a, d);grid.transition();};
    };
    var keymap = {37:move("x", -1),   // left
                  38:move("y", -1),   // up
                  39:move("x",  1),  // right
                  40:move("y",  1),  // down
                  82:grid.load,      // r
                  32: grid.minor_load// space
                 };
    $("body").keydown(function (e) {
                          if (keymap[e.which]) {
                              keymap[e.which]();
                              render(grid);
                          }
                      });

    $("#export").click(function(){
                           $("#output").val(grid.xport());
                       });

    $("#load").click(function(){
                         grid.mport(JSON.parse($("#output").val()));
                         render(grid);
                     });

    $("#fill").click(function(){
                         grid.random_fill($("#width").val(), 
                                          $("#height").val(), 
                                          $("#filler").val());
                         render(grid);
                      });


    $("#search").click(function () {
                           var ret = wander(grid, actors.ren, 23); 
                           console.log(ret);
                           actors.ren = ret[0].actor;
                           grid.tilemap = ret[0].tilemap;
                           
//                           grid.tiles[ret[0].actor.x+1][ret[0].actor.y].hash = "*";
 //                          grid.move(actors.ren, "x", 1);
                           render(grid);
                       });

    $("#caniwin").click(function () {
                           var ret = can_i_win(grid, 1200); 
//                           grid.tiles[ret[0].ren.x+1][ret[0].ren.y] = {hash:"*"};
                            console.log("RETER", ret);
                       });

    $("#research").click(function () {
                             var max = -1;
                             var ret = wander(grid); 
                             while(ret[0].ren.x > max) {
                                 grid.tiles[ret[0].ren.x+1][ret[0].ren.y].hash = "*";
                                 grid.load(ret[0].tilemap, ret[0].ren);
                                 ret = wander(grid); 
                             }
                             render(grid);

                       });

    render(grid);

    $("#mile").click(function() {
                         grid.mile(50, 7);
                         render(grid);
                     });


});