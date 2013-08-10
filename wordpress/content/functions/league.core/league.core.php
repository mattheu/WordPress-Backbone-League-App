<?php
/*
Plugin Name: League Core
Version: 0.1
Author: Mattheu
Author URI: http://matth.eu/
*/

add_action( 'after_setup_theme', function() {

	add_theme_support( 'term-meta' );

    register_post_type( 'game', array(
    	'public' => true,
    	'label' => 'Games'
    ) );

    register_post_type( 'player', array(
    	'public' => true,
    	'label' => 'Players'
    ) );

	register_taxonomy( 'league', array( 'game', 'player' ), array(
	    'hierarchical' => false,
	    'label' => 'Leagues',
	    'show_ui' => true
	  ));

} );

class Game {

	private $_game;
	private $id;
	private $author;
	private $player1;
	private $player2;
	private $player1Score;
	private $player2Score;
	private $timestamp;

	function __construct( $id = null ) {

		$this->id = $id;

		if ( $this->id )
			$this->fetch();

	}

	function fetch() {

		$this->_game = get_post( $this->id );

		if ( empty( $this->_game ) )
			throw new Exception( "Game not found" );

		$this->author = $this->_game->post_author;
		$this->timestamp = get_the_time( 'U', $this->id );

		$league = wp_get_post_terms( $this->id, 'league' );

		if ( ! empty( $league ) )
			$this->league = new League( reset( $league )->term_id );

		$this->player1      = get_post_meta( $this->id, 'starleague_game_player_1', true );
		$this->player2      = get_post_meta( $this->id, 'starleague_game_player_2', true );
		$this->player1Score = get_post_meta( $this->id, 'starleague_game_player_1_score', true );
		$this->player2Score = get_post_meta( $this->id, 'starleague_game_player_2_score', true );

	}

	function update() {

		$this->validate();

		if ( empty( $this->id ) ) {

			$this->id = wp_insert_post( array(
				'post_type' => 'game',
				'post_status' => 'publish',
				'author' => $this->author,
				'post_title' => $this->getWinner() ? sprintf( '%d : %d', $this->getWinner(), $this->getLooser() ) : sprintf( '%d : %d', $this->player1, $this->player2 )
			) );

		}

		wp_set_object_terms( $this->id, $this->league->get_slug(), 'league' );

		update_post_meta( $this->id, 'starleague_game_player_1', $this->player1 );
		update_post_meta( $this->id, 'starleague_game_player_2', $this->player2 );
		update_post_meta( $this->id, 'starleague_game_player_1_score', $this->player1Score );
		update_post_meta( $this->id, 'starleague_game_player_2_score', $this->player2Score );

	}

	function trash() {

		wp_trash_post( $this->id );

	}

	function validate() {

		// Is league owner the game author?

	}

	function set_attributes( $attrs ) {

		if ( isset( $attrs['id'] ) )
			$this->id = $attrs['id'];

		if ( isset( $attrs['author'] ) )
			$this->author = $attrs['author'];

		if ( isset( $attrs['player1'] ) )
			$this->player1 = $attrs['player1'];

		if ( isset( $attrs['player2'] ) )
			$this->player2 = $attrs['player2'];

		if ( isset( $attrs['player1Score'] ) )
			$this->player1Score = $attrs['player1Score'];

		if ( isset( $attrs['player2Score'] ) )
			$this->player2Score = $attrs['player2Score'];

		if ( isset( $attrs['timestamp'] ) )
			$this->timestamp = $attrs['timestamp'];

		if ( isset( $attrs['league'] ) )
			$this->league = $attrs['league'];

		if ( isset( $this->league ) && ! is_object( $this->league ) )
			$this->league = new League( is_object( $this->league ) ? $this->league->id : $this->league );

		return;

	}

	function get_attributes() {

		return array(
			'id' => $this->id,
			'author' => $this->author,
			'player1' => $this->player1,
			'player2' => $this->player2,
			'player1Score' => $this->player1Score,
			'player2Score' => $this->player2Score,
			'timestamp' => $this->timestamp,
			'league' => isset( $this->league ) ? $this->league->get_id() : null
		);

	}

