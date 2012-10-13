var preloaded = {};

$(document).ready(
function () {

    /* This file provides the 2.5D UI for Renshaw's Disco.

     API: render(game)

     Where game is an object:
     ren is a player object
     A player object must have .x and .y integer coords.
     map, a function that applies a function to each elt in game grid.
     signature:   game.map ( function (x, y, tile) )

     */


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
    }("img/load.gif", "img/bang.png",
      "img/gleft.png", "img/gren.png", "img/gupup.png", "img/gwswap.png", 
      "img/water.png", "img/wgchange.png", "img/wleft.png", "img/wrigh.png", 
      "img/gdown.png", "img/green.png", "img/grigh.png", 
      "img/odown.png", "img/oleft.png", "img/origh.png", "img/oupup.png",
      "img/gwchange.png", "img/save.png", "img/saved.png", "img/waterb.png", 
      "img/wdown.png", "img/white.png", "img/wren.png", "img/wupup.png", 
      "img/orang.png", "img/oren.png", "img/owchange.png", "img/wochange.png", 
      "img/gochange.png", "img/ogchange.png", "img/goswap.png", "img/owswap.png");
    
    var
    width = 24,    // in view at one time
    height = 7,
    x_magic = [-50, -27],  // magic #s are offsets for isometric grid tiles
    y_magic = [-66, 7],
    max_left = -((width-4)*x_magic[0]),  // offset for the whole grid
    max_top = -((width-1)*x_magic[1]+(height)*y_magic[1]),
    step_speed = 125,
    transition_speed = 150;


    var grid_left = function(x, y){
        return max_left+(y*y_magic[0]+x*x_magic[0]);
    };
    var grid_top = function(x, y){
        return max_top+(y*y_magic[1]+x*x_magic[1]);
    };

    var ding = function (i) {
        $("#ding").get(0).play();
        $("#rewards").append("<div class='reward'>"+i+"</div>");
    };

    var grid = new_grid(window.location.hash.slice(1) || "level1.ren", 
                       {ding:ding});


    /** Rendering **/
    // Dups! Fix yo'sel!    
    var render_obj = function (buffer, x, y, ol, ot, cls, src) {
        if(!preloaded["img/"+src]) console.log(src);
        var $obj = preloaded["img/"+src].clone();

        $obj.attr("class", cls);
        $obj.css({ left: grid_left(x, y) + ol + "px",
                   top:  grid_top(x, y)  + ot + "px"});
        buffer.append($obj);
        return $obj;
    };


    var render_tile = function (buffer) {
        return function (x, y, tile){
            render_obj(buffer, x, y, tile.oleft || 0, tile.otop || 0, "tile", tile.src);
        };
    };

    var render_tiles = function(grid, buffer) {
            grid.real_map(render_tile(buffer), 
                          grid.ren.x-width/2+2, 
                          grid.ren.x+width/2+2);
    };


    var render_special = function (buffer) {
        return function (x, y, tile){
            render_obj(x, y, tile.offset[0], tile.offset[1], "tile", tile.src);
        };
    };

    var render_specials = function (grid, buffer) {
        grid.map_specials(render_special(buffer), 
                          grid.ren.x-width/2+2, 
                          grid.ren.x+width/2+2);
    };


    var render_ren = function (buffer, ren){
        render_obj(buffer, 10, ren.y, 4, -95, "ren", ren.src[ren.color]);
    };

    var shift_ren = function(ren, continuation) {
        var x = 10, y = ren.y;
        $(".ren").animate(
            {left: max_left+(y*y_magic[0]+x*x_magic[0])+4+"px",
             top:  max_top+(y*y_magic[1]+x*x_magic[1])+-95+"px"},
            {duration:step_speed, complete:continuation});
    };


    var shift_background = function (ren){
        $("#mask").animate({'background-position-x':  -ren.x*x_magic[0],
                            'background-position-y': -ren.x*x_magic[1]}, 
                           {duration: step_speed, 
                            complete:  function () {
                                $("#mask").css("background-color", 
                                               {orang:"#2f0f2f", 
                                                green:"#102f2f", 
                                                white:"#1f1f2f"}[ren.color]);
                            }});
    };
    

    var render_transitions = function (grid, continuation) {
        // Todo, render ren-transitions separately.
        if (grid.transition()) {
            return function () {
                var buffer = $("<div id='bgrid'></div>").hide();
                render_tiles(grid, buffer);
                render_specials(grid, buffer);            
                render_ren(buffer, grid.ren);
                $("#mask").append(buffer);
                buffer.fadeIn(transition_speed, function () {
                                  $("#mask .ren").remove();
                                  render_ren($("#mask"), grid.ren);
                                  $("#grid").empty();
                                  $("#grid").css({top:0, left:0});
                                  $("#grid").append(buffer.contents());
                                  $("#mask #bgrid").remove();
                                  
                                  continuation();
                              });
                
            };
        } else {
            return continuation;
        }
        
    };

    var initialize_render = function (grid) {
        var buffer = $("<div></div>");
        $(".ren").remove();
        
        render_tiles(grid, buffer);
        render_specials(grid, buffer);
        render_ren($("#mask"), grid.ren);
        shift_background(grid.ren);

        $("#grid").empty();
        $("#grid").css({top:0, left:0});
        $("#grid").append(buffer.contents());
    };

    var deep = -1;
    var render_new_row = function (grid, buffer, direction){
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
                          grid.ren.x+width/2+2-1,
                          grid.ren.x+width/2+2);
        } else {
            rend = function (x, y, tile, rx, ry){
                console.log(x, y, rx, ry);
                render_obj(buffer, 0, y, 
                           (tile.oleft || 0) - ol,
                           (tile.otop  || 0) - ot,
                           "tile", tile.src);
            };
            console.log(grid.ren.x-width/2+2-1);
            grid.real_map(rend, // this won't work
                          grid.ren.x-width/2+2-1,
                          grid.ren.x-width/2+2);            
        }
        deep--;
    };

    var render_motion = function (grid, continuation) {
        // If we haven't moved forward or backward, just redraw Ren; 
        // otherwise, you'll have to draw everything.
        shift_background(grid.ren);

        var buffer = $("<div></div>");
        if (grid.ren.x !== grid.ren.prev.x) { // x motion moves the grid
            var xmove = (grid.ren.x-grid.ren.prev.x);
            var sign = xmove/Math.abs(xmove);
            for(var i = 0; i<xmove*sign; i++){
                $("#grid").animate({top: '-='+sign*x_magic[1],
                                    left: '-='+sign*x_magic[0]
                                   }, {duration:step_speed, complete:function () {
                                           render_new_row(grid, $("#grid"), sign);
                                       }});
            }

            continuation = render_transitions(grid, continuation);
            shift_ren(grid.ren, continuation);

        } 
        if (grid.ren.y !== grid.ren.prev.y){
            continuation = render_transitions(grid, continuation);
            shift_ren(grid.ren, continuation);
        }
    };

    var render = function (grid, continuation) {
        render_motion(grid, continuation); 
    };


    var tick_bang = function (count) {
        count = count || 10;
        $("#impossible").show().css('left', ($(window).width() - 
                                             $("#impossible").outerWidth()) / 2);
        if (count % 2) {
            $("#mask").css("background-color", "#FF0000");
        } else {
            $("#mask").css("background-color", "#1F1F1F");
        }
        setTimeout(function () {
                       if (count > 1 && !can_i_win(grid)){
                           tick_bang(count-1);
                       } else {
                           $("#mask").css("background-color", "#1f1f1f");
                           $("#impossible").hide();
                           if (!can_i_win(grid)){
                               bang(grid.ren, function () {grid.load();
                                                           initialize_render(grid);});
                           }
                       }
                   }, 500);
    };

    var bang = function (ren, continuation){
        $(".ren").remove();
//        $("#bang").get(0).();
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
    var move = function(a, d){
        return function () { 
            if (!canmove) return;
            canmove = false;
            if( !grid.move(a, d) ) {
                bang(grid.ren, function () {grid.load();
                                            initialize_render(grid);
                                            canmove = true;});
                return;
            }
            render(grid, function () {
                       if (!can_i_win(grid)) {
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
                      grid.load();
                      initialize_render(grid);}       // space
                 };


    $("#impossible").hide();    
    $("#start").hide();
    $(window).load(
        function(){
            $("#limg").hide();
            $("#start").fadeIn();
            $("body").keydown(
                function (e) {
                    if(e.which === 32) {
                        $("#overlay").fadeOut();
                        $("#loader").fadeOut();
                        $("body").keydown(function (e) {
                                              if (keymap[e.which]) {
                                                  keymap[e.which]();
                                              }
                                          });
                        initialize_render(grid);
                    }
                }
            );
        });
});

