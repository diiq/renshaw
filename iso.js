var grid, actors; // This line is for debugging purposes; delete & replace var below
$(document).ready(
function () {

    /* This file contains the 3-ishD UI for Renshaw's Disco.  Perhaps
     * start from the bottom and read upwards? C-s START, emacs
     * users. I don't have many reccommendations for making this one
     * easier. DOM manipulation is gross, sometimes. Like kissing. Or
     * eating frog guts.
     */

    var
    width = 24,    // the number of rows in view at one time
    height = 7,    // the number of tiles per row
    x_magic = [-50, -27],  // these magic #s are offsets for isometric grid tiles
    y_magic = [-66, 7],
    max_left = -((width-4)*x_magic[0]),  // an offset for the whole grid
    max_top = -((width-1)*x_magic[1]+(height)*y_magic[1]),
    step_speed = {easy: 125, hard:125},  // Time, in ms, to take a single step.
    transition_speed = {easy: 300, hard:150}, // Time, in ms, to animate a transition.    
    rating = "easy",
    sound = true;

    var grid_left = function(x, y){
        return max_left+(y*y_magic[0]+x*x_magic[0]);
    };
    var grid_top = function(x, y){
        return max_top+(y*y_magic[1]+x*x_magic[1]);
    };

    var ding = function (i) { 
        // Goes ding when there's stuff.

        if(sound) $("#ding").get(0).play();
        $("#rewards").append("<img class='reward' src='img/coin.png'>");
        actors.ren.coins += 1;

    };

    var next_level = function (url) {
        canmove = true;
        if (url === "mile.ren"){
            $("#mile").fadeIn().css('left', ($(window).width() - 
                                             $("#mile").outerWidth()) / 2);
            setTimeout(function(){$("#mile").fadeOut();}, 7000);
            rating = "hard";
            $("#easy").css("background-color", "#ccc");
            $("#easy").css("color", "#444");
            $(".poss").hide();
        }
        $("#overlay").fadeIn({complete:function(){
                                  actors.ren.x = 0;
                                  actors.ren.y = 3;
                                  actors.ren.color = "white";
                                  actors.ren.save(grid);
                                  initialize_render(grid);
                                  $("#overlay").fadeOut();}});
    };
    
//    grid = new_grid(window.location.hash.slice(1) || "1.ren", 
//                       {ding:ding, next_level:next_level});
    actors = {ren:new Actor(0, 3, "white", 
                            {white:"wren.png", green:"gren.png", orang:"oren.png"}, 
                            {l:4, t:-95}, "player")
              // , antiren:new Actor(0, 6, "white", 
              //               {white:"antiwren.png", green:"antigren.png", orang:"oren.png"}, 
              //               {l:17, t:-75}, "hater")
             };

    /** Rendering **/

    var render_obj = function (buffer, x, y, ol, ot, cls, src) {
        if(!preloaded["img/"+src]) console.log(src);
        var $obj = preloaded["img/"+src].clone();

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
                      actors.ren.x-width/2+2, actors.ren.x+width/2+2);
    };


    var render_special = function (buffer) {
        return function (x, y, tile){
            render_obj(x, y, tile.offset[0], tile.offset[1], "tile", tile.src);
        };
    };

    var render_specials = function (grid, buffer) {
        grid.map_specials(render_special(buffer), 
                          actors.ren.x-width/2+2, actors.ren.x+width/2+2);
    };

    

    var render_actors = function (buffer, actor){
        obj_map(function (v, k){
                    var x, y = v.y;
                    if (k==="ren") {
                        x = 10;
                    } else {
                        x = v.x - actors.ren.x + 10;
                    }
                    render_obj(buffer, x, y, 
                               v.offset.l, v.offset.t, "ren", 
                               v.src[v.color])
                        .attr("id", k).css("z-index", 50-x);
                }, actors);
    };

    var render_possibilities = function (actor, buffer) {
        if (rating === "hard") return;
        render_obj(buffer, 11, actor.y, 0, -5, "poss", "poss.png").attr("id", "possx1");  
        render_obj(buffer, 9,  actor.y, 0, -5, "poss", "poss.png").attr("id", "possxm1");  
        render_obj(buffer, 10, actor.y+1, 0, -5, "poss", "poss.png").attr("id", "possy1");
        render_obj(buffer, 10, actor.y-1, 0, -5, "poss", "poss.png").attr("id", "possym1");  
        hideshow_possibilities(actor, buffer);
    };

    var shift_possibilities = function (actor, buffer) {
        if (rating === "hard") return;
        var x = 10; var y = actor.y;
        $(".poss").hide();
        $("#possx1")
            .css(
                {left: grid_left(x+1, y) + 0   + "px",
                 top:  grid_top(x+1, y)  + -5 + "px"}
                );
        $("#possxm1")
            .css(
                {left: grid_left(x-1, y) + 0   + "px",
                 top:  grid_top(x-1, y)  + -5 + "px"}
                );
        $("#possy1")
            .css(
                {left: grid_left(x, y+1) + 0   + "px",
                 top:  grid_top(x, y+1)  + -5 + "px"}
                );
        $("#possym1")
            .css(
                {left: grid_left(x, y-1) + 0   + "px",
                 top:  grid_top(x, y-1)  + -5 + "px"}
                );
        
        hideshow_possibilities(actor, buffer);
    };

    var hideshow_possibilities = function (actor, buffer) {
        var tester = new Actor(actor); tester.type = "possible";
        if (grid.move(tester, "x", 1)) {
            $("#possx1").show();
        } else {
            $("#possx1").hide();
        }

        tester = new Actor(actor); tester.type = "possible";
        if (grid.move(tester, "x", -1)) {
            $("#possxm1").show();
        } else {
            $("#possxm1").hide();
        }

        tester = new Actor(actor); tester.type = "possible";
        if (grid.move(tester, "y", 1)) {
            $("#possy1").show();
        } else {
            $("#possy1").hide();
        }

        tester = new Actor(actor); tester.type = "possible";
        if (grid.move(tester, "y", -1)) {
            $("#possym1").show();
        } else {
            $("#possym1").hide();
        }
    };
    // If the player character doesn't change color, there's no need to re-render
    // we can just move it.

    var shift_actors = function (actors, continuation){
        obj_map(function (v, k){ 
                    var x, y = v.y;
                    if (k==="ren") {
                        x = 10;
                    } else {
                        x = v.x - actors.ren.x + 10;
                    }
                   $("#"+k)
                        .animate(
                            {left: grid_left(x, y) + v.offset.l + "px",
                             top:  grid_top(x, y)  + v.offset.t + "px"},
                            {duration:step_speed[rating], complete:continuation}) // TODO this is wrong.
                        .css("z-index", 50-x);
                }, actors);
    };

    var shift_background = function (ren){
        // Shift the background to move in sync with the grid.
        // This goes funky on IE; I don't know why. TODO
        $("#mask").animate({'background-position-x':  -ren.x*x_magic[0],
                            'background-position-y': -ren.x*x_magic[1]}, 
                           {duration: step_speed[rating], 
                            complete:  function () {
                                $("#mask").css("background-color", 
                                               {orang:"#2f1f2f", 
                                                green:"#102f2f", 
                                                white:"#1f1f2f"}[ren.color]);
                            }});
    };
    

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

    var render_mile = function (){
        if(grid.url === "mile.ren"){
            $("#count").html(actors.ren.x+"/5280");
        }
    };

    var initialize_render = function (grid) {
        // The first time to render, no clever shortcuts: everything must
        // be placed. Also useful for big instant changes, like a restore-from-save.
        render_mile();
        var buffer = $("<div></div>");
        $(".ren").remove();        
        $(".poss").remove();

        render_tiles(grid, buffer);
        render_specials(grid, buffer);
        render_actors($("#mask"), actors);
        render_possibilities(actors.ren, $("#mask"));
        shift_background(actors.ren);
        
        $("#grid").empty();
        $("#grid").css({top:0, left:0});
        $("#grid").append(buffer.contents());

    };

    var deep = -1; // Sloppy; TODO
    var render_new_row = function (grid, buffer, direction){
        // This adds just one row to the current grid, to save rendering time
        // when no transitions are present. Purely an optimization for speed.
        var ol = parseInt(buffer.css('left'));
        var ot = parseInt(buffer.css('top'));

        var rend;

        if (direction > 0) {
            rend = function (x, y, tile){
                render_obj(buffer, (width-1), y, 
                           (tile.oleft || 0) - ol,
                           (tile.otop  || 0) - ot,
                           "tile", tile.src).css('z-index', deep);
            };
            
            grid.real_map(rend,
                          actors.ren.x+width/2+2-1,
                          actors.ren.x+width/2+2);
        } else {
            rend = function (x, y, tile, rx, ry){
                render_obj(buffer, 0, y, 
                           (tile.oleft || 0) - ol,
                           (tile.otop  || 0) - ot,
                           "tile", tile.src);
            };
            grid.real_map(rend, // this won't work
                          actors.ren.x-width/2+2,
                          actors.ren.x-width/2+2+1);            
        }
        deep--;
    };

    var render = function (grid, continuation) {
        // If we haven't moved forward or backward, we can just move Ren; 
        // otherwise, you'll have to move the whole grid. If there are 
        // transitions, inact them first, but render them afterwards.
        $(".possibility").remove();

        continuation = render_transitions(grid, continuation);
        
        shift_background(actors.ren);
        var buffer = $("<div></div>");

        if (actors.ren.x == actors.ren.prev.x) { // motion in y just moves ren

            shift_actors(actors, continuation);

        } else {                             // motion in x moves the grid.

            var xmove = (actors.ren.x-actors.ren.prev.x);
            var sign = xmove/Math.abs(xmove);

            // Move just one row at a time, in x.
            for(var i = 0; i<xmove*sign-1; i++){
                $("#grid").animate({top: '-='+sign*x_magic[1],
                                    left: '-='+sign*x_magic[0]
                                   }, {duration:step_speed[rating], complete:function () {
                                           render_new_row(grid, $("#grid"), sign);
                                       }});
            }
            $("#grid").animate({top: '-='+sign*x_magic[1],
                                left: '-='+sign*x_magic[0]
                               }, {duration:step_speed[rating], complete:function () {
                                       render_new_row(grid, $("#grid"), sign);
                                       continuation($("#grid"));
                                   }});

            shift_actors(actors); // Motion in x may take longer, 
                                 // so the continuation must be done there.
        }
        shift_possibilities(actors.ren, $("#grid"));
        render_mile();
    };


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
                       var win = can_i_win(grid, actors.ren);
                       if (count > 1 && !win){
                           tick_bang(count-1);
                       } else {
                           $("#mask").css("background-color", "#1f1f1f");
                           $("#impossible").hide();
                           if (!win){
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
        if (sound) $("#bang").get(0).play();
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
            
           // move_haters(actors, grid); // move the haters

            if( !grid.move(actors.ren, a, d) ) {  // If the move fails, kill'em.
                bang(actors.ren, function () {grid.load(actors.ren);
                                            initialize_render(grid);
                                            canmove = true;});
                return;
            }

            render(grid, function () {
                       if (canmove == false && !can_i_win(grid, actors.ren)) { // If they're stuck, kill'em.
                           tick_bang();
                       }
                       // if (actors.ren.x === actors.antiren.x && 
                       //     actors.ren.y === actors.antiren.y ) {  
                       //         // If the hater catches 'em, kill'em.
                       //         bang(actors.ren, function () {grid.load(actors.ren);
                       //                                       initialize_render(grid);
                       //                                       canmove = true;});
                       //     }
                       
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
    $("#mile").hide(); // hide the mile

    $("#start").hide();      // and the "press space to begin" message
    $("#" + rating).css("background-color", "#bfb");
    $("#easy").click(function () {if (rating === "easy"){
                                      rating = "hard";
                                       $("#easy").css("background-color", "#ccc");
                                       $("#easy").css("color", "#444");
                                      $(".poss").hide();
                                  } else {
                                      rating = "easy";
                                      $("#easy").css("background-color", "#bfb");
                                       $("#easy").css("color", "#000");
                                       hideshow_possibilities(actors.ren);
                                  }
                                 });
    $("#mute").css("background-color", "#bfb");
    $("#mute").click( function(){
                          if (sound){
                              sound = false;
                              $("#mute").css("background-color", "#ccc");
                              $("#mute").css("color", "#444");
                              $("#mute").html("Unmute");
                              $("#ding").get(0).pause();
                              $("#bang").get(0).pause();
                          } else {
                              sound = true;
                              $("#mute").css("background-color", "#bfb");
                              $("#mute").css("color", "#000");
                              $("#mute").html("Mute");
                          }});
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
                        grid = new_grid(localStorage.url || "1.ren", 
                                        {ding:ding, next_level:next_level});
                        grid.load(actors.ren);
                        for(var i = 0; i<actors.ren.coins; i++)
                            $("#rewards").append("<img class='reward' src='img/coin.png'>");

                    } else if (e.which === 78) {
                        grid = new_grid(window.location.hash.slice(1) || "1.ren", 
                                        {ding:ding, next_level:next_level});
                        
                    } if (e.which === 32 || e.which === 78) {
                        actors.ren.save(grid);
                        $("#overlay").fadeOut();
                        $("#loader").fadeOut();

                        // Attach default keymap.
                        $("body").unbind("keydown");
                        $("body").keydown(function (e) {
                                              if (keymap[e.which]) {
                                                  keymap[e.which]();
                                              }
                                          });

                        initialize_render(grid);
                    }
                });
        });



    /** Preload some images. Eventually, it'll be best to just cram these into
     *  the main HTML page. **/

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
    }("img/antiwren.png", "img/antigren.png", "img/poss.png",
        "img/load.gif", "img/bang.png", "img/clock.png", "img/cclock.png",
      "img/gleft.png", "img/gren.png", "img/gupup.png", "img/gwswap.png", 
      "img/water.png", "img/wgchange.png", "img/wleft.png", "img/wrigh.png", 
      "img/gdown.png", "img/green.png", "img/grigh.png", 
      "img/odown.png", "img/oleft.png", "img/origh.png", "img/oupup.png",
      "img/gwchange.png", "img/save.png", "img/saved.png", "img/waterb.png", 
      "img/wdown.png", "img/white.png", "img/wren.png", "img/wupup.png", 
      "img/orang.png", "img/oren.png", "img/owchange.png", "img/wochange.png", 
      "img/gochange.png", "img/ogchange.png", "img/goswap.png", "img/owswap.png"));

    

});


