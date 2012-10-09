$(document).ready(
function () {

    $(".story").hide();

    var script = function(content, dic){
        dic = dic || {};
        $("#overlay").show();
        var it = $("<div class='story'></div>").hide();
        it.append(content);
        $("body").append(it);
        if (dic.width)
            it.css("width",  dic.width);
        dic.top = dic.top || 50;
        dic.left = (dic.left || 0) + (($(window).width() - 
                                       it.outerWidth()) / 2 + 
                                      $(window).scrollLeft());
        it.css({top : dic.top,
                left : dic.left});
        if (dic["class"])
            it.addClass(dic["class"]);

        dic.time  = dic.time || 1500;
        it.not(":last").fadeIn(dic.time);
        it.filter(":last").fadeIn(dic.time, dic.callback);
    };


    var unscript = function (time, callback) {
        $("#overlay").hide();
        var it = $(".story");
        it.not(":last").fadeOut(time);
        it.filter(":last").fadeOut(time, callback);
    };

    function s1 () {
        script("<p>&quot;The whole <em>office</em> has been downsized.&quot;</p>",
               {'class' : "triangle-left",
                callback : s2,
                left: -200,
                width:200
               });
    }

    function s2 () {
        script("<p>&quot;No, pal, you can't borrow any more money from <em>me</em>.&quot;</p>",
               {'class' : "triangle-right",
                callback : s3,
                left: 190,
                width:225
               });
    }

    function s3 () {
        script("<p>&quot;Rent is due <em>tomorrow</em>. No more excuses.&quot;</p>",
               {'class' : "triangle-left",
                callback : s4,
                left: -190,
                top:250,
                width:225
               });
    }

    function s4 () {
        script("<p>&quot;Nothing you can do about it now. Go to bed. Finish packing in the morning.&quot;</p>",
               {'class' : "triangle-right",
                callback : function () {unscript(5000); s5();},
                left: 180,
                top:300,
                width:280
               });
    }

    function s5 () {
        script("<img src='img/come.svg'>",
               {'class' : "triangle-left",
                time:2000,
                callback: function () {
                    setTimeout(function () {
                                   unscript(1000, s6);
                                   $("#overlay").show();}
                               , 3000);}});
    }

    function s6 () {
        script("<p>Half-asleep, I replayed the voices of past weeks; and then something else &mdash; a gruff voice &mdash; the voice that calls sailors to sea. It spoke no human word, but I knew it well: it had come when I was a boy. It was offering something, a way out &mdash; I only need accept.</p> <p>So I did.</p><div class='space'>hit spacebar</div>");
        $("body").keydown(function(e) {
                          if (e.which == 32) {
                              unscript();
                          }});
    }
    
    s1();

});

/*
s1();
    script(1, function () {  // Introductory script.
               script(2, function() {
                          script(3, function() {
                                     render(grid);
                                     script(4);});});});
    var story_action = null;
    var script = function(i, callback){
        $("#overlay").show();
        var it = $("#s"+i);
        it.css("top", 50);
        it.css("left", ($(window).width() - it.outerWidth()) / 2 + 
            $(window).scrollLeft());
        it.fadeIn(2500);
        story_action = callback;
    };

    var unscript = function(){
        $("#overlay").hide();
        $(".story").fadeOut(500);        
        if (story_action)
            story_action();
    };
*/