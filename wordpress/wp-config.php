<?php

/**
 * The base configurations of the WordPress.
 *
 * This file has the following configurations: MySQL settings, Table Prefix,
 * Secret Keys, WordPress Language, and ABSPATH. You can find more information
 * by visiting {@link http://codex.wordpress.org/Editing_wp-config.php Editing
 * wp-config.php} Codex page. You can get the MySQL settings from your web host.
 *
 * This file is used by the wp-config.php creation script during the
 * installation. You don't have to use the web site, you can just copy this file
 * to "wp-config.php" and fill in the values.
 *
 * @package WordPress
 */

/**
 * Don't edit this file directly, instead, create a local-config.php file and add your database
 * settings and defines in there. This file contains the production settings
 */
if ( file_exists( dirname( __FILE__ ) . '/wp-config-local.php' ) )
	include( dirname( __FILE__ ) . '/wp-config-local.php' );
else
	die( 'no wp-config-local.php' );

/**
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         '(R+na-h6|@$/+ziRIB+y*5D!-U2}.(*9aqO[IC5.~m.GJ/rL:US0*%.PENJE-r_g');
define('SECURE_AUTH_KEY',  'UO=K!mOwCqm1xNSgqW~|p&ncC-C-R C[~1s 728Kp`4C7jhVxh/^KE3Xo@#p3HXx');
define('LOGGED_IN_KEY',    ';6JS9%NF}>,~ZS>[O?R.n17--+q&GF(5I+/1ZwQ(k<Qxx6-:%vJZ-6B6h<K=8^><');
define('NONCE_KEY',        '3e[s]f>:Fb|NM2d:BoWHjE;qIy>ZUoRcRn6E)i`C{>)pZ2]{lo-%,hC%PQ|)2*a1');
define('AUTH_SALT',        '-Vfp_HN+1zSdz1+bA]+j9[3jm|LejaM,)Yz*3 q#4Plzy[VE/C%f6{KjUxxlzky7');
define('SECURE_AUTH_SALT', 'd94<7(r2;^#;`F72*0A,bk=:ySk|sA.=8K]6{_d0FP_T<|xvM[@2_$q#lt~O13E!');
define('LOGGED_IN_SALT',   'qH#-MS9FrBCz6i/|m@B05Y-!UG=#3~KxhF)4U^7olav@Qm[`~Y|95;dIEnfjhU)M');
define('NONCE_SALT',       '6>oE6sdPqfy`gr|C@w}F-&o126(|;}BzE_|ARJKH>B[Qeliqt~`e3o`{-mQ=idTw');

$table_prefix  = 'mph_league_';
define( 'WPLANG', '' );

if ( defined( 'HM_DEV' ) && HM_DEV ) {
	define( 'WP_DEBUG', true );
	define( 'WP_DEBUG_DISPLAY', false );
} else {
	define( 'WP_DEBUG', false );
}

define( 'WP_CONTENT_DIR', dirname( __FILE__ ) . '/content' );
define( 'WP_CONTENT_URL', WP_HOME . '/content' );

// Set path to MU Plugins.
define( 'WPMU_PLUGIN_DIR', dirname( __FILE__ ) . '/content/functions' );
define( 'WPMU_PLUGIN_URL', WP_HOME . '/content/functions' );

define( 'WP_DEFAULT_THEME', 'twentytwelve' );

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) )
	define( 'ABSPATH', dirname(__FILE__) . '/' );

/** Sets up WordPress vars and included files. */
require_once( ABSPATH . 'wp-settings.php' );