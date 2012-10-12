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
    }("img/load.gif",
      "img/baobab.png", "img/clockwork.png", "img/clock.png", "img/cclock.png", 
      "img/gleft.png", "img/gren.png", "img/gupup.png", "img/gwswap.png", 
      "img/water.png", "img/wgchange.png", "img/wleft.png", "img/wrigh.png", 
      "img/baobad.png", "img/gdown.png", "img/green.png", "img/grigh.png", 
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
            render_obj(buffer, x, y, 0, 0, "tile", tile.src);
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
        render_obj(buffer, 10, ren.y, 4, -90, "ren", ren.src[ren.color]);
    };

    var shift_ren = function(ren, continuation) {
        var x = 10, y = ren.y;
        $(".ren").animate(
            {left: max_left+(y*y_magic[0]+x*x_magic[0])+4+"px",
             top:  max_top+(y*y_magic[1]+x*x_magic[1])+-90+"px"},
            {duration:step_speed, complete:continuation});
    };


    var render_background = function (ren){
        $("#mask").css("background-position",  -ren.x*x_magic[0]+"px " + 
                                               -ren.x*x_magic[1]+"px");
        $("#mask").css("background-color", {orang:"#653", 
                                            green:"#563", 
                                            white:"#555"}[ren.color]);
    };


    var render_transitions = function (grid, continuation) {
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

        $("#grid").empty();
        $("#grid").append(buffer.contents());
    };

    var render_motion = function (grid, continuation) {
        // If we haven't moved forward or backward, just redraw Ren; 
        // otherwise, you'll have to draw everything.
        var buffer = $("<div></div>");
        if (grid.ren.x !== grid.ren.prev.x) { // x motion moves the grid
            var xmove = (grid.ren.x-grid.ren.prev.x);

            $("#grid").animate({top: '-='+xmove*x_magic[1],
                                left: '-='+xmove*x_magic[0]
                               }, {duration:step_speed, complete:function () {
                                       $("#grid").empty();
                                       $("#grid").css({top: 0,
                                                       left: 0
                                                          });
                                       $("#grid").append(buffer.contents());
                                   }});

            render_tiles(grid, buffer);
            render_specials(grid, buffer);
            continuation = render_transitions(grid, continuation);
            shift_ren(grid.ren, continuation);

        } 
        if (grid.ren.y !== grid.ren.prev.y){
            continuation = render_transitions(grid, continuation);
            shift_ren(grid.ren, continuation);
        }
    };

    var render = function (grid, continuation) {
        // $("#grid").stop(true, true);
        // $(".ren").stop(true, true);
        // $("#bgrid").stop(true, true);

        render_motion(grid, continuation); 
    };



    /** Alerts **/
    var alerted = false;
    var ralert = function(content, dic){
        alerted = true;
        dic = dic || {};
        $("#overlay").fadeIn(dic.time || 1000);
        var it = $("<div class='story'></div>").hide();
        it.append(content);
        $("body").append(it);
        if (dic.width)
            it.css("width",  dic.width);
        it.css({top : 100,
                left : (($(window).width() - 
                        it.outerWidth()) / 2 + 
                        $(window).scrollLeft())});
        if (dic["class"])
            it.addClass(dic["class"]);
        dic.time  = dic.time || 1500;
        it.not(":last").fadeIn(dic.time);
        it.filter(":last").fadeIn(dic.time, dic.callback);
    };


    var unalert = function (time, callback) {
        alerted = false;
        $("#overlay").stop().hide();
        var it = $(".story");
        it.not(":last").fadeOut(time);
        it.filter(":last").fadeOut(time, callback);
    };


    /** User input: **/
    var canmove = true;
    var move = function(a, d){
        return function () { 
            if (!canmove) return;
            if( !grid.move(a, d) ) {
                bang(grid.ren, function () {grid.load();
                                            initialize_render(grid);});
                return;
            }
            canmove = false;
            render(grid, function () {
                       if (!can_i_win(grid) && !alerted) {
                           ralert("Bummer. You now are hopelessly "
                                  + "stuck. Press spacebar to try "
                                  + "again.", {time:3000});
                       }
                       canmove = true;
                   });
        };
    };
    var keymap = {37:move("y",  1),   // left
                  38:move("x",  1),   // up
                  39:move("y", -1),   // right
                  40:move("x", -1),   // down
                  32:function(){unalert();grid.load();initialize_render(grid);}       // space
                 };
    $("body").keydown(function (e) {
                          if (keymap[e.which]) {
                              keymap[e.which]();
                          }
                      });


    $(window).load(function(){
                       $("#overlay").fadeOut();
                       $("#loader").hide();
                       initialize_render(grid);
                   });



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
});

