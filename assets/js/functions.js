var starlingHelper = {

	formatTimestamp : function( unixTimestamp ) {

		if ( typeof( unixTimestamp ) === "undefined" )
			return;

		var dt = new Date( unixTimestamp * 1000);

		var currentDate       = dt.getDate(),
		    currentMonth   = dt.getMonth() + 1, //Months are zero based
		    currentYear    = dt.getFullYear(),
		    currentHours   = dt.getHours(),
		    currentMinutes = dt.getMinutes();

		if ( currentHours < 10 )
			currentHours = '0' + currentHours;

		if ( currentMinutes < 10 )
			currentMinutes = '0' + currentMinutes;

		return currentDate + '/' + currentMonth + ' ' + currentHours + ":" + currentMinutes;

	},

	// Return true if the match is between the same players.
	gameCompare : function( game1, game2 ) {

		return ( game1.player1 == game2.player1 || game1.player1 == game2.player2 ) && ( game1.player2 == game2.player1 || game1.player2 == game2.player2 )

	},

	destroyView : function( view ) {

		if ( typeof( view ) !== 'undefined' ) {
			view.unbind();
			view.remove();
		}

	}

}