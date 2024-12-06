on run
	display dialog "Script is running..."
end run

on idle
	display notification "Still alive!" with title "Stay-Open Script"
	return 60 -- Run idle handler every 60 seconds
end idle