
var socket = io('/');

{
    socket.on('sockauth.init', () => {
        $.get('/sockauth', data => {
            if(!data.success){
                if(!data.login) window.location.reload(true);
                else swal('Error', data.err[0], 'error');
                return;
            }
            socket.emit('sockauth.useToken', data);
        }, 'json').fail(()=>swal('Error', 'Failed querying backend, please try refreshing', 'error'));
    });
    
    socket.on('sockauth.error', err => swal('Error', err[0], 'error'));
    
    socket.on('sockauth.success', () => console.log('socket connected and authorised'));
    
}