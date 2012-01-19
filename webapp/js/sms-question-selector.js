var basetype = "";
var school_id;

$(document).ready(function() {
    //set all pages to display:none
    $("div[data-role='page']").hide();

    $('#testpagebutton').click(function() {
        load_page('#testpage');
    });
    //init_login();
    init_login_temp();
    select_survey_type();

});
function load_page(page) {
    $("div[data-role='page']").hide();
    $(page).fadeIn(500);
}

function init_login_temp() {
	$.ajax({
		type: 'GET',
  		url: base_url + '/xmlprovider/questions/school_id',
  		dataType: 'xml',
  		success: function(xml){
    		$(xml).find('xml').each(function(){
    			school_id = $(this).find('school_id').text();
    		});
  		}
	});	
}

function init_login() {
    //see if we are already logged in
    $.post(base_url + "/index.php/auth/login", {}, function(data) {
        error = $(data).find(".error");
        //alert(data);
        if(error.length == 0) {
            $('#login').fadeOut(500, function() {
                $('#typechoice').fadeIn(500);
            });
        } else {
            load_page('#login');
        }
    });
    //create login function
    $('form#form_login').submit(function(e) {
        e.preventDefault();
        var name = $("#login_name").attr('value');
        var password = $("#login_password").attr('value');
        $.post(base_url + "/index.php/auth/login", {
            login : name,
            password : password
        }, function(data) {
            error = $(data).find(".error");
            //alert(data);
            if(error.length == 0) {
                $('#login').fadeOut(500, function() {
                    $('#typechoice').fadeIn(500);
                });
            } else {
                $("#error").html(error[0].innerHTML + error[1].innerHTML);
            }
        });
        return false;
    });
}

function expand_all() {
	$( '<button id="expand" />' ).text( 'Toon' ).appendTo( '#list_controls' );
	
	$( '#expand' ).click( function() {
		( $( this ).text() === 'Toon' ) ? $( this ).text( 'Verberg' ) : $( this ).text( 'Toon' );
		( $( this ).text() === 'Toon' ) ? $( '.question_not_selected' ).addClass( 'hide' ) : $( '.question_not_selected' ).removeClass( 'hide' );
	});
}

function select_survey_type() {
	$('#typechoice').fadeIn(500);
	wireTypeChange();
}

function retrieve_questions_per_type( type ) {
	var questions = new Array();

	$.ajax({
		type: 'GET',
  		url: base_url + '/xmlprovider/questions/all_questions/' + type,
  		dataType: 'xml',
  		success: function(xml){
    		$(xml).find('item').each(function() {
    			
    			var li = '<li title="' + $(this).find('category_name').text() + '" class="ui-state-default hide question_not_selected drags" refid="' + $(this).find('question_id').text() + '" id="' + $(this).find('question_id').text() + '">' + $(this).find('question_description').text() + '</li>';
    			$(li).appendTo('#questions_container');
    		});
    		sort_on_category();
    		new_question();
    		expand_all();
  		}
	});
	
}

function wireTypeChange() {
	$('#select_type').change(function() {
		retrieve_questions_per_type( $(this).val() );
		$('#survey_type').remove();
	});
}

function create_drags( drag_selector, sortable_with ) {
	
	$( drag_selector ).draggable( {
		connectToSortable: sortable_with,
		helper: 'clone',
		revert: 'invalid',
		distance: 30,
		cursorAt: { 'right' : 0 }
	});
}

function create_sorts( ul ) {
	
	var el = ( ul ) ? ul : '.sorts';
	
	$( el ).sortable({
		items: "li:not(.category_list_name)",
		forcePlaceholderSize: true,
		dropOnEmpty: true,
		tolerance: 'pointer',
		update: function( event, ui ) {
			if ( $( this ).hasClass( 'sorts' ) === true ) {
				console.log( ui.item.attr('refid') );
				ui.item.removeClass('question_not_selected');
				var order = $( this ).sortable('toArray').toString();
			}
			else {
				ui.item.addClass('question_not_selected');
			}
			
			$( '#' + ui.item.attr('refid') ).addClass( 'hide_hard' );
		},
		stop: function( event, ui ) {
			$( this ).removeClass('target');
			var list = $('#question_list_container > li.ui-state-default' );
			if ( list.length >= 1 ) {
				$('#select_info').remove();
				$('#clear_questions').toggleClass('hide');
			}
			else {
				if ( $( '#select_info' ).length === 0 ) {
					$('<li id="select_info" class="info error">Sleep hier uw vragen heen</li>').appendTo('#question_list_container');
				}
				$('#clear_questions').toggleClass('hide');
			}
		},
		over: function( event, ui ) {
			$( this ).addClass('target');
		},
		activate: function( event, ui ) {
			$( this ).addClass('target');
		},
		out: function( event, ui ) {
			$( this ).removeClass('target');
		},
		deactivate: function( event, ui ) {
			$( this ).removeClass('target');
		}
	}).disableSelection();
	
}

function filter_questions() {
	$('#filter_field').keyup( function() {
		var re = $('#filter_field').val();

		$('.question_not_selected').each( function() {
			
			var str = $(this).text();
			var match = str.search(re);

			if ( match == -1) {
				$(this).addClass('hide');
			}
			else {
				$(this).removeClass('hide');
			}
		});
	});
}