	function getWinner() {
		if ( $this->player1Score > $this->player2Score )
			return $this->player1;
		elseif ( $this->player1Score < $this->player2Score )
			return $this->player2;
	}

	function getLooser() {
		if ( $this->player1Score > $this->player2Score )
			return $this->player2;
		elseif ( $this->player1Score < $this->player2Score )
			return $this->player1;
	}

}


class League {

	private $id;
	private $name;
	private $owner; // User ID. Only games belonging to this user are attached.
	private $games;
	private $players;
	private $_league;

	function __construct( $id = null ) {

		$this->id = $id;

		if ( $this->id )
			$this->fetch();

	}

	function fetch() {

		$league = get_term( $this->id, 'league' );

		if ( empty( $league ) )
			return;

		$this->set_id( $league->term_id );
		$this->set_name( $league->name );

		$this->owner = get_term_meta( $this->get_id(), 'league_owner', true );
		$this->rounds = get_term_meta( $this->get_id(), 'league_rounds', true );

		// Hacked because term meta isn't saving properly.
		$this->owner = 1;
		$this->rounds = 2;

		$this->_league = $league;

	}

	function update() {

		$this->validate();

		if ( $this->id ) {

			$league_id = wp_update_term( absint( $this->get_id() ), 'league', array(
				'name' => $this->get_name()
			) );


		} else {
			$league_id = wp_insert_term( $this->get_name(), 'league' );
			$this->_league = get_term( $league_id, 'league' );
		}

		update_term_meta( $this->get_id(), 'league_owner', $this->owner );
		update_term_meta( $this->get_id(), 'league_rounds', $this->rounds );

	}

	function validate() {

		if ( empty( $this->name ) )
			throw new Exception( "No league name set" );

		if ( empty( $this->owner ) )
			throw new Exception( "No league owner set" );

	}

	function set_name( $name ) {
		$this->name = $name;
	}

	function get_name() {
		return $this->name;
	}

	function set_id( $id ) {
		$this->id = $id;
	}

	function get_id() {
		return $this->id;
	}

	function get_slug() {
		return $this->_league->slug;
	}

	function set_attributes( $attrs ) {

		if ( isset( $attrs['id'] ) )
			$this->id = (int) $attrs['id'];

		if ( isset( $attrs['name'] ) )
			$this->name = (string) $attrs['name'];

		if ( isset( $attrs['owner'] ) )
			$this->owner = (string) $attrs['owner'];

		if ( isset( $attrs['rounds'] ) )
			$this->rounds = (string) $attrs['rounds'];

	}

	function get_attributes() {

		$r = array(
			'id' => $this->id,
			'name' => $this->get_name()
		);

		if ( $this->owner )
			$r['owner'] = $this->owner;

		if ( $this->games )
			$r['games'] = $this->games;

		if ( $this->players ) {
			$r['players'] = array();
			foreach( $this->players as $player )
				$r['players'][] = $player->get_attributes();
		}

		if ( isset( $this->rounds ) )
			$r['rounds'] = $this->rounds;

		return $r;

	}

	/**
	 * Gets games in this league.
	 *
	 * @param  int $user_id User ID.
	 * @return [type]          [description]
	 */
	function get_games() {

		if ( empty( $this->games ) )
			$this->fetch_games();

		return $this->games;

	}

	function fetch_games() {

		$this->validate();

		if ( empty( $this->owner ) )
			throw new Exception("League Owner has not been set.");

		$games_query = new WP_Query( array(
			'post_type' => 'game',
			'author'    => $this->owner,
			'tax_query' => array(
				array(
					'taxonomy' => 'league',
					'field' => 'id',
					'terms' => $this->get_id(),
					'operator' => 'IN'
				)
			),
			'showposts' => -1,
			'nopaging'  => 1,
		) );

		$this->games = array();

		while ( $games_query->have_posts() ) {

			$games_query->the_post();

			$game = new Game( get_the_id() );

			array_push( $this->games, $game->get_attributes() );

		}

		wp_reset_postdata();

		return $this->games;

	}

	function get_players() {

		if ( empty( $this->players ) )
			$this->fetch_players();

		return $this->players;

	}

