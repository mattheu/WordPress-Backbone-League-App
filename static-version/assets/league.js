
// Users - will be retrieved from database. Could have more info than this if required.
var users = {
	// 1 : { name: 'Buster', userID: 1 },
	// 2 : { name: 'Roscoe', userID: 2 },
	// 3 : { name: 'Tamsin', userID: 3 }
};

// Array of resent game results.
var results = [
	//{ 1:3, 2:3 },
	// { 2:1, 3:2 },
	// { 1:3, 3:0 }
]

/**
 * Example/Demo Usage
 */
$(document).ready( function () {

	var league = new MattheuLeague( 'test' );

	window.addEventListener('push', function() {
		var league = new MattheuLeague( 'test' );
	});

});


(function ($) {

	MattheuLeague = function ( leagueID ) {

		var self = this;

		self.users = users;
		self.rounds = 1;
		self.fullRounds = false;

		var getLeagueStatusModel = { points: 0, won: 0, lost: 0, draw: 0, scoreFor: 0, scoreAgainst: 0, played: 0 };

		self.init = function () {

			// Setup league Property object for each user.
			for ( userID in self.users )
				self.users[userID][leagueID] = Mll.cloneObject( getLeagueStatusModel );

			// Set up Interface
			self.setup();

			// Actions
			$('form#new-result').submit( self.newResultFormSubmit );
			$('form#new-player').submit( self.newPlayerFormSubmit );

		};

		// Set everything up!
		self.setup = function() {

			// Reset standings.
			self.userStandings = [];

			// Populate everything!
			self.drawNewResultForm()
			self.drawResultsTable();
			self.drawStandingsTable();
			self.drawFixturesTable();
			self.drawAddRoundLink();

		};

		/**
		 * Display table of results (games played) in the .results-table.
		 */
		self.drawResultsTable = function() {

			var table = $('.results-table' ),
				r = '';

			if ( results.length === 0 )
				table.closest('.section').hide();
			else
				table.closest('.section').show();

			// Always draw the table from scratch.
			table.fadeOut(100).children().remove();

			// Loop through results
			for ( var i = 0; i < results.length; i++ ) {

			 	var isFirst = true;
			 	r += '<tr>';

				for ( userID in results[i]) {

					if ( isFirst ) {
						r += '<td class="first">' + self.users[userID].name + '</td><td class="first">' + results[i][userID] + '</td>';
						isFirst = false;
					} else {
						r += '<td>' + results[i][userID] + '</td><td>' + self.users[userID].name + '</td>';
					}

				}
				r += '</tr>';
			}

			table.append( $(r) ).fadeIn(100);

		};

		// Populate the standings table.
		self.drawStandingsTable = function() {

			var table     = $('.standings-table' ),
				tableBody = table.find( 'tbody' ),
				standings = self.getUserStandings(),
				r = '';

			if ( standings.length === 0 )
				table.closest('.section').hide();
			else
				table.closest('.section').show();

			table.fadeOut(100);
			tableBody.children().remove();

			for ( var i = 0; i < standings.length; i++ ) {

				r += '<tr>';
				r += '<td>' + standings[i].name + '</td>';
				r += '<td>' + standings[i][leagueID].played + '</td>';
				r += '<td>' + ( standings[i][leagueID].scoreFor - standings[i][leagueID].scoreAgainst ) + '</td>';
				r += '<td><strong>' + standings[i][leagueID].points + '<strong></td>';
				r += '</tr>';

			}

			tableBody.append( $(r) );
			table.fadeIn(100);

		};

		// Recalculate the current user standings.
		self.calculateUserStandings = function() {

			// Helper. Set to false within for loop to check we actually have users in the self.users property. Otherwise return.
			var noUsers = true;

			// Reset the league properties.
			for ( userID in self.users ) {
				noUsers = false;
				self.users[userID][leagueID] = Mll.cloneObject( getLeagueStatusModel );
			}

			if ( noUsers )
				return;

			for ( var i = 0; i < results.length; i++ ) {

				// Get user ids of users in this game.
				// Assign them & thier scores to easy to access variables.
				var gameUsers = Object.keys( results[i] ),
					playerA = parseInt( gameUsers[0] ),
					playerB = parseInt( gameUsers[1] ),
					playerAScore = parseInt( results[i][gameUsers[0]] ),
					playerBScore = parseInt( results[i][gameUsers[1]] );

				if ( playerAScore > playerBScore ) {
					self.updateUserStanding( playerA, 'win', playerAScore, playerBScore );
					self.updateUserStanding( playerB, 'loss', playerBScore, playerAScore );
				} else if ( playerBScore > playerAScore ) {
					self.updateUserStanding( playerB, 'win', playerBScore, playerAScore );
					self.updateUserStanding( playerA, 'loss', playerAScore, playerBScore );
				} else {
					self.updateUserStanding( playerA, 'draw', playerAScore, playerBScore );
					self.updateUserStanding( playerB, 'draw', playerBScore, playerAScore );
				}

			}

			// Sort by points.
			self.userStandings.sort( sort_by_nested( 'test', 'points', false, parseInt ) );

		};

		// Get the user standings.
		// Preferable to use this method rather than accessing the userStandings property directly.
		self.getUserStandings = function() {

			// Create Array of user objets to be ordered by the current standings.
			if ( typeof( self.userStandings ) === 'undefined' )
				self.userStandings = [];

			if ( self.userStandings.length < 1 ) {

				for ( user in self.users )
					self.userStandings.push( self.users[user] );

				// Calculate user standings
				self.calculateUserStandings();

			}

			return self.userStandings;

		}

		self.updateUserStanding = function( userID, status, scoreFor, scoreAgainst ) {

			// Clone user object for convenience.
			var userLeagueStatus = self.users[userID][leagueID];

			userLeagueStatus.played += 1;
			userLeagueStatus.points += ( 'win' === status ) ? 3 : ( 'loss' === status ) ? 0 : 1;
			userLeagueStatus.scoreFor += scoreFor;
			userLeagueStatus.scoreAgainst += scoreAgainst;

			// Update win/lost/drawn count
			'win' === status ? userLeagueStatus.won += 1 : 'loss' === status ? userLeagueStatus.lost += 1 : userLeagueStatus.draw += 1;

		}

		self.drawFixturesTable = function() {

			var table    = $('.fixtures-table' ),
				fixtures = self.calculateFixtures();
			    r = '';

			if ( fixtures.length === 0 )
				table.closest( '.section' ).hide();
			else
				table.closest( '.section' ).show();

			// Always draw the table from scratch.
			table.fadeOut(100).children().remove();

			// Loop through results
			for ( var i = 0; i < fixtures.length; i++ ) {

				r += '<tr>';
				r += '<td class="first">' + self.users[fixtures[i][0]].name + '</td>';
				r += '<td>' + self.users[fixtures[i][1]].name + '</td>';

				r += '</tr>';
			}

			table.append( $(r) ).fadeIn(100);

		}

		self.drawAddRoundLink = function() {

			$('#new-round-link').remove();

			var table = $('.fixtures-table' ),
				newRoundLink = $('<button id="new-round-link">New Round</button>');

			table.after( newRoundLink );

			newRoundLink.click( function() {
				self.rounds++;
				self.setup();
			} );

		}

		self.calculateFixtures = function() {

			// Make sure this has been calculated.
			self.getUserStandings();

			var userCount = Object.keys( self.users ).length,
			    gamesPerRoundPerUser = ( userCount - 1 ) * 2;

			//gamesPerRound = ( userCount * userCount ) - userCount, // x^2-x=N

			// Get all fixtures.
			var roundFixtures = [];
			for ( userID in self.users ) {
				for ( userID2 in self.users ) {
					if ( self.users[userID] !== self.users[userID2] ) {
						roundFixtures.push( [ userID, userID2 ] );
					}
				}
			}

			// By default, home & away games are scheduled.
			// Remove duplicates unless self.fullRounds is true
			if ( ! self.fullRounds ) {
				for ( var i = 1; i < roundFixtures.length; i++ ) {
					for ( var ii = 0; ii < roundFixtures.length; ii++ ) {
						if ( i != ii && jQuery.arrayCompare( roundFixtures[i], roundFixtures[ii] ) ) {
							roundFixtures.splice( ii, 1 );
							break;
						}
					}
				}
			}

			// Set up sheduled fixtures.
			var scheduledFixtures = [];

			// Add round fixtures for each round
			for ( var i = 0; i < self.rounds; i++ ) {
			 	scheduledFixtures = scheduledFixtures.concat( roundFixtures.slice(0) );
			}

			//Loop through scheduled & check off played
			for ( var i = 0; i < results.length; i++ ) {
				var players = Object.keys( results[i] );
				for ( var ii = 0; ii < scheduledFixtures.length; ii++ ) {
					if ( jQuery.arrayCompare( players, scheduledFixtures[ii] ) ) {
						scheduledFixtures.splice( ii, 1 );
						break;
					}
				}
			}

			return scheduledFixtures;

		}


		// Populate the "New Result" form with eligable users.
		self.drawNewResultForm = function () {

			var select = $('.user-select')
			select.children().remove();

			if ( self.calculateFixtures().length === 0 )
				select.closest( '.section' ).hide();
			else
				select.closest( '.section' ).show();

			for ( userID in self.users ) {
				select.append( $('<option value="' + userID + '">' + users[userID].name + '</option>' ) );
			}

		}

		// Handle New Result form submission
		self.newResultFormSubmit = function(e) {

			e.preventDefault();

			if ( ! self.newResultFormValidate() )
				return;

			var game = {},
				playerA = parseInt( $('#new-result-player-1').val() ),
				playerB = parseInt( $('#new-result-player-2').val() ),
				playerAScore = parseInt( $('#new-result-player-1-score').val() ),
				playerBScore = parseInt( $('#new-result-player-2-score').val() );

			$(this).closest('form')[0].reset();

			game[playerA] = playerAScore;
			game[playerB] = playerBScore;

			results.push( game );

			self.setup();

			//window.location = "/?p=league-standings"

		};

		// Handle New Result form validation
		self.newResultFormValidate = function() {

			var isValid	 = true,
				playerA = parseInt( $('#new-result-player-1').val() ),
				playerB = parseInt( $('#new-result-player-2').val() ),
				playerAScore = parseInt( $('#new-result-player-1-score').val() ),
				playerBScore = parseInt( $('#new-result-player-2-score').val() ),
				validationOutput = $('#new-result-form-validation'),
				validationMessage = '';

			validationOutput.children().remove();

			var fixtures = self.calculateFixtures();
			for ( var i = 0; i < fixtures.length; i++ )
				if ( jQuery.arrayCompare( fixtures[i], [ playerA, playerB ] ) ) {
					isValid = false;
					validationMessage = 'Game not scheduled.';
				}

			if ( playerA == playerB ) {
				isValid = false;
				validationMessage = 'Player cannot play themselves.';
			}

			if ( playerAScore === '' || playerBScore === '' ) {
				isValid = false;
				validationMessage = 'Must set a score for each player.';
			}

			if ( validationMessage.length > 0 )
				validationOutput.append( $('<p class="info error">' + validationMessage + '</p>') );

			return isValid;

		};

		/** Handle New Player Form Submission **/
		self.newPlayerFormSubmit = function(e) {

			e.preventDefault();

			if ( ! self.newPlayerFormValidate() )
				return;

			// Generate new Unique User ID.
			newUserID = (new Date()).getTime();

			self.users[newUserID] = {
				name : $('#new-player-name' ).val(),
				userID : newUserID
			};

			$(this).closest('form')[0].reset();

			self.setup();

		}

		/** Handle New Player Form Validation **/
		self.newPlayerFormValidate = function() {

			var isValid = true,
				validationOutput = $('#new-player-form-validation'),
				validationMessage = '',
				playerName = $('#new-player-name').val();

			validationOutput.children().remove();

			// Check form completed.
			if ( '' === playerName ) {
				isValid = false;
				validationMessage = "You must enter a player name";
			}

			// Check User is not duplicate
			for ( userID in self.users )
				if ( playerName == self.users[userID].name ) {
					isValid = false;
					validationMessage = 'This player already exists';
				}

			// Output message
			if ( validationMessage.length > 0 )
				validationOutput.append( $('<p class="info error">' + validationMessage + '</p>') );

			return isValid;

		}

		self.init();

	}

})(jQuery);
