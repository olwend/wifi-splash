/*
 * ----------------------------------------------------------------------
 * Adapted generic event recorder - ite405 - Feb 2013
 * ----------------------------------------------------------------------
 */

function recordSplashPageEvent(action, destination) {

        var category = "WIFI-splash";
        var label    = "from " + window.location.pathname;
        var debug    = false;		/* debug for firefox only - NOT SAFE FOR LIVE */
        var error;

        lastAction = action;

        try {
            _gaq.push( [ '_trackEvent', category, action, label ] );
			if (destination){
				setTimeout('document.location = "' + destination + '"', 200);   //small delay to allow _gaq push to run before leaving page
			}

		}
        catch ( e ) {
            error = e;

            if (debug) {
                console.log('Analytics not loaded');
            }
        }
        finally {
            if ( debug ){
                if ( error ){
                    console.log( 'tracking failure:', error );
                }
                else {
                    console.log( 'Event sent: ' + action + ' ' + label );
                }
            }
        }
}
