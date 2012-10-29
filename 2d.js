var grid, actors;
$(document).ready(
function () {

    /* This file provides a 2d view of a renshaw grid, with additional
     tools for use as a level editor. 

     */
    
    var 
    twidth = 50,
    theight = 50,
    width = Math.floor($("#mask").innerWidth()/twidth),
    height =  Math.floor($("#mask").innerHeight()/theight),
    step_speed = {easy: 125, hard:125},  // Time, in ms, to take a single step.
    transition_speed = {easy: 300, hard:150}, // Time, in ms, to animate a transition.    
    rating = "easy";

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
                            {l:0, t:0}, "player")};

    var grid_top = function (x, y){
        return y*theight;
    };
    var grid_left = function (x, y){
        return x*twidth;
    };

    /** Rendering **/

    var render_obj = function (buffer, x, y, ol, ot, cls, src) {
        if(!preloaded["img/2d/"+src]) console.log(src);
        var $obj = preloaded["img/2d/"+src].clone();

        $obj.attr("class", cls);
        $obj.css({ left: grid_left(x, y) + ol + "px",
                   top:  grid_top(x, y)  + ot + "px"});
        buffer.append($obj);
        return $obj;
    };


    // These singular rendering functions wrap an (x, y, tile), which
    // can be given to map, with a buffer, so that rendering can be
    // done to a hidden box or to the live one.
    var render_tile = function (buffer) {
        return function (x, y, tile){
            render_obj(buffer, x, y, tile.oleft || 0, tile.otop || 0, "tile", tile.src);
        };
    };

    // The plural functions do the actual rendering, via map.
    var render_tiles = function(grid, buffer) {
        grid.real_map(render_tile(buffer), 
                      actors.ren.x-width/2, actors.ren.x+width/2,
                      actors.ren.y-height/2, actors.ren.y+height/2);
    };


    var render_special = function (buffer) {
        return function (x, y, tile){
            render_obj(x, y, tile.offset[0], tile.offset[1], "tile", tile.src);
        };
    };

    var render_specials = function (grid, buffer) {
        grid.map_specials(render_special(buffer), 
                          actors.ren.x-width/2, actors.ren.x+width/2,
                          actors.ren.y-height/2, actors.ren.y+height/2);
    };

    

    var render_actors = function (buffer, actor){
        obj_map(function (v, k){
                    var x, y;
                    if (k==="ren") {
                        x = width/2;
                        y = height/2;
                    } else {
                        x = v.x - actors.ren.x + width/2;
                        y = v.y - actors.ren.y + height/2;
                    }
                    render_obj(buffer, x, y, 
                               v.offset.l, v.offset.t, "ren", 
                               v.src[v.color])
                        .attr("id", k).css("z-index", 50-x);
                }, actors);
    };

    var shift_actors = function (actors, continuation){
        obj_map(function (v, k){ 
                    var x, y;
                    if (k==="ren") {
                        x = width/2;
                        y = height/2;
                    } else {
                        x = v.x - actors.ren.x + width/2;
                        y = v.y - actors.ren.y + height/2;
                    }
                   $("#"+k)
                        .animate(
                            {left: grid_left(x, y) + v.offset.l + "px",
                             top:  grid_top(x, y)  + v.offset.t + "px"},
                            {duration:step_speed[rating], complete:continuation});
                    // TODO this is wrong.
                }, actors);
    };

    var render_possibilities = function (actor, buffer) {
        if (rating === "hard") return;
        render_obj(buffer, width/2+1, height/2, 0, 0, "poss", "poss.png")
            .attr("id", "possx1");  
        render_obj(buffer, width/2-1, height/2, 0, 0, "poss", "poss.png")
            .attr("id", "possx-1");  
        render_obj(buffer, width/2, height/2+1, 0, 0, "poss", "poss.png")
            .attr("id", "possy1");
        render_obj(buffer, width/2, height/2-1, 0, 0, "poss", "poss.png")
            .attr("id", "possy-1");  
        hideshow_possibilities(actor, buffer);
    };

    var hideshow_possibilities = function (actor, buffer) {
        var hider = function (a, d) {
            var tester = new Actor(actor); tester.type = "possible";
            if (grid.move(tester, a, d)) {
                $("#poss" + a + d).show();
            } else {
                $("#poss" + a + d).hide();
            }
        };
        hider("x", 1);
        hider("x", -1);
        hider("y", 1);
        hider("y", -1);
    };
    // If the player character doesn't change color, there's no need to re-render
    // we can just move it.



    var render_transitions = function (grid, continuation) {
        // Sometimes, the whole grid has to change at once: a transition;
        // These are rendered in a separate box, and then faded into place.
        // This is important, so that the player has time to grok what's changed.
        // TODO, render ren-transitions separately.
        if (grid.transition()) {
            // This returns a function because the transitions themselves must
            // occur INSTANTLY, or else the player can sneak in an extra move.
            // The rendering *of* the transitions must occur slowly (see above)
            // So this enacts the transitions, but returns a function to render them
            // later.
            return function () {
                var buffer = $("<div id='bgrid'></div>").hide();
                render_tiles(grid, buffer);
                render_specials(grid, buffer);            
                render_actors(buffer, actors);
                $("#mask").append(buffer);
                buffer.fadeIn(transition_speed[rating], function () {
                                  $("#mask .ren").remove();
                                  render_actors($("#mask"), actors);
                                  $("#grid").empty();
                                  $("#grid").css({top:0, left:0});
                                  $("#grid").append(buffer.contents());
                                  $("#mask #bgrid").remove();
                                  
                                  continuation($("#grid"));
                              });
            };
        } else {
            return continuation;
        }
        
    };

    var initialize_render = function (grid) {
        // The first time to render, no clever shortcuts: everything must
        // be placed. Also useful for big instant changes, like a restore-from-save.
        var buffer = $("<div></div>");
        $(".ren").remove();        
        $(".poss").remove();

        render_tiles(grid, buffer);
        render_specials(grid, buffer);
        render_actors($("#mask"), actors);
        render_possibilities(actors.ren, $("#mask"));
          
        $("#grid").empty();
        $("#grid").css({top:0, left:0});
        $("#grid").append(buffer.contents());

    };

    var render_new_rows = function (grid, buffer, xd, yd){
        // This adds just one row to the current grid, to save rendering time
        // when no transitions are present. Purely an optimization for speed.
        var ol = parseInt(buffer.css('left'));
        var ot = parseInt(buffer.css('top'));

        // First add x rows:
        var rend;
        if (xd != 0) {
            var 
            minx = (xd > 0) ? actors.ren.x + (width/2) - 1 :
                              actors.ren.x - (width/2),
            maxx = (xd > 0) ? actors.ren.x + (width/2) : 
                              actors.ren.x - width/2 + 1,
            loc = (xd > 0) ? width-1 : 0;
            console.log(ol);
            rend = function (x, y, tile){
                render_obj(buffer, 
                           loc, y,
                           (tile.oleft || 0) - ol,
                           (tile.otop  || 0) - ot,
                           "tile", tile.src);
            };
            
            grid.real_map(rend, 
                          minx, maxx, 
                          actors.ren.y-height/2, actors.ren.y+height/2);
        }
    };

    var render = function (grid, continuation) {
        // If we haven't moved forward or backward, we can just move Ren; 
        // otherwise, you'll have to move the whole grid. If there are 
        // transitions, inact them first, but render them afterwards.
        $(".possibility").remove();

        continuation = render_transitions(grid, continuation);
        
        var buffer = $("<div></div>");
        var xmove = (actors.ren.x-actors.ren.prev.x);
        var ymove = (actors.ren.y-actors.ren.prev.y);

        $("#grid").animate({left:'-='+xmove*twidth,
                            top: '-='+ymove*theight}, 
                           {duration:step_speed[rating], 
                            complete:function () {
                                render_new_rows(grid, $("#grid"), xmove, ymove);
                                continuation($("#grid"));
                            }});

        shift_actors(actors, continuation);
        hideshow_possibilities(actors.ren, $("#grid"));
    };

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
            .css({top:grid_top(10, ren.y) - 150  + "px",
                  left:grid_left(10, ren.y) - 550 + "px"})
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

    var keymap = {37:move("x", -1),   // left
                  38:move("y", -1),   // up
                  39:move("x",  1),   // right
                  40:move("y",  1),   // down
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

                        initialize_render(grid);
                    }
                });
        });


    var preloaded = {};
    (function () {
        var j, k;
        for(var i =0; i<arguments.length; i++){
            j = new Image();
            j.src = arguments[i];
            k = $("<img>");
            k.attr("src", arguments[i]);
            preloaded[arguments[i]] = k.clone();
            $("body").append(k.hide());
        }
    }("img/2d/antiwren.png", "img/2d/antigren.png", "img/2d/poss.png",
        "img/2d/load.gif", "img/bang.png", "img/2d/clock.png", "img/2d/cclock.png",
      "img/2d/gleft.png", "img/2d/gren.png", "img/2d/gupup.png", "img/2d/gwswap.png", 
      "img/2d/water.png", "img/2d/wgchange.png", "img/2d/wleft.png", "img/2d/wrigh.png", 
      "img/2d/gdown.png", "img/2d/green.png", "img/2d/grigh.png", 
      "img/2d/odown.png", "img/2d/oleft.png", "img/2d/origh.png", "img/2d/oupup.png",
      "img/2d/gwchange.png", "img/2d/save.png", "img/2d/saved.png", "img/2d/waterb.png", 
      "img/2d/wdown.png", "img/2d/white.png", "img/2d/wren.png", "img/2d/wupup.png", 
      "img/2d/orang.png", "img/2d/oren.png", "img/2d/owchange.png", "img/2d/wochange.png", 
      "img/2d/gochange.png", "img/2d/ogchange.png", "img/2d/goswap.png", "img/2d/owswap.png"));

    

});
