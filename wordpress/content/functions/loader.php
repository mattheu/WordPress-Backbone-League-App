<?php

include_once( ABSPATH . 'wp-admin/includes/plugin.php' );

$loaded_plugins = array();

foreach ( get_plugins( '/../functions' ) as $plugin_path => $plugin ) {
	include_once( WPMU_PLUGIN_DIR . '/' . $plugin_path );

	if ( $plugin['Name'] !== 'MU Plugins Loader' )
		$loaded_plugins[] = $plugin['Name'];
}

if ( file_exists( 'tlc-transients/tlc-transients.php' ) ) {
	$loaded_plugins[] = 'TLC Transients';
	include_once( 'tlc-transients/tlc-transients.php' );
}

if ( file_exists( WPMU_PLUGIN_DIR . '/custom-meta-boxes/custom-meta-boxes.php' ) ) {
	$loaded_plugins[] = 'Custom Meta Boxes';
	include_once( 'custom-meta-boxes/custom-meta-boxes.php' );
}

/*
Plugin Name: MU Plugins Loader
Description: Loaded the below plugins
Author: Human Made Limited
Version: 0.2
Author URI: http://humanmade.co.uk/
*/

add_filter( 'plugin_row_meta', function( $plugin_meta, $plugin_file, $plugin_data, $status ) use ( $loaded_plugins ) {

	var_dump( $plugin_file );

	if ( $plugin_file !== 'loader.php' )
		return $plugin_meta;

	return $loaded_plugins;
}, 10, 4 );