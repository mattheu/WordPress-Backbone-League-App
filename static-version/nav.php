<?php

$page = isset( $_GET['p'] ) ? $_GET['p'] : 'home';

switch ( $page ) {

	case 'league-standings' :
	case 'league-results' :
	case 'fixtures-results' :

		?>

		<header class="bar-title">
			<a class="button-prev" href="http://cardinal.dev" data-transition="slide-out">Home</a>
			<h1 class="title">My League App</h1>
		</header>

		<?php

	break;

	case 'league-new-result' :

		?>

		<header class="bar-title">
			<a class="button-prev button-back" data-ignore="push" href="javascript:history.go(-1)">Back</a>
			<h1 class="title">My League App</h1>
		</header>

		<?php

	break;


	default :

		?>

		<header class="bar-title">
			<h1 class="title">My League App</h1>
		</header>

		<?php

	break;

}