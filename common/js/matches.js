
var get_matches;

{
    let counter = 0;
    var old_matches;
    var geocoder;
    var map;
    var markers = [];
    var match_template = Handlebars.compile($("#match-template").html());
    get_matches = () => {
        if(++counter < 2) return;
        if(counter === 2){
            geocoder = new google.maps.Geocoder();
            map = new google.maps.Map(document.getElementById('req_getLocMap'), {
                center: new google.maps.LatLng(
                    $('#req_getLocMap').attr('data-lat'),
                    $('#req_getLocMap').attr('data-long')
                ),
                zoom: 13
            });
        }
        socket.emit('matches.get');
    }
    
    socket.on('sockauth.success', get_matches);
    
    socket.on('matches.list', matches => {
        $(".match-list li").remove();
        $(".match-list").html(match_template(matches));
        //do something about new matches
        
        old_matches = matches;
        for(let i in markers) markers[i].setMap(null);
        markers = [];
        $('.get-loc-name').each(function(i){
            let label;
            if(i) (i+9).toString(36).toUpperCase();
            let position = new google.maps.LatLng($(this).attr('data-lat'),$(this).attr('data-long'));
            markers.push(new google.maps.Marker({
                map,
                position,
                label
            }));
            geocoder.geocode( { location: position, region: 'au'}, (results, status) => {
                if (status == 'OK') {
                    $(this).text(results[0].formatted_address);
                } else {
                    console.error('Adress lookup failed. ' + status);
                }
            });
        });
        $('.star-score').each(function(){
            let score = Number($(this).attr('data-score')) || 0;
            let stars = ['star_border', 'star_border', 'star_border', 'star_border', 'star_border'];
            if(score > 0.05) stars[0] = 'star half';
            if(score > 0.15) stars[0] = 'star';
            if(score > 0.25) stars[1] = 'star half';
            if(score > 0.35) stars[1] = 'star';
            if(score > 0.45) stars[2] = 'star half';
            if(score > 0.55) stars[2] = 'star';
            if(score > 0.65) stars[3] = 'star half';
            if(score > 0.75) stars[3] = 'star';
            if(score > 0.85) stars[4] = 'star half';
            if(score >= 0.95) stars[4] = 'star';
            $(this).html(
                '<i class="material-icons">'+
                stars.join('</i><i class="material-icons">')+
                '</i>'    
            );
        });
    });
    
    setInterval(() => {
        $('.get-time-left').each(function(){
            $(this).text(moment($(this).attr('data-time')).toNow());
        });
    }, 500);
}


var initMap = function(){
    
    get_matches();
};