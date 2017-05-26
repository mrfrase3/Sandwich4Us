{
	
	$('.stamp-to-time').each(function(){
	    $(this).val( moment( Number( $(this).val() ) ).format('HH:mm YYYY/MM/DD') );
	});
	
	$('#accessed').text( moment().format('HH:mm YYYY/MM/DD') );

}