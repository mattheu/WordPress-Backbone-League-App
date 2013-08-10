var app = { model: {}, collections: {}, views:{}, routers: {}, time: [] };

$(function(){

	var User = Backbone.Model.extend({

		urlRoot : '/wordpress/api/user/',

		defaults : {
			name         : null,
			league       : null,
			points       : 0,
			played       : 0,
			won          : 0,
			lost         : 0,
			draw         : 0,
			scoreFor     : 0,
			scoreAgainst : 0,
			diff         : 0
		},

		updateStanding : function( status, scoreFor, scoreAgainst ) {

			var newStandingData = {
			    played: this.get( 'played' ) + 1,
			    points: this.get( 'points' ) + ( ( 'win' === status ) ? 3 : ( 'loss' === status ) ? 0 : 1 ),
			    scoreFor: this.get('scoreFor') + parseInt( scoreFor ),
			    scoreAgainst: this.get('scoreAgainst') + parseInt( scoreAgainst ),
			    diff: this.get('scoreFor') - this.get('scoreAgainst')
			};

			if ( 'win' === status )
				newStandingData.won = this.get('won') + 1;
			else if ( 'loss' === status )
				newStandingData.lost = this.get('lost') + 1;
			else
				newStandingData.draw = this.get('draw') + 1;

			this.set(newStandingData);

		},

		deleteUser : function() {

			var games = app.currentLeague.resultsCollection.where({player1:this.get('id')} );
			games = games.concat( app.currentLeague.resultsCollection.where({player2:this.get('id')} ) );

			for ( var i = 0; i < games.length; i++ )
				games[i].destroy();

			this.destroy();

		}

	})

	var Game = Backbone.Model.extend( {

		urlRoot: '/wordpress/api/game/',

		defaults : {
			player1      : null,
			player1Score : null,
			player2      : null,
			player2Score : null,
			league       : null,
			timestamp    : null,
			author       : currentUserInfo.id
		},

		// Property for storing validation messages for this game.
		validationMessages : [],

		formValidate : function() {

			var isValid           = true;

			this.validationMessages = [];

			// If player not set.
			if ( null === this.get('player1') ||  '0' === this.get('player1') || null === this.get('player2') ||  '0' === this.get('player2') ) {
				isValid = false;
				this.validationMessages.push( 'Please select a player.' );
			}

			if ( this.get('player1') === this.get('player2') ) {
				isValid = false;
				this.validationMessages.push( 'Player cannot play themselves.' );
			}

			// If scores not set.
			if ( null === this.get('player1Score') || '' === this.get('player1Score') || null === this.get('player2Score') || '' === this.get('player2Score') ) {
				isValid = false;
				this.validationMessages.push( 'You must set a score for each player' );
			}

			var self = this;
			var isScheduled = false;
			app.currentLeague.fixturesCollection.each( function(game) {
				if ( starlingHelper.gameCompare( game.toJSON(), self.toJSON() ) )
					isScheduled = true;
			} );

			if ( false === isScheduled ) {
				isValid = false;
				this.validationMessages.push( 'Game not scheduled.' );
			}

			return isValid;

		},

		getWinner: function() {

			if ( this.get( 'player1Score' ) > this.get( 'player2Score' ) )
				return this.get( 'player1' );
			else if ( this.get( 'player1Score' ) < this.get( 'player2Score' ) )
				return this.get( 'player2' );
			else
				return null;

		},

		/**
		 * Add the points earned from this game to the appropriate user model.
		 * Warning: If called multiple times, this will give the user lots more points than they should
		 * But: it is preferable to do this when neccessary, rather than recalculating from scratch each time as this is slow.
		 */
		updatePlayerPoints : function() {

			var winner = this.getWinner();

			var player1 = app.currentLeague.usersCollection.get( this.get('player1') );
			var player2 = app.currentLeague.usersCollection.get( this.get('player2') );

			if ( typeof( player1 ) === 'undefined' || typeof( player2 ) === 'undefined' )
				return;

			if ( winner === null ) {
				player1.updateStanding( 'draw', this.get( 'player1Score' ), this.get( 'player2Score' ) );
				player2.updateStanding( 'draw', this.get( 'player2Score' ), this.get( 'player1Score' ) );
			} else if ( winner == player1.get('id') ) {
				player1.updateStanding( 'win', this.get( 'player1Score' ), this.get( 'player2Score' ) );
				player2.updateStanding( 'loss', this.get( 'player2Score' ), this.get( 'player1Score' ) );
			} else {
				player2.updateStanding( 'win', this.get( 'player2Score' ), this.get( 'player1Score' ) );
				player1.updateStanding( 'loss', this.get( 'player1Score' ), this.get( 'player2Score' ) );
			}

			app.currentLeague.usersCollection.sort();

		}

	});

	var League = Backbone.Model.extend( {

		urlRoot: '/wordpress/api/league/',

		defaults : {
			name    : null,
			owner   : null,
			players : [],
			rounds  : 1
		},

		// To be used for storing league data.
		resultsCollection : {},
		fixturesCollection : {},
		usersCollection : {},

		initialize: function() {

			var self = this;

			self.resultsCollection = new GameCollection();
			self.fixturesCollection = new GameCollection();
			self.usersCollection = new UserCollection();

			self.bind( 'change:players', function() {
				self.usersCollection.reset( this.get('players') );
			} );

			self.usersCollection.bind('reset update add remove', function() {
				self.recalculateStandings();
				self.recalculateFixtures();
			} );

			self.bind( 'change:games', function() {
				self.resultsCollection.reset( this.get('games') );
			} );

			self.bind( 'change:rounds', function(){
				self.recalculateFixtures()
			} );

			// Recalculate fixtures on load and whenever results are added/removed.
			self.resultsCollection.bind( 'reset update add remove', function() {
				self.recalculateFixtures();
			} );

			// Recalculate fixtures on load and whenever results are added/removed.
			self.resultsCollection.bind( 'reset', function() {
				self.recalculateStandings();
			} );

		},

		updateGames : function() {

			if ( typeof( this.get('games') ) === 'undefined' )
				this.fetch();

		},

		recalculateStandings : function() {

			console.log( 'recalculateStandings' );

			if ( this.usersCollection.length === 0 )
				return;

			// Reset standings.
			this.usersCollection.each( function( user ) {
				user.set({ points : 0, won : 0, lost : 0, draw : 0, scoreFor : 0, scoreAgainst : 0, played : 0 } );
			}, this );

			this.resultsCollection.each( function( game ) {
				game.updatePlayerPoints();
			}, this );

			this.usersCollection.sort();

		},

		recalculateFixtures : function() {
			this.fixturesCollection.reset( this.calculateFixtures() );
		},

		getRoundFixtures : function() {

			console.log( 'getRoundFixtures' );

			var self = this,
			    roundFixtures = [];

			self.usersCollection.each( function(user1) {
				self.usersCollection.each( function(user2) {
					if ( user1 !== user2 )
						roundFixtures.push( { player1: user1.get('id'), player2: user2.get('id') } );
				} );
			} );

			// By default, home & away games are scheduled.
			// Remove duplicates
			for ( var i = 0; i < roundFixtures.length; i++ )
				for ( var ii = 0; ii < roundFixtures.length; ii++ )
					if ( i != ii && starlingHelper.gameCompare( roundFixtures[i], roundFixtures[ii]) ) {
						roundFixtures.splice(ii,1);
						break;
					}

			return roundFixtures;

		},

		calculateFixtures : function() {

			console.log( 'calculateFixtures' );

			var self = this;

			// Get all fixtures.
			var roundFixtures = self.getRoundFixtures();

			// Set up all scheduled, and repeat for each round.
			var scheduledFixtures = [];
			for ( var i = 0; i < self.get('rounds'); i++ )
			 	scheduledFixtures = scheduledFixtures.concat( roundFixtures.slice(0) );

			// Loop through results & remove them from scheduled
			self.resultsCollection.each( function( game ) {
				for ( var i = 0; i < scheduledFixtures.length; i++ )
					if ( starlingHelper.gameCompare( game.toJSON(), scheduledFixtures[i] ) ) {
					 	scheduledFixtures.splice( i, 1 );
					 	break;
					}
			} );

			return scheduledFixtures;

		}

	} );

	// Collection
	var LeagueCollection = Backbone.Collection.extend( {
		url: function() { return '/wordpress/api/leagues/' },
		model: League
	} );

	// Collection
	var GameCollection = Backbone.Collection.extend( {

		model: Game,
		comparator : 'timestamp',

	} );

	var UserCollection = Backbone.Collection.extend({

		model: User,

		// Sort by points, then diff.
		comparator : function( user1, user2 ) {

			var user1Points = user1.get('points'),
			    user2Points = user2.get('points'),
			    user1Diff = user1.get('diff'),
			    user2Diff = user2.get('diff');

			if ( user1Points != user2Points )
				return ( user1Points < user2Points ) ? 1 : ( user1Points > user2Points ) ? -1 : 0;

			return ( user1Diff < user2Diff) ? 1 : (user1Diff > user2Diff) ? -1 : 0;

		}

	});

	var StandingRowView = Backbone.View.extend({

		tagName  :  "tr",
		template : _.template($('#league-standings-table-template').html()),

		initialize: function() {
			this.listenTo( this.model, 'change', this.render );
			this.listenTo( this.model, 'destroy', this.remove );
		},

		// Re-render the titles of the todo item.
		render: function() {
			this.$el.html( this.template(this.model.toJSON()) );
			return this;
		},

	});

	var StandingsView = Backbone.View.extend({

		template   : _.template( $('#league-standings-section-template').html() ),

		initialize : function() {

			$('#league-nav .link-league-standings').parent().addClass('active');

			this.renderStandingsSection();
			this.renderStandingsTable();

			this.listenTo( app.currentLeague.usersCollection, 'reset add remove update sort', this.renderStandingsTable );
			this.listenTo( app.currentLeague.resultsCollection, 'reset add remove', this.renderStandingsTable );

		},

		renderStandingsSection : function() {
			variables = { currentRoute: 'league/' + app.currentLeague.get('id') };
			this.$el.html( this.template( variables ) );
			return this;
		},

		renderStandingsTable : function() {
			var el = $("#league-standings-table tbody");
			el.children().remove();
			app.currentLeague.usersCollection.each( function( game ) {
				var view = new StandingRowView( {model:game} );
				el.append( view.render().el );
			}, this );
			return this;
		},

	})

	/**
	 * View - for displaying league results table.
	 */
	var LeagueResultView = Backbone.View.extend({

		tagName  :  "tr",
		template : _.template($('#league-results-table-template').html()),

		initialize: function() {

			this.listenTo( this.model, 'change', this.render );
			this.listenTo( this.model, 'destroy', this.remove );

		},

		events : {
			'click button.remove' : 'destroy'
		},

		render: function() {

			var game = this.model.toJSON();

			if ( typeof( game.player1 ) === 'undefined' || app.currentLeague.usersCollection.length === 0  )
				return this;

			console.log(  game.player1 );
			console.log(  game.player2 );
			console.log(  app.currentLeague.usersCollection.toJSON() );

			game.player1Name = app.currentLeague.usersCollection.get( this.model.get('player1') ).get('name');
			game.player2Name = app.currentLeague.usersCollection.get( this.model.get('player2') ).get('name')
			game.date        = starlingHelper.formatTimestamp( game.timestamp );

			this.$el.html( this.template( game ) );
			return this;

		},

		destroy: function(){
			if ( confirm( 'Are you sure?' ) )
				this.model.destroy();
			app.currentLeague.recalculateStandings();
		}

	});

	LeagueResultsView = Backbone.View.extend({

		template   : _.template( $('#league-results-section-template').html() ),

		initialize : function() {

			$('#league-nav .link-league-results').parent().addClass('active');

			this.renderResultsSection();
			this.addAllResults();

			this.listenTo( app.currentLeague.resultsCollection, 'add', this.addResult );
			this.listenTo( app.currentLeague.resultsCollection, 'reset', this.addAllResults );
			this.listenTo( app.currentLeague.usersCollection, 'reset update', this.addAllResults );

		},

		renderResultsSection : function() {
			var el = $('#league-view');
			variables = { currentRoute: '/league/' + app.currentLeague.get('id') };
			el.html( this.template( variables ) );
			return this;
		},

		// Add a single league result to the list by creating a view for it
		addResult : function(game) {
			var el   = $("#league-results-table tbody"),
			    view = new LeagueResultView( {model:game} );
			el.append( view.render().el );
			el.closest('.section').show();
		},

		// Reset & Add all league results
		addAllResults : function() {

			var el = $("#league-results-table tbody");

			// Show Hide.
			if ( app.currentLeague.resultsCollection.length === 0 )
				el.closest('.section').hide();

			el.children().remove();
			app.currentLeague.resultsCollection.each( this.addResult, this );
		},

	})

	/**
	 * View - for displaying league results table.
	 */
	var LeagueFixtureRowView = Backbone.View.extend({

		template : _.template($('#league-fixtures-table-template').html()),
		tagName  : 'tr',

		initialize: function() {
			this.listenTo( this.model, 'change', this.render );
			this.listenTo( this.model, 'destroy', this.remove );
		},

		events: {
			"click .new-result" : "newResultFromFixture"
		},

		// Re-render the titles of the todo item.
		render: function() {
			var variables = this.model.toJSON();
			variables.player1Name = app.currentLeague.usersCollection.get( this.model.get('player1') ).get('name');
			variables.player2Name = app.currentLeague.usersCollection.get( this.model.get('player2') ).get('name');
			this.$el.html( this.template( variables ) );
			return this;
		},

		newResultFromFixture : function() {
			app.currentNewResultSelection = [ this.model.get('player1'), this.model.get('player2') ];
			app.routers.app.navigate( 'league/' + app.currentLeague.get('id') + '/new-result', true );
		}

	});

	var LeagueFixturesView = Backbone.View.extend({

		template : _.template($('#league-fixtures-section-template').html() ),

		initialize : function() {
			$('#league-nav .link-league-fixtures').parent().addClass('active');
			this.renderFixturesSection();
			this.renderFixturesTable();
			this.listenTo( app.currentLeague.fixturesCollection, 'add remove reset', this.renderFixturesTable );
		},

		events: {
			"click #new-round"    : "addRound",
			"click #remove-round" : "removeRound",
		},

		renderFixturesSection : function() {
			variables = { currentRoute: 'league/' + app.currentLeague.get('id') };
			this.$el.html( this.template( variables ) );
			return this;
		},

		renderFixturesTable : function() {
			var el = $("#league-fixtures-table tbody");
			el.children().remove();
			app.currentLeague.fixturesCollection.each( function( game ) {
				var view = new LeagueFixtureRowView( {model:game} );
				el.append( view.render().el );
			}, this );
			return this;
		},

		addRound : function() {
			app.currentLeague.set( { rounds : parseInt( app.currentLeague.get('rounds') ) + 1 } );
			app.currentLeague.save();
		},

		removeRound : function() {
			if ( app.currentLeague.get('rounds') > 1 ) {
				app.currentLeague.set( { rounds : parseInt( app.currentLeague.get('rounds') ) - 1 } );
				app.currentLeague.save();
			}
		},

	});

	var LeagueNewResultView = Backbone.View.extend({

		template : _.template($('#league-form-new-result').html() ),

		initialize : function() {
			$('#league-nav .link-league-new-result').parent().addClass('active');
			this.render();
			this.populateForm();

			// Set the saved selection state.
			if ( typeof( app.currentNewResultSelection ) !== 'undefined' ) {
				if ( app.currentNewResultSelection[0] !== 0 )
					$('#new-result-player-1').val( app.currentNewResultSelection[0] );
				if ( app.currentNewResultSelection[1] !== 0 )
					$('#new-result-player-2').val( app.currentNewResultSelection[1] );
			}

		},

		events: {
			"submit #new-result" : "createResult",
			"change #new-result-player-1" : "saveSelection",
			"change #new-result-player-2" : "saveSelection",
		},

		render : function() {
			this.$el.html( this.template() );
			return this;
		},

		saveSelection : function(e) {
			if ( typeof( app.currentNewResultSelection ) === 'undefined' )
				app.currentNewResultSelection = [0,0];
			var i = ( $(e.target).attr('id') === 'new-result-player-1' ) ? 0 : 1;
			app.currentNewResultSelection[i] = $(e.target).val();
		},

		createResult : function(e) {

			e.preventDefault();

			var el = $("#new-result");
			var gameData = {
				player1 : el.find('#new-result-player-1').val(),
				player2 : el.find('#new-result-player-2').val(),
				player1Score : parseFloat( el.find('#new-result-player-1-score').val() ),
				player2Score : parseFloat( el.find('#new-result-player-2-score').val() ),
				league : app.currentLeague.get('id'),
				timestamp : parseInt( new Number( new Date().getTime() ) / 1000 )
			};

			var game = new Game( gameData );

			var validationOutput = el.find('#new-result-validation-message');
			validationOutput.children().remove();

			if ( ! game.formValidate() ) {
				for ( var i = 0; i < game.validationMessages.length; i++ )
					validationOutput.append( $('<p class="info error">' + game.validationMessages[i] + '</p>') );
				return;
			}

			game.save();
			app.currentLeague.resultsCollection.add( game ).sort();

			game.updatePlayerPoints();

			app.routers.app.navigate( '/league/' + app.currentLeague.get('id'), true );

		},

		populateForm : function() {
			var el = $("#new-result");
			el.find( 'select option' ).remove();
			app.currentLeague.usersCollection.each( function( user ) {
				el.find( 'select' ).append( $('<option value="' + user.get('id') + '">' + user.get('name') + '</option>' ) );
			} );

		}



	});

	var LeagueSettingsView = Backbone.View.extend({

		template       : _.template( $('#league-settings-template').html() ),

		initialize : function() {

			this.$el.html( this.template() );

			this.renderPlayerList();
			this.listenTo( app.currentLeague.usersCollection, 'add remove reset', this.renderPlayerList );

		},

		events : {
			'submit #form-new-player' : 'createNewPlayer',
			'click #settings-player-list li' : 'editPlayer'
		},

		editPlayer : function(e) {
			var userID = $(e.target).attr('data-user-id')
			app.routers.app.navigate( '/league/' + app.currentLeague.get('id') + '/user/' + userID, true );
		},

		createNewPlayer : function(e) {

			e.preventDefault();

			var newName = this.$el.find( '#new-player-name' ).val();

			if ( newName == '' )
				return;

			var newUser = new User({
				name:newName,
				league:app.currentLeague.get('id')}
			);
			// Save. Only add to usersCollection on success.
			newUser.save({},{
				success: function() {
					app.currentLeague.usersCollection.add(newUser);
					app.routers.app.navigate( '/league/' + app.currentLeague.get('id'), true );
				}
			});

		},

		renderPlayerList : function() {
			var el = $('#settings-player-list');
			el.children().remove();
			app.currentLeague.usersCollection.each(function(user){
				el.append( $('<li data-user-id="' + user.get('id') + '"><a href="' + '/#/league/' + app.currentLeague.get('id') + '/user/' + user.get('id')  + '">' + user.get('name') + '<span class="chevron"></span></a></li>' ) );
			});

		}

	});

	var LeagueUserSettingsView = Backbone.View.extend({

		template       : _.template( $('#league-user-settings-template').html() ),

		initialize : function() {
			this.render();
			this.listenTo( app.currentLeague.usersCollection, 'reset', this.render );
		},

		events : {
			'click #update-player' : 'savePlayer',
			'click #remove-player' : 'removePlayer'
		},

		render : function() {

			var userID = this.options.userID;
			var user = app.currentLeague.usersCollection.get(userID)

			if ( typeof(user) === 'undefined' )
				return;

			var variables = { name: user.get('name') };
			this.$el.html( this.template( variables ) );

		},

		savePlayer : function(e) {
			e.preventDefault();
			var user = app.currentLeague.usersCollection.get(this.options.userID),
			    newName = this.$el.find( '#edit-player-name' ).val();
			if ( newName !== user.get('name')) {
				user.set('name', newName );
				user.save({}, {
					success: function(){ $('#edit-user-validation-message').html('<p class="info success">Saved Successfully</p>'); }
				});
			}
		},

		removePlayer : function(e) {
			e.preventDefault();

			if ( ! confirm('Are you sure?') )
				return;

			var userID = this.options.userID;
			var user = app.currentLeague.usersCollection.get(userID);

			user.deleteUser();

			app.routers.app.navigate( '/league/' + app.currentLeague.get('id') , true );

		}

	});

	var LeagueView = Backbone.View.extend({

		template       : _.template( $('#league-template').html() ),

		initialize : function() {

			this.$el.html( this.template( ) );

			this.renderTitle();
			this.listenTo( app.currentLeague, 'change', this.renderTitle );

			this.renderFooter();
			this.listenTo( app.currentLeague.resultsCollection, 'add remove reset', this.renderFooter );
			this.listenTo( app.currentLeague.usersCollection, 'add remove reset', this.renderFooter );


		},

		events: {
			"click .link-home"     : "leagueNav",
			"click .link-settings" : "leagueSettings",
			"click .link-new-result" : "leagueNavNewResult",
			"click #league-nav a"  : "leagueNav"
		},

		renderFooter : function() {

			var el       = $('#league-footer'),
				template = _.template( $('#league-footer-template').html() ),
				variables = {};

			el.html('');

			if ( app.currentLeague.usersCollection.length === 0 )
				return;

			variables.gamesPerRound = ( app.currentLeague.usersCollection.length * app.currentLeague.usersCollection.length - app.currentLeague.usersCollection.length ) / 2;
			variables.totalGames = variables.gamesPerRound * app.currentLeague.get('rounds');
			variables.gamesRemaining = variables.totalGames - app.currentLeague.resultsCollection.length;

			// console.log( 'Total Games: ' + variables.totalGames + ' (' + variables.gamesPerRound + ' per round)');
			// console.log( 'Games Played: ' + app.currentLeague.resultsCollection.length + ' (' + variables.gamesRemaining + ' remaining)');


		},

		leagueNavNewResult : function() {
			app.routers.app.navigate( '/league/' + app.currentLeague.get('id') + '/new-result', true );
		},

		leagueSettings : function() {
			app.routers.app.navigate( '/league/' + app.currentLeague.get('id') + '/settings', true );
		},

		leagueNav : function(e) {

			e.preventDefault();
			var route = $(e.target).attr('class')
			    id = app.currentLeague.get('id');

			switch(route) {
				case 'link-league-standings':
					app.routers.app.navigate( 'league/' + id , true );
					break;
				case 'link-league-results':
					app.routers.app.navigate( '/league/' + id + '/results', true );
					break;
				case 'link-league-fixtures':
					app.routers.app.navigate( '/league/' + id + '/fixtures', true );
					break;
				case 'link-league-new-result':
					app.routers.app.navigate( '/league/' + id + '/new-result', true );
					break;
				default:
					app.routers.app.navigate( '', true );
			}

		},

		renderTitle : function() {
			var el   = $("#league-title");
			el.html( app.currentLeague.get('name') );
		},

	});

	var LeaguesListItemView = Backbone.View.extend({

		tagName  :  "li",
		template : _.template( $('#league-list-item-template').html() ),

		render: function() {
			variables = { name: this.model.get('name'), target: '/#/league/' + this.model.get('id') };
			this.$el.html( this.template( variables ) );
			return this;
		},
	});

	var HomeView = Backbone.View.extend({

		template : _.template( $('#home-template').html() ),

		initialize: function() {
			this.$el.html( this.template() );
			this.renderLeagueList();
			this.listenTo( app.leagues, 'all', this.renderLeagueList );
		},

		renderLeagueList : function() {
			var leagueList = $("#leagues ul" );
			leagueList.children().remove();
			app.leagues.each( function( league ) {
				var view = new LeaguesListItemView({model:league});
				leagueList.append( view.render().el );
			} );
		}

	});

	// Router
	var AppRouter = Backbone.Router.extend({

		routes:{
			"":"leagueList",
			"league/:id":"leagueView",
			"league/:id/results": "leagueResultsView",
			"league/:id/fixtures": "leagueFixturesView",
			"league/:id/new-result": "leagueNewResultView",
			"league/:id/settings": "leagueSettings",
			"league/:id/user/:userID": "leagueUserSettings",
		},

		appContainer: $('#app-container'),

		initialize : function() {

			app.leagues = new LeagueCollection();
			app.leagues.fetch({async:false});

			console.log( 'sync leauges' );
			console.log( app.leagues.toJSON() );
			
		},
		leagueList : function () {
			app.views.home = new HomeView({el:this.appContainer});
		},
		leagueView : function (id) {
			app.currentLeague    = app.leagues.get(id);
			app.currentLeague.updateGames();
			app.views.league     = new LeagueView({el:this.appContainer});
			starlingHelper.destroyView(app.views.leagueView);
			app.views.leagueView = new StandingsView({el:$('#league-view')});
		},
		leagueResultsView : function(id) {
			app.currentLeague    = app.leagues.get(id);
			app.currentLeague.updateGames();
			app.views.league     = new LeagueView({el:this.appContainer});
			starlingHelper.destroyView(app.views.leagueView);
			app.views.leagueView = new LeagueResultsView({el:$('#league-view')});
		},
		leagueFixturesView : function(id) {
			app.currentLeague    = app.leagues.get(id);
			app.currentLeague.updateGames();
			app.views.league     = new LeagueView({el:this.appContainer});
			starlingHelper.destroyView(app.views.leagueView);
			app.views.leagueView = new LeagueFixturesView({el:$('#league-view')});
		},
		leagueNewResultView : function(id) {
			app.currentLeague    = app.leagues.get(id);
			app.currentLeague.updateGames();
			app.views.league     = new LeagueView({el:this.appContainer});
			starlingHelper.destroyView(app.views.leagueView);
			app.views.leagueView = new LeagueNewResultView({el:$('#league-view')});
		},
		leagueSettings : function(id) {
			app.currentLeague    = app.leagues.get(id);
			app.currentLeague.updateGames();
			app.views.league     = new LeagueView({el:this.appContainer});
			starlingHelper.destroyView(app.views.leagueView);
			app.views.leagueView = new LeagueSettingsView({el:$('#league-view')});
		},
		leagueUserSettings : function(id, userID) {
			app.currentLeague    = app.leagues.get(id);
			app.currentLeague.updateGames();
			app.views.league     = new LeagueView({el:this.appContainer});
			starlingHelper.destroyView(app.views.leagueView);
			app.views.leagueView = new LeagueUserSettingsView({el:$('#league-view'),userID:userID});
		},

	});

	app.routers.app = new AppRouter();
	Backbone.history.start();

});