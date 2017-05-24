
/*import MaterialDateTimePicker from 'material-datetime-picker';*/
{

    let dp_soon = moment().add(2, 'h').minute(0);
    $('.c-datepicker-input').val( dp_soon.format('HH:mm YYYY/MM/DD') );
    
    const picker = new MaterialDatetimePicker({defualt: dp_soon, min: moment()}).on('submit', value => {
        if(value.toDate() < Date.now()) value = moment().add(2, 'h').minute(0);
        $('.c-datepicker-input').val( value.format('HH:mm YYYY/MM/DD') );
    });
    
    $('.c-datepicker-input').focus( e => {
        e.preventDefault();
        picker.open();
    });
    
    $('.req-ing-table input[name="req-want"], .req-ing-table input[name="req-have"]').change(function(e){
        
        if($(this).attr('name') === 'req-want'){ //set the other to false
            $('input[name="req-have"][value="'+$(this).attr('value')+'"]').prop('checked', false);
        } else {
            $('input[name="req-want"][value="'+$(this).attr('value')+'"]').prop('checked', false);
        }
        
        setTimeout(()=>{
            $('.req-have-table tbody tr, .req-want-table tbody tr').remove();
            $('.req-ing-table input[name="req-want"]:checked').each(function(){
                $('.req-want-table tbody').append('<tr><td>'+$(this).attr('value')+'</td></tr>');
            });
            $('.req-ing-table input[name="req-have"]:checked').each(function(){
                $('.req-have-table tbody').append('<tr><td>'+$(this).attr('value')+'</td></tr>');
            });
        }, 50);
    });
    
    $('input#req-ing-search').keyup(function(){
        if($(this).val().trim() !== ''){
            $('.req-ing-table tbody tr').hide();
            $('.req-ing-table tbody tr[data-text*="'+$(this).val()+'"]').show();
        } else {
            $('.req-ing-table tbody tr').show();
        }
    });
    
}


var initMap = function(){
    
    // setup objects //
    let geocoder = new google.maps.Geocoder();
    let autocomplete = new google.maps.places.Autocomplete(document.getElementById('req-loc'), {componentRestrictions: {country: 'au'}});
    
    let getLoc = new google.maps.LatLng( -26.0906899, 128.1506632);
    
    let map = new google.maps.Map(document.getElementById('req_getLocMap'), {
      center: getLoc,
      zoom: 5
    });
    
    let marker = new google.maps.Marker({
        map,
        position: getLoc
    });
    
    let circle = new google.maps.Circle({
        map,
        center: getLoc,
        radius: (Number($('input#req-dist').val()) || 2) * 1000,
        fillColor: "#004445",
        fillOpacity: 0.5,
        strokeWeight: 0,
        clickable: false
    });
    
    // setup helper functions //
    
    let updatePos = (e, dontName)=>{
        if(dontName){
            getLoc = e.latLng;
            marker.setPosition(getLoc);
            circle.setCenter(getLoc);
            map.setCenter(getLoc);
            $('input#req-lat').val(getLoc.lat());
            $('input#req-long').val(getLoc.lng());
        } else {
            geocoder.geocode( { location: e.latLng}, (results, status) => {
                if (status == 'OK') {
                    updatePos({latLng: results[0].geometry.location}, true);
                    $('input#req-loc').val(results[0].formatted_address);
                } else {
                    console.log(status);
                    updatePos({latLng: e.latLng});
                }
                map.setZoom(14);
            });
        }
    };
    
    let geoErr = (hasGeo) => { alert("Could not get your location. " + hasGeo) };
    
    // handle events //
    
    map.addListener('click', updatePos);
    
    $('button.getloc').click( e => {
        e.preventDefault();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                let geoloc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                updatePos({latLng: geoloc});
            }, ()=> {
                geoErr(true);
            });
        } else geoErr(false);
    });
    
    $('input#req-dist').change( () => {
        circle.setRadius((Number($('input#req-dist').val()) || 2) * 1000);
    });
    
    $('input#req-loc').change( e => {
        setTimeout( ()=>{
            geocoder.geocode( { address: $('input#req-loc').val(), region: 'au'}, (results, status) => {
                if (status == 'OK') {
                    updatePos({latLng: results[0].geometry.location}, true);
                    console.log(results);
                    //$('input#req-loc').val(results[0].formatted_address);
                } else {
                    alert('Adress lookup failed. ' + status);
                }
                map.setZoom(14);
            });
        }, 100);
    });
};