function sort_on_category() {
	var groups = [];
	
	$('#questions_container > li').each( function() {
    	var li			= $( this );
    	var title		= $( this ).attr('title');
    	var classname	= title.replace(/ /g,"_");
    	var li_group	= 'list' + $(this).attr('title');

		if( !groups[ li_group ] ) {
      		groups[ li_group ] = [];
      		var first_li = $('<li title="' + title + '" class="category_name" />').text( title );
      		groups[ li_group ].push( first_li );
      	}
      	
      	groups[ li_group ].push( li );
	});
	
	for ( group in groups ) {
		var groupname = group.replace(/ /g,"_");
		var sortable_with = '.sortable_with_' + groupname;
		var ul = $('<ul class="sortable_with_'+ groupname + ' sorts" />');
    	ul.appendTo('#question_list_container');
    	
	}
	
	create_sorts();
  
 	for( group in groups ) {
 		var groupname = group.replace(/ /g,"_");
		var ul = $('<ul class="drag_container_' + groupname + '" />').attr( 'id', groupname );
    	var lis = groups[ group ];
    
		for( i = 0; i < lis.length; i++ ){
    		ul.append( lis[ i ] );
    	}
    	ul.appendTo('#questions_container');
    	var sortable_with = '.sortable_with_' + groupname;
    	var drag_selector = '.drag_container_' + groupname + '> li:not(.category_name)';
    	//var ul = $('<ul class="sortable_with_'+ groupname + '" />');
    	//ul.appendTo('#question_list_container');
    	create_drags( drag_selector, sortable_with);
  	}
  	
  	create_clicks();
  	filter_questions();
}

function create_clicks() {
	$('.category_name').click( function() {
		$( this ).parent().children('.ui-state-default').toggleClass('hide');
		
		var listclass = '.sortable_with_' + $( this ).parent().attr('id');
		var check_category = '.category_list_name_' + $( this ).parent().attr('id');
		console.log('num: ' +$( check_category ).length );
		if ( $( check_category ).length === 0 ) {
			
			//$( listclass ).parent().wrap('<span class="category_list_name_' + $( this ).parent().attr('id') +'">' + $( this ).parent().text() +'</span>');
			$( '<span class="category_list_name category_list_name_' + $( this ).parent().attr('id') +'">' + $( this ).parent().find('.category_name').text() + '</span>' ).prependTo( $( listclass ) );
		}
	});
}

function new_question() {
	var options;
	
	$.ajax({
		type: 'GET',
  		url: base_url + '/xmlprovider/questions/category',
  		dataType: 'xml',
  		success: function(xml){
    		$(xml).find('item').each(function() {
    			options += '<option id="' + $(this).find('id').text() +'">' + $(this).find('description').text() + '</option>';
    		});
  		}
	});
	
	$('<button id="new_question" />').text('Nieuwe vraag').appendTo('#questionnaire_controls').click(function() {
		$('<form id="new_question_form"><div class="block"><label for="new_question_category">Kies een categorie:</label><select name="new_question_category" id="new_question_category">' + options + '</select></div><div class="block"><label for="new_question_text">Nieuwe vraag:</label><input name="new_question_text" id="new_question_text" type="text" /></div><div class="block"><label for="answer_type">Kies een antwoordtype:</label><select name="answer_type" id="answer_type"><option value="open vraag" selected="selected">Open vraag</option><option value="multiple choice">Multiple Choice</option></select></div><div id="answer_container"></div><div class="block"><input id="add_new_question" type="submit" value="Opslaan" /><input id="clear_new_question" type="submit" value="Annuleren" /></div></form>').modal();
		wire_add_question();
		wire_clear_question();
		wire_question_type();
	});
}

function wire_add_question() {
	$( '#add_new_question' ).click( function( event ) {
		var category = $( '#new_question_category' ).val();
		var parent_selector = '.sortable_with_list' + category;
		var selector = '.category_list_name_list' + category;
		var question = $( '#new_question_text' ).val();
		
		if ( $( selector ).length !== 0 ) {
			$( '<li class="question_selected">' + question + '</li>' ).appendTo( selector );
		}
		else if ( ( $( parent_selector ).length !== 0 ) && ( $( selector ).length === 0 ) ) {
			$( '<span class="category_list_name category_list_name_list' + category +'">' + category + '</span>' ).appendTo( parent_selector );
			$( '<li class="question_selected">' + question + '</li>' ).appendTo( parent_selector );
		}
		else {
			var ul = $( '<ul class="sortable_with_list' + category + ' sorts ui-sortable" />' );
			ul.appendTo( $( '#question_list_container' ) );
			$( '<span class="category_list_name category_list_name_list' + category +'">' + category + '</span>' ).appendTo( ul );
			$( '<li class="question_selected">' + question + '</li>' ).appendTo( ul );
			create_sorts( ul );
		}
		
		$.modal.close();
		event.preventDefault();
	});
}

function wire_question_type() {
	// Listen for the a change in the question type selector. If changed we need to update the possible answer fields.
	$('#answer_type').change( function() {
		if ( $('#answer_type option:selected').val() === 'multiple choice' ) {
			$('<button id="add_multiple_choice_answer">Voeg antwoord toe</button><div class="block"><label for="">Optie 1</label><input class="multiple_choice_answer" type="text" name="multiple_choice_answer_1" /></div>').appendTo('#answer_container');
		}
		
		$("#add_multiple_choice_answer").click( function( e ) {
			var id = $('.multiple_choice_answer').length;
			id++;
			$('<div class="block"><label for="multiple_choice_answer_' + id + '">Optie ' + id + '</label><input class="multiple_choice_answer" type="text" name="multiple_choice_answer_' + id + '" />').appendTo('#answer_container');
			e.preventDefault();
		});
		
	});
}

function wire_clear_question() {
	// This function deletes the modal container and overlay form the DOM.
	$('#clear_new_question').click( function( e ) {
		$.modal.close();
		e.preventDefault();
	});
}