	function fetch_players() {

		$this->validate();

		$player_query = new WP_Query( array(
			'post_type' => 'player',
			'author'    => $this->owner,
			'tax_query' => array(
				array(
					'taxonomy' => 'league',
					'field' => 'id',
					'terms' => $this->get_id(),
					'operator' => 'IN'
				)
			),
			'showposts' => -1,
			'nopaging'  => 1,
		) );

		$this->players = array();

		while ( $player_query->have_posts() ) {
			$player_query->the_post();
			array_push( $this->players, new Player( get_the_id() ) );
		}

		wp_reset_postdata();

		return $this->players;

	}

}

class Player {

	private $id;
	private $name;
	private $league_id;
	private $_player;
	// private $league_data = array(
	// 'points'   => 0,
	// 'played'   => 0,
	// 'won'      => 0,
	// 'lost'     => 0,
	// 'draw'     => 0,
	// 'scoreFor' => 0,
	// 'scoreAgainst' => 0,
	// 'diff'     => 0
	// );

	/**
	 * If an ID is passed when instantiating, fetch data for that user.
	 * @param [type] $id [description]
	 */
	function __construct( $id = null ) {
		$this->id = $id;
		if ( $this->id )
			$this->fetch();
	}

	//* Fetch data for current ID. Overwrites any existing data.
	function fetch() {

		$this->_player = get_post( $this->id );

		if ( empty( $this->_player ) )
			throw new Exception( "Game not found" );

		$this->name = $this->_player->post_title;
		$league = wp_get_post_terms( $this->id, 'league' );

		if ( ! empty( $league ) )
			$this->league = new League( reset( $league )->term_id );

	}

	function update() {

		$this->validate();

		if ( empty( $this->id ) ) {

			$this->id = wp_insert_post( array(
				'post_type' => 'player',
				'post_status' => 'publish',
				'author' => get_current_user_id(),
				'post_title' => $this->name
			) );

		}

		wp_set_object_terms( $this->id, $this->league->get_slug(), 'league' );

	}

	function validate() {

		if ( empty( $this->name ) )
			throw new Exception( "No player name set" );

		if ( empty( $this->league ) )
			throw new Exception( "No league set" );

	}

	function trash() {
		wp_trash_post( $this->id );
	}


	function set_attributes( $attrs ) {

		if ( isset( $attrs['id'] ) )
			$this->id = $attrs['id'];

		if ( isset( $attrs['name'] ) )
			$this->name = $attrs['name'];

		if ( isset( $attrs['league'] ) )
			$this->league = $attrs['league'];

		if ( isset( $this->league ) && ! is_object( $this->league ) )
			$this->league = new League( is_object( $this->league ) ? $this->league->id : $this->league );

		return;

	}

	function get_attributes() {

		return array(
			'id' => $this->id,
			'name' => $this->name,
			'league' => isset( $this->league ) ? $this->league->get_id() : null
		);

	}



}



add_action( 'init', function() {

	if ( ! is_admin() )
		return;

	// if ( defined( 'WP_INSTALLING' ) && WP_INSTALLING )
	// 	return;

	$test_league = get_term_by( 'name', 'test-league', 'league' );

	if ( ! $test_league ) {

		$league = new League();
		$league->set_attributes( array(
			'name'     => 'test-league',
			'owner'     => 1,
			'rounds'    => 2
		) );
		$league->update();

	}

	// printf( var_export( $league ) );

	// if ( )
	// // $userdata = array(
	// 	'name'      => 'Matt',
	// 	'league'    => $test_league->term_id,
	// );
	// $user = new Player();
	// $user->set_attributes($userdata);
	// $user->update();

	// $user->fetch();
	// hm( $user->get_attributes() );

	// // hm( $user->get_attributes() );


	// $league->fetch();
	// hm( $league->get_attributes() );

	// $gamedata = array(
	// 	'id'           => 112,
	// 	'player1'      => 2,
	// 	'player2'      => 1,
	// 	'player1Score' => 29,
	// 	'player2Score' => 21,
	// 	'league'       => new League( 2 )
	// );

	// $game = new Game( 112 );
	// //$game->saveGameData();
	// hm( $game->getGameData() );

}, 100 );