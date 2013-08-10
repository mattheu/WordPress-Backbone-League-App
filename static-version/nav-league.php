<?php

$page = isset( $_GET['p'] ) ? $_GET['p'] : 'home';

?>

<div class="nav-wrap">
	<div class="bar-standard bar-header-secondary">
		<a href="/?p=league-new-result" class="button-block">New Result</a>
	</div>
</div>

<ul class="segmented-controller">
	<li <?php if ( 'league-standings' == $page ) echo 'class="active"'; ?>>
		<a href="/?p=league-standings" data-transition="fade">Standings</a>
	</li>
	<li <?php if ( 'league-results' == $page ) echo 'class="active"'; ?>>
		<a href="/?p=league-results" data-transition="fade">Results</a>
	</li>
	<li <?php if ( 'league-fixtures' == $page ) echo 'class="active"'; ?>>
		<a href="/?p=league-fixtures" data-transition="fade">Fixtures</a>
	</li>
</ul>