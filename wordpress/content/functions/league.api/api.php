<?php

/*
Plugin Name: League Rewrites
Version: 0.1
Author: Mattheu
Author URI: http://matth.eu/
*/

add_action( 'init', function() {

	if ( ! function_exists( 'hm_add_rewrite_rule' ) )
		return;

	hm_add_rewrite_rule( array(
		'regex' => '^api/game/?(([\d]*))?/?$',
		'query' => 'game_id=$matches[1]',
		'request_callback' => function( WP $wp ) {

			$id = $wp->query_vars['game_id'];
			if ( $id && 0 === strpos( $id, '/' ) )
				$id = substr( $id, 0, 1);

			$body = file_get_contents("php://input");

			header('Content-type: application/json');

			switch ( strtolower( $_SERVER['REQUEST_METHOD'] ) ) {

				case 'get' :

					if ( empty( $id ) )
						exit;

					$game = new Game( $id );
					echo json_encode( $game->get_attributes() );

					break;

				case 'put' :

					if ( empty( $id ) )
						exit;

					$game = new Game( $id );
					$game->set_attributes( (array) json_decode( $body ) );
					$game->update();
					echo json_encode( $game->get_attributes() );

					break;

				case 'post' :

					$game = new Game();
					$game->set_attributes( (array) json_decode( $body ) );
					$game->update();
					echo json_encode( $game->get_attributes() );

					break;

				case 'delete' :

					if ( empty( $id ) )
						exit;

					$game = new Game( $id );
					$game->trash();

			}

			exit;
		}
	) );

	hm_add_rewrite_rule( array(
		'regex' => '^api/league/?([\d]*)?/?$',
		'query' => 'league_id=$matches[1]',
		'request_callback' => function( WP $wp ) {

			header('Content-type: application/json');

			switch ( strtolower( $_SERVER['REQUEST_METHOD'] ) ) {

				case 'get' :

					$id = $wp->query_vars['league_id'];
					if ( empty( $id ) )
						exit;

					$league = new League( $id );
					$league->fetch_games();
					$league->fetch_players();

					$r = $league->get_attributes();

					if ( empty( $r['games'] ) )
						$r['games'] = array();

					echo json_encode( $r );

					break;

				case 'put' :

					$id = $wp->query_vars['league_id'];
					if ( empty( $id ) )
						exit;

					$league = new League( $id );
					$league->set_attributes( (array) json_decode( file_get_contents("php://input") ) );
					$league->update();
					echo json_encode( $league->get_attributes() );

					break;

				case 'post' :

					$league = new League( null );
					$league->set_attributes( (array) json_decode( file_get_contents("php://input") ) );
					$league->update();
					echo json_encode( $league->get_attributes() );

					break;

			}

			exit;
		}

	) );


	hm_add_rewrite_rule( array(
		'regex' => '^api/user/?([\d]*)?/?$',
		'query' => 'user_id=$matches[1]',
		'request_callback' => function( WP $wp ) {

			header('Content-type: application/json');

			switch ( strtolower( $_SERVER['REQUEST_METHOD'] ) ) {

				case 'get' :

					$id = $wp->query_vars['user_id'];
					if ( empty( $id ) )
						exit;

					$user = new Player( $id );
					echo json_encode( $user->get_attributes() );

					break;

				case 'put' :

					$id = $wp->query_vars['user_id'];
					if ( empty( $id ) )
						exit;

					$user = new Player( $id );
					$user->set_attributes( (array) json_decode( file_get_contents("php://input") ) );
					error_log(print_r($user->get_attributes(), true ) );
					$user->update();
					echo json_encode( $user->get_attributes() );

					break;

				case 'post' :

					$user = new Player( null );
					$user->set_attributes( (array) json_decode( file_get_contents("php://input") ) );
					$user->update();
					echo json_encode( $user->get_attributes() );

					break;

				case 'delete' :

					$id = $wp->query_vars['user_id'];
					if ( empty( $id ) )
						exit;

					$player = new Player( $id );
					$player->trash();

			}

			exit;
		}

	) );


	hm_add_rewrite_rule( array(
		'regex' => '^api/leagues/?$',
		'query' => '',
		'request_callback' => function( WP $wp ) {

			header('Content-type: application/json');

			switch ( strtolower( $_SERVER['REQUEST_METHOD'] ) ) {

				case 'get' :

					$terms = get_terms( 'league', array('hide_empty' => false ) );
					$leagues = array();

					foreach ( $terms as $term ) {

						$league = new League($term->term_id);
						$leagues[] = $league->get_attributes();

					}

					echo json_encode( $leagues );

					break;

			}

			exit;
		}

	) );


} );