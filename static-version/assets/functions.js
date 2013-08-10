// Helper Functions
Array.max = function( array ){
    return Math.max.apply( Math, array );
};
Array.min = function( array ){
    return Math.min.apply( Math, array );
};

// Library.
Mll = {

   // Clone a javascript object
   cloneObject: function( object ) {

     return JSON.parse( JSON.stringify( object ) );

   },

}

// Here's a more flexible version, which allows you to create
// reusable sort functions, and sort by any field
var sort_by_nested = function( object, field, reverse, primer ) {

   //var key = function (x) { return primer ? primer( x[field] ) : x[field] };
   var key = function (x) { return primer ? primer( x[object][field] ) : x[object][field] };

   return function (a,b) {
      var A = key(a),
         B = key(b);
      return ( (A < B) ? -1 : (A > B) ? +1 : 0) * [-1,1][+!!reverse];
   };

   // console.log( r() );
   // return r();
}


/** Array compare function **/
jQuery.extend({
    arrayCompare: function (arrayA, arrayB) {
        if (arrayA.length != arrayB.length) { return false; }
        // sort modifies original array
        // (which are passed by reference to our method!)
        // so clone the arrays before sorting
        var a = jQuery.extend(true, [], arrayA);
        var b = jQuery.extend(true, [], arrayB);
        a.sort();
        b.sort();
        for (var i = 0, l = a.length; i < l; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
});

var a = [1, 2, 3];
var b = [2, 3, 4];
var c = [3, 4, 2];