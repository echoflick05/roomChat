function myEntry(message){
    var html = `<div class="media media-chat media-chat-reverse">
                    <div class="media-body">
                        <p>${message}</p>
                    </div>
                </div>`;


    $(html).insertBefore('#index_add');
    scrollToBottom();
}

function receiveEntry(message,profile){
    var html = `<div class="media media-chat">
                    <img class="avatar" src="${profile.photo}" alt="user_icon" title="${profile.name}">
                    <div class="media-body">
                        <p>${message}</p>
                    </div>
                </div>`;


    $(html).insertBefore('#index_add');
    scrollToBottom();
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function scrollToBottom() {
    var $chatContent = $('#chat-content');
    $chatContent.scrollTop($chatContent[0].scrollHeight);
}

function addActiveUser(data) {
    var html = `<div id="${data.id}">
                <div class="media media-chat">
                    <img class="avatar" src='${data.photo}' alt="user_icon">
                    <div class="media-body">
                        <p>${data.name}</p>
                    </div>
                </div>
             </div>`;
    
    $('#active_users').append(html);
}

function removeActiveUser(data) {
    if ($(`#${data.id}`).length) {
        $(`#${data.id}`).remove();
    }
}

let photo = 'https://img.icons8.com/color/36/000000/administrator-male.png';

$(document).ready(function(){
    
    async function getChannels(room_name=null){
        let response = await wsClient.getActiveChannels(room_name);
        $('#active_users').empty();
        let activeClient = response.data;
        activeClient.forEach(data => {
            addActiveUser(data.channelInfo);
        });
    }

    var room_name = localStorage.getItem('room_name');
    var login_user = localStorage.getItem('login_user');
    user = JSON.parse(login_user);
    let baseURL = '/';
    if (room_name === null || room_name === undefined) {
        window.location.href = baseURL;
        return '';
    }

    if (user === null || user === undefined) {
        window.location.href = baseURL;
        return '';
    }
    $('#room_name').html(room_name);
    $('#nick_name').html(user.name);

    const channelId = guid();
    user.id = channelId;

    // Create an instance of WebSocketClient
    const wsClient = new EchoFlickClient('hq4qlBbWhAjIUpuzayI8A79vhgUrmEO8',channelId);

    // Set up event handlers
    wsClient.onOpen(() => {
       console.log('Connected to Websocket');
       wsClient.updateChannelInfo(user);
       wsClient.addGroup(room_name);
       getChannels(room_name);
    });

    // Receive Message from server
    wsClient.onMessage((response) => {
        console.log(response);
        socketResponse(response);
    });

    // Receive Message from server if user joined or left in your group
    wsClient.onClientGroup((response) => {
        if(response.data === 'joined'){
            addActiveUser(response.channelInfo);
        }else if(response.data === 'left'){
            removeActiveUser(response.channelInfo);
        }
    });

    // If Server Close connection, it will called
    wsClient.onClose(() => {
        console.log('Disconnected from WebSocket server');
    });

    wsClient.onError((error) => {
        console.error('WebSocket error:', error);
    });

    // Connect to the WebSocket server
    wsClient.connect();

    function sendMessage() {
        var chatMsgValue = $('#chat_msg').val().trim();
        
        if (chatMsgValue.length > 0) {
            myEntry(chatMsgValue);
            $('#chat_msg').val('');
            wsClient.sendMessage(chatMsgValue,room_name,'GROUP');
        } else {
            console.log("The input is empty or contains only whitespace.");
        }
    }

    $('#send_message').on('click', function(){
        sendMessage();
    });

    $('#chat_msg').on('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    function socketResponse(response){
        var msg = response.data;
        var profile = response.channelInfo;
        if(response.type === "SEND_MESSAGE"){
            receiveEntry(msg,profile);
        }
    }

    $('#exit').click(function(){
        localStorage.removeItem('room_name');
        localStorage.removeItem('login_user');
        wsClient.leaveGroup(room_name);
        
        window.location.href = baseURL;
    });

});