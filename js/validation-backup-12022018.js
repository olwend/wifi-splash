$( function emailHandler(){
    // DOM references
    var $email      = $( '#email-input' );
    var $firstname       = $( '#firstname'  );
    var $lastname       = $( '#lastname'  );
    var $form       = $email.closest( 'form' );
    var $submit     = $( '#email-button' );
    // var $feedback   = $( 'form .feedback' );
    var $feedback   = $( 'form .wifi--form-error' );
    var $ajaxFeedbackMessage = "";
    // Validation factors
    var value       = void 0; // Don't read in first instance: validation short-circuits if value hasn't changed
    var emailPlaceholder = $email.attr( 'placeholder' );
    var firstNamePlaceholder = $firstname.attr( 'placeholder' );
    var lastNamePlaceholder = $lastname.attr( 'placeholder' );
    
    // set properties for validation of Email Address field
    var emailValidation  = {
        done    : false,
        error   : false,
        ever    : false,
        message : '',
        pattern : /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/i,
        pending : false,
        valid   : false
    };

    // set properties for validation of First Name field
    var firstNameValidation  = {
        done    : false,
        error   : false,
        ever    : false,
        message : '',
        pattern : /[A-Za-z]/i,
        pending : false,
        valid   : false
    };

    // set properties for validation of Last Name field
    var lastNameValidation  = {
        done    : false,
        error   : false,
        ever    : false,
        message : '',
        pattern : /[A-Za-z]/i,
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
    function validate() {
        validateFirstName();
        validateLastName();
        validateEmail();
    }

    // function to validate First Name field
    function validateFirstName(){
        var presentValue = $firstname.val();

        if( presentValue === firstNamePlaceholder || presentValue === '' || !firstNameValidation.pattern.test( presentValue ) ){
            firstNameValidation.message = 'Please enter your first name.';
            firstNameValidation.valid   = false;
        }
        else {
            firstNameValidation.message = '';
            firstNameValidation.valid   = true;
        }

        firstNameValidation.ever = true;

        clearFeedback();
    }

    // function to validate Last Name field
    function validateLastName(){
        var presentValue = $lastname.val();

        if( presentValue === lastNamePlaceholder || presentValue === '' || !lastNameValidation.pattern.test( presentValue ) ){
            lastNameValidation.message = 'Please enter your last name.';
            lastNameValidation.valid   = false;
        }
        else {
            lastNameValidation.message = '';
            lastNameValidation.valid   = true;
        }

        lastNameValidation.ever = true;

        clearFeedback();
    }

    // function to validate Email Address field
    function validateEmail(){
        var presentValue = $email.val();

        if( presentValue === emailPlaceholder || presentValue === '' || !emailValidation.pattern.test( presentValue ) ){
            emailValidation.message = 'Please enter your email address.';
            emailValidation.valid   = false;
        }
        else {
            emailValidation.message = '';
            emailValidation.valid   = true;
        }

        emailValidation.ever = true;

        clearFeedback();
    }

    // Capture would-be submit events and either
    // block, submit or feedback
    function presubmit( inputEvent ){
        if( inputEvent instanceof $.Event ){
            inputEvent.preventDefault();
        }

        validate();

        if( emailValidation.pending){
            return;
        }
        else if( emailValidation.valid && firstNameValidation.valid && lastNameValidation.valid){
			console.log('email and first name and last name validated');
			return submit();
        }
        else {
			return feedback();
        }
    }

    // AJAX for server response, triggering failure or success and ending in feedback
    function submit(){
        $form.addClass( 'pending' );
        $feedback.removeClass('show');

        // Create an XHR base on form attributes
        $.ajax( {
            cache : false,
            url   : $form.attr( 'action' ),
            data  : $form.serialize(),
            type  : $form.attr( 'method' ).toUpperCase()
        } )
            .done( success )
            .fail( failure )
            .always( ajaxFeedback );
    }

    // Parse server success messaging
    // Modifies internal flags
    function success( response ){
        ajaxFeedbackMessage = response.message;
        $validFirstName = firstNameValidation.valid;
        $validLastName = lastNameValidation.valid;

           window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'formSubmissionSuccess',
            formId: 'enewsForm'
             });

        //only GA event if email was a signup - event was on email validation before - dhis 07/05/2014
        if($validFirstName && $validLastName) {
			//recordSplashPageEvent('Email sign-up');
		}
    }

    // Respond to server error
    // Modifies internal flags
    function failure(){
        emailValidation.message = 'Sorry, we can\'t sign you up at moment.';
        emailValidation.error   = true;
    }

    
    function ajaxFeedback(){
        $feedback.html(ajaxFeedbackMessage).addClass('success show');
    }
    // Present internal feedback data to the user
    function feedback(){
        clearFeedback();

       var errorHtml ="";
       if(firstNameValidation.message) {
       	   errorHtml = errorHtml + firstNameValidation.message + '<br/>';
       }
       if(lastNameValidation.message) {
       	   errorHtml = errorHtml + lastNameValidation.message + '<br/>';
       }
          if(emailValidation.message) {
       	   errorHtml = errorHtml + emailValidation.message + '<br/>';
       }

        $feedback.html( errorHtml ).addClass('error show').removeClass('success');

        // check each field on form submission and apply CSS classes to DOM accordingly
        if ( !emailValidation.valid || emailValidation.error ) {
            $form.addClass( 'invalid' );
            $email.trigger( 'focus' );
        } else if (!firstNameValidation.valid || firstNameValidation.error) {
            $form.addClass( 'invalid' );
            $firstname.trigger( 'focus' );
        } else if (!lastNameValidation.valid || lastNameValidation.error) {
            $form.addClass( 'invalid' );
            $lastname.trigger( 'focus' );
        } else {
            $form.addClass( 'done' );
            emailValidation.done = true;
            firstNameValidation.done = true;
            lastNameValidation.done = true;
        }

        emailValidation.pending = false;
        firstNameValidation.pending = false;
        lastNameValidation.pending = false;
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