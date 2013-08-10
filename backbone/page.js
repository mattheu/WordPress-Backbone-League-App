var userID = 1;

League = Backbone.Model.extend( {

	urlRoot: function() { return '/wordpress/api/league/'; },

	default : {
		name  : null,
		owner : null,
		games : []
	},

	initialize: function(){

		console.log("League initialize");

	}

} );

Game = Backbone.Model.extend({

	urlRoot: function() { return '/wordpress/api/game/'; },

	default : {
		player1      : null,
		player1Score : null,
		player2      : null,
		player2Score : null,
		league       : null,
		timestamp    : null
	},

	initialize: function(){

		console.log("Game initialize");

	},

	getWinner: function() {

		if ( this.get( 'player1Score' ) > this.get( 'player2Score' ) )
			return this.get( 'player1' );

		else if ( this.get( 'player1Score' ) < this.get( 'player2Score' ) )
			return this.get( 'player2' );

		else
			return null;

	},

});

var leagueData = {
	id: 2,
}

var leagueA = new League( leagueData );
leagueA.fetch();

window.setTimeout( function() {
	console.log( leagueA.toJSON() );
}, 1000 );

var gameData = {
	player1      : 1,
	player2      : 2,
	player1Score : 16,
	player2Score : 25,
	league       : leagueA,
	author       : userID
};

//var gameA = new Game( gameData );
//gameA.save();
//


window.setTimeout( function() {
	//console.log( gameA.toJSON() );
	//console.log( gameA.get( 'league' ).toJSON() );
}, 1500 );


// game1.save( gamesData[0], {
// 	success: function (game ) {
// 		console.log( game.toJSON() );
// 	}
// })

//game1.save();
//var games = [];

// for ( var i = 0; i < gamesData.length; i++ ) {

// 	games.push( new Game( gamesData[i] ) ); }

//  var AppRouter = Backbone.Router.extend({
// 	routes: {
// 		"league/:id": "getLeague",
// 		"league/:id/": "getLeague",
// 		"*actions": "defaultRoute" // Backbone will try match the route above first
// 	}
// });

// // Instantiate the router
// var app_router = new AppRouter;

// app_router.on('route:getLeague', function (id) {
// 	// Note the variable in the route definition being passed in here
// 	alert( "Get League number " + id );



// });

// app_router.on('route:defaultRoute', function (actions) {
// 	alert( actions );
// });

// // Start Backbone history a necessary step for bookmarkable URL's
// Backbone.history.start();


// var game = new Game();
// game.set( 'id', 123 );
// game.fetch();


// var league = new League();
// league.set( 'id', 4 );
// league.fetch( {}, function() {

// 	alert( league.get( 'name' ) );

// } );