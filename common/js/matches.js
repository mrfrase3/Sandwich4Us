
var get_matches;

{
    let counter = 0;
    var old_matches = [];
    var geocoder;
    var map;
    var markers = [];
    var match_template = Handlebars.compile($("#match-template").html());
    
    get_matches = () => {// only start when both the socket and map is ready
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
        //get the list of matches
        socket.emit('matches.get');
        setInterval(()=>socket.emit('matches.get'), 5000);
    }
    
    socket.on('sockauth.success', get_matches);
    
    socket.on('matches.list', matches => {
        // add labels and check to see if anything has changed
        let changed = false;
        for(let i in matches){
            matches[i].label = (Number(i)+10).toString(36).toUpperCase();
            if(changed) continue;
            let same = false;
            for(let j in old_matches){
                if(matches[i].id === old_matches[j].id && 
                matches[i].updatedAt == old_matches[j].updatedAt){
                    same = true;
                    break;
                }
            }
            if(!same) changed = true;
        }
        for(let j in old_matches){
            if(changed) continue;
            let same = false;
            for(let i in matches){
                if(matches[i].id === old_matches[j].id && 
                matches[i].updatedAt == old_matches[j].updatedAt){
                    same = true;
                    break;
                }
            }
            if(!same) changed = true;
        }
        if(!changed) return;
        // set the html list
        $(".match-list li").remove();
        $(".match-list").html(match_template(matches));
        //do something about new matches
        
        old_matches = matches;
        //delete the old markers
        for(let i in markers) markers[i].setMap(null);
        markers = [];
        // get the street addresses of the locs and place their markers
        $('.get-loc-name').each(function(i){
            let label;
            if(i) label = (i+9).toString(36).toUpperCase();
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
        // set the star ratings from the scores
        $('.star-score').each(function(){
            let score = Number($(this).attr('data-score')) || 0;
            let stars = ['star_border', 'star_border', 'star_border', 'star_border', 'star_border'];
            if(score > 0.05) stars[0] = 'star_half';
            if(score > 0.15) stars[0] = 'star';
            if(score > 0.25) stars[1] = 'star_half';
            if(score > 0.35) stars[1] = 'star';
            if(score > 0.45) stars[2] = 'star_half';
            if(score > 0.55) stars[2] = 'star';
            if(score > 0.65) stars[3] = 'star_half';
            if(score > 0.75) stars[3] = 'star';
            if(score > 0.85) stars[4] = 'star_half';
            if(score >= 0.95) stars[4] = 'star';
            $(this).html(
                'Match Quality: <i class="material-icons">'+
                stars.join('</i><i class="material-icons">')+
                '</i>'    
            );
        });
    });
    
    setInterval(() => { // display the times in a counting down fasion
        $('.get-time-left').each(function(){
            $(this).text( moment().to( Number( $(this).attr('data-time') ) ) );
        });
    }, 500);
    
    $('button.cancel').click(()=>{
        $.post('/request', {req_end: Date.now()-2*60*1000}, ()=>{
            window.location.reload(true);
        });
    });
}


var initMap = function(){
    
    get_matches();
};