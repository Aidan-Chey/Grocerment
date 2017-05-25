<?php
function is_timestamp ($timestamp) {
	return ((string) (int) $timestamp === $timestamp)
		&& ($timestamp <= PHP_INT_MAX)
		&& ($timestamp >= ~PHP_INT_MAX);
}