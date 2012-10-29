var grid, actors;
$(document).ready(
function () {

    /* This file provides a 2d view of a renshaw grid, with additional
     tools for use as a level editor. 

     */
    
    var 
    twidth = 25,
    theight = 25;

    var ding = function (i) { 
        // Goes ding when there's stuff.
        $("#ding").get(0).play();
        $("#rewards").append("<div class='reward'>"+i+"</div>");
    };

    var next_level = function () {
        $("#overlay").fadeIn({complete:function(){
                                  actors.ren = new Actor(0, 3, "white", 
                                                         {white:"wren.png", 
                                                          green:"gren.png", 
                                                          orang:"oren.png"}, 
                                                         {l:4, t:-95}, "player");
                                  actors.ren.save(grid);
                                  initialize_render(grid);
                                  $("#overlay").fadeOut();}});
    };
    
    grid = new_grid(window.location.hash.slice(1) || "forealz.ren", 
                    {ding:ding, next_level:next_level});

    actors  = {ren:new Actor(0, 3, "white", 
                            {white:"wren.png", green:"gren.png", orang:"oren.png"}, 
                            {l:4, t:-95}, "player")};

    var grid_top = function (x, y){
        return y*theight;
    };
    var grid_left = function (x, y){
        return x*twidth;
    };

    var render_tile = function (x, y, tile, rx, ry){
        var $tile = $("<img />");
        $tile.attr("src", "2d/" + tile.src);
        $tile.attr("class", "tile");
        $tile.css({left: x*theight+"px",
                   top:  y*twidth +"px"});
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

    var render = function (grid, continuation) {
        $("#grid").empty();
        grid.real_map(render_tile, actors.ren.x-15, actors.ren.x+30);
        render_ren(actors.ren);
        continuation();
    };

    var initialize_render = render;

    /** Death **/

    var tick_bang = function (count) {
        // If you've gotten stuck, tick_bang takes a few seconds to sympathize
        // before killing you dead.
        count = count || 10;
        $("#impossible").show().css('left', ($(window).width() - 
                                             $("#impossible").outerWidth()) / 2);
        if (count % 2) {
            $("#mask").css("background-color", "#FF0000");
        } else {
            $("#mask").css("background-color", "#1F1F1F");
        }
        setTimeout(function () {
                       if (count > 1 && !can_i_win(grid, actors.ren)){
                           tick_bang(count-1);
                       } else {
                           $("#mask").css("background-color", "#1f1f1f");
                           $("#impossible").hide();
                           if (!can_i_win(grid, actors.ren)){
                               bang(actors.ren, function () {grid.load(actors.ren);
                                                           initialize_render(grid);});
                           }
                       }
                   }, 500);
    };

    var bang = function (ren, continuation){
        // Bang kills you dead, by rendering a lightning flash
        // and playing a peal of thunder.
        $(".ren").remove();
        $("#bang").get(0).play();
        var a = $("<img src='img/bang.png'>")
            .addClass("bang")
            .css({top:grid_top(10, ren.y)  - 350 + "px",
                  left:grid_left(10, ren.y) - 350 + "px"})
            .hide()
            .fadeIn(50)
            .fadeOut(1000, continuation);
        $("#mask").append(a);
    };

    /** User input: **/

    var canmove = true;
    var move = function(a, d){ // Move rets a function, closes axis & direction.
        return function () { 
            // Don't let the player move until previous move is complete.
            if (!canmove) return;
            canmove = false;
            
            move_haters(actors, grid); // move the haters

            if( !grid.move(actors.ren, a, d) ) {  // If the move fails, kill'em.
                bang(actors.ren, function () {grid.load(actors.ren);
                                            initialize_render(grid);
                                            canmove = true;});
                return;
            }

            render(grid, function () {
                       if (!can_i_win(grid, actors.ren)) { // If they're stuck, kill'em.
                           tick_bang();
                       }
                       canmove = true;
                   });

        };
    };

    var keymap = {37:move("y",  1),   // left
                  38:move("x",  1),   // up
                  39:move("y", -1),   // right
                  40:move("x", -1),   // down
                  32:function(){
                      grid.load(actors.ren);
                      initialize_render(grid);}       // space
                 };



    /** START HERE Initially, do these things **/

    $("#impossible").hide(); // hide the stuck message
    $("#start").hide();      // and the "press space to begin" message
    $("#preferences").hide();
    $("#preference_button").click(function () {
                                      $("#overlay").show();
                                      $("#preferences").show();
                                      $("#" + rating).css("background-color", "#bbf");
                                      });
    $("#easy").click(function () {rating = "easy";
                                  $("#easy").css("background-color", "#bbf");
                                  $("#hard").css("background-color", "#ccc");});
    $("#hard").click(function () {rating = "hard";
                                  $("#hard").css("background-color", "#bbf");
                                  $("#easy").css("background-color", "#ccc");
                                  $(".poss").hide();});
    $("#resume").click(function () {$("#overlay").hide(); $("#preferences").hide();});


                     
    $(window).load(
        function(){
            $("#limg").hide(); // hide the loading gif

            var mesg;
            if (localStorage.saved_game) {
                mesg = "Press N for New Game | Press Space to Resume" ;
            } else {
                mesg = "Press Space to Begin";
            }
            $("#start").html(mesg).fadeIn();

            $("body").keydown(
                function (e) {
                    if(e.which === 32) { // Resume game
                        grid.load(actors.ren);
                    } if (e.which === 32 || e.which === 78) {
                        actors.ren.save(grid);
                        $("#overlay").fadeOut();
                        $("#loader").fadeOut();

                        // Attach default keymap.
                        $("body").keydown(function (e) {
                                              if (keymap[e.which]) {
                                                  keymap[e.which]();
                                              }
                                          });

                        render(grid);
                    }
                });
        });

});