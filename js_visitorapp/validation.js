$( function emailHandler(){
    // DOM references
    var $email      = $( '#email-input' );
    var $form       = $email.closest( 'form' );
    var $submit     = $( '#email-button' );
    var $feedback   = $( 'form .feedback' );
    // Validation factors
    var value       = void 0; // Don't read in first instance: validation short-circuits if value hasn't changed
    var placeholder = $email.attr( 'placeholder' );
    // Validation state
    var validation  = {
        done    : false,
        error   : false,
        ever    : false,
        message : '',
        pattern : /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/i,
        pending : false,
        valid   : false
    };

    // jQuery plugins
    $.extend( {
        // Executes a function once the stack has cleared.
        // Useful on synchronous user input events whose outcomes will have resolved
        // ( but can no longer be prevented )
        async    : function async( fn ){
            return function defer(){
                var context    = this;
                var parameters = $.makeArray( arguments );

                setTimeout( function resolve(){
                    fn.apply( context, parameters );
                } );
            }
        },
        // Returns a wrapper which prevents default of any passed events, then executes passed function
        prevent  : function prevent( fn ){
            return function( event ){
                if( event instanceof $.Event ){
                    event.preventDefault();
                }

                return fn.apply( this, $.makeArray( arguments ) )
            }
        },
        // Limits the passed function's execution to once every <delay> milliseconds
        throttle : function throttle( delay, fn ){
            var throttled = false;

            return function throttler(){
                if( throttled ){
                    return;
                }

                fn.apply( this, $.makeArray( arguments ) );

                throttled = true;

                setTimeout( function unthrottle(){
                    throttled = false;
                }, delay );
            }
        }
    } );

    // Handle equivalent modern and legacy events without duplicates
    // https://gist.github.com/barneycarroll/8477229
    $.fn.anon = function anon( eventsArray ){
        var context    = this;
        var parameters = $.makeArray( arguments ).slice( 1 );

        if( !$.isArray( eventsArray ) ){
            return $.fn.on.apply( context, arguments );
        }

        eventsArray = eventsArray.reverse();

        $.each( eventsArray, function bindAllHandlers( index, eventsString ){
            var params = {
                listener : [ eventsString ].concat( parameters )
            };
            var unbind;

            $.fn.on.apply( context, params.listener );

            if( index + 1 == eventsArray.length ){
                params.modern = params.listener.slice( 0, params.listener.length - 1 ).concat( function unbindLegacyEvents(){
                    $.fn.off.apply( context, params.legacy );
                } );
                params.legacy = [ eventsArray.slice( 0, index ).join( ' ' ) ].concat( params.listener.slice( -1 ) );

                $.fn.one.apply( context, params.modern );
            }
        } );

        return context;
    };

    // Capture user input on the form and filter accordingly.
    // Hands over to presubmit or validate
    function filterInput( inputEvent ){
        if( inputEvent && inputEvent.which === '13' ){
            return presubmit( inputEvent );
        }

        return validate();
    }

    // Core front-end validation logic.
    // Changes internal flags and clears previous messaging.
    // Doesn't hand over - can be invoked outside of prescribed sequence
    function validate(){
        var presentValue = $email.val();

        if( presentValue === placeholder || presentValue === '' || !validation.pattern.test( presentValue ) ){
            validation.message = 'Please enter a valid email address.';
            validation.valid   = false;
        }
        else {
            validation.message = '';
            validation.valid   = true;
        }

        validation.ever = true;

        clearFeedback();
    }

    // Capture would-be submit events and either
    // block, submit or feedback
    function presubmit( inputEvent ){
        if( inputEvent instanceof $.Event ){
            inputEvent.preventDefault();
        }

        validate();

        if( validation.pending ){
            return;
        }
        else if( validation.valid ){
			console.log('email validated');
			//recordSplashPageEvent('Email sign-up');
			return submit();
        }
        else {
			return feedback();
        }
    }

    // AJAX for server response, triggering failure or success and ending in feedback
    function submit(){
        $form.addClass( 'pending' );

        // Create an XHR base on form attributes
        $.ajax( {
            cache : false,
            url   : $form.attr( 'action' ),
            data  : $form.serialize(),
            type  : $form.attr( 'method' ).toUpperCase()
        } )
            .done( success )
            .fail( failure )
            .always( feedback );
    }

    // Parse server success messaging
    // Modifies internal flags
    function success( response ){
        validation.message = response.message;
        validation.valid   = response.valid;
         $valid = validation.valid;
        //only GA event if email was a signup - event was on email validation before - dhis 07/05/2014
         if($valid)
		          {
			      recordSplashPageEvent('Email sign-up');
		          }
    }

    // Respond to server error
    // Modifies internal flags
    function failure(){
        validation.message = 'Sorry, we can\'t sign you up at moment.';
        validation.error   = true;
    }

    // Present internal feedback data to the user
    function feedback(){
        clearFeedback();

        $feedback
            .html( validation.message );

        if( !validation.valid || validation.error ){
            $form.addClass( 'invalid' );

            $email.trigger( 'focus' );
        }
        else {
            $form.addClass( 'done' );

            validation.done = true;
        }

        validation.pending = false;
    }

    function clearFeedback(){
        $form.removeClass( 'invalid pending done' );
    }

    // Setup all user input listeners to initiate functional flow above
    void function bindEvents(){
        $email.placeholder().anon( [ 'input', 'change cut keyup paste' ], $.async( filterInput ) );

        $form.on( 'submit', presubmit );
    }();
} );