<?php

function Streams_subscription2_response_content () {
	Q_Response::addScript("plugins/Streams/js/Streams.js");
	Q_Response::addScript("plugins/Streams/js/tools/subscription2.js");

	return Q::tool('Streams/subscription2', compact('publisherId', 'streamName'));
}