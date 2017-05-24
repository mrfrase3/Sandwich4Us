
/*import MaterialDateTimePicker from 'material-datetime-picker';*/
{

    let dp_soon = moment().add(2, 'h').minute(0);
    $(".c-datepicker-input").val( dp_soon.format("HH:mm DD/MM/YYYY") );
    
    const picker = new MaterialDatetimePicker({defualt: dp_soon, min: moment()}).on('submit', (value) => {
        if(value.toDate() < Date.now()) value = moment().add(2, 'h').minute(0);
        $(".c-datepicker-input").val( value.format("HH:mm DD/MM/YYYY") );
    });
    
    $(".c-datepicker-input").click( () => picker.open());
    
}

var getLoc = {lat: -26.0906899, lng: 128.1506632};
var initMap = function(){
    
    // setup objects //
    
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
        radius: (Number($('input#req-dist').val()) || 5) * 1000,
        fillColor: "#004445",
        fillOpacity: 0.5,
        strokeWeight: 0
    });
    
    // setup helper functions //
    
    let updatePos = (e)=>{
        getLoc = e.latLng;
        marker.setPosition(getLoc);
        circle.setCenter(getLoc);
        map.setCenter(getLoc);
    };
    
    let geoErr = (hasGeo) => { alert("Could not get your location. " + hasGeo) };
    
    // handle events //
    
    map.addListener('click', updatePos);
    
    $('button.getloc').click((e)=>{
        e.preventDefault();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                updatePos({latLng: new google.maps.LatLng(position.coords.latitude, position.coords.longitude)});
                map.setZoom(3);
            }, ()=> {
                geoErr(true);
            });
        } else geoErr(false);
    });
    
    $('input#req-dist').change(()=>{
        circle.setRadius((Number($('input#req-dist').val()) || 5) * 1000);
    });
};