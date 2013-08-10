<!doctype html>
<!--[if lt IE 9]><html class="no-js oldie" lang="en"><![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js" lang="en"><!--<![endif]-->
<head>

	<!-- no-js or js class to help prevent FOUC -->
	<script type="text/javascript">(function(H){H.className=H.className.replace(/\bno-js\b/,'js')})(document.documentElement)</script>

	<meta charset="utf-8">

	<title>Matthew's Tabs</title>

	<meta name="viewport" content="width=device-width">

    <link href="assets/type.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="assets/theme.css" media="screen" rel="stylesheet" type="text/css" />

</head>

<body>

	<?php

	require ('league-standings.php');
	require ('league-results.php');
	require ('league-fixtures.php');
	require ('new-result.php');
	require ('new-player.php');

	?>



	<script src="assets/libs/jquery.js"></script>

	<script src="assets/functions.js"></script>
	<script src="assets/league.js"></script>

</body>
</html>