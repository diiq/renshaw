/* Ok, the goal for this file is a search algorithm, to find the
furthest possible point in a renshaw grid reachable in 23 steps.

Eventually, we want it to midfy the grid if no 23-step position is
reachable --- but that will mean recognizing ko, and other hard
things.

It would also be nice to have it place a *, and repeat. This will be
easy. */

var search = function (grid, maxdepth) {
    maxdepth = maxdepth || 23;
    
    // the biggest trick will be keeping track of the tilemap and ren.
    // I;ll need obj_copy for this? or no, I can steal a save.
    var step = function () {};
};