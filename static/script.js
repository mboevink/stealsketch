document.addEventListener('DOMContentLoaded', function() {
	var chatBox = document.getElementById("chatList");
	var userBox = document.getElementById("userList");
	var chatEntry = document.getElementById("chatbox");
        var draw = document.getElementById("draw");
	var mousePos = { x:0, y:0 },
	mousePos2 = { 
		x: 0,
		y: 0,
		startX: 0,
		startY: 0,
		offsetX: 0,
		offsetY: 0
	};
	var activeBall = {
		"active":0,
		"id":0
	}
	var users = new Array ();
	chatBox.onSubmit = function () {return false;}
	setInterval((function () {
		chatEntry.focus();
	}), 1555);

	var addUser = function (k) {
		users[ k['name'] ] = "#" + k['colour'];	
		var user = document.createElement('div');
		user.style.color = "#" + k['colour'];
		user.innerHTML = k['name'];
		userBox.appendChild(user);
	}
        var addMessage = function (d) {
		var msg = document.createElement('div');
                msg.className = "userBoxes";
		msg.style.color = users[d.name];
		msg.innerHTML = d.name + ": ";
		var msgC = document.createElement("span");
		msgC.innerHTML = d.data;
                msg.appendChild(msgC);
                chatBox.appendChild(msg);
		chatBox.scrollTop = chatBox.scrollHeight - chatBox.clientHeight;
        }
	var removeUser = function(k) {
		var userBoxes = userBox.querySelectorAll("div");
		for (var i = 0; i < userBoxes.length; i++) {
			if (userBoxes[i].innerHTML == k) {
				userBoxes[i].innerHTML = "";
				userBoxes[i].style.display = "none";
				userBox.removeChild(userBoxes[i]);
			}
		}
		
	}
	var sendMessage = function() {
		var msg = chatEntry.value;
		ws.send(JSON.stringify({ type:"msg", data:msg}));
	}
	chatEntry.onkeydown = function(evt) {
            if(evt.keyCode == 13 && chatEntry.value) {
                //ws.send(chatEntry.value);
		ws.send(JSON.stringify({ type:"msg", data:chatEntry.value}));
                chatEntry.value = '';
            }
        };
	var extractNo = function (value) {
		var n = parseInt(value);
    		return n == null || isNaN(n) ? 0 : n;
	}
	var getActiveBall = function(e){
		if (activeBall.active && activeBall.active != this) return;
		if (activeBall.active) {
			activeBall.active = false;
			activeBall.id = false;
			chatEntry.focus();
			return
		}
		chatEntry.focus();
		activeBall.active = this;
		activeBall.id = activeBall.active.className.match( /[a-z]+[0-9]+/g )[0]
		mousePos2.startX = e.clientX;
		mousePos2.startY = e.clientY;
		mousePos2.offsetX = extractNo(this.style.left); 
		mousePos2.offsetY = extractNo(this.style.top); 
		this.style.zIndex = 10000;
	}
        var mouseMove = function (event) {
                var dot, eventDoc, doc, body, pageX, pageY;
                event = event || window.event;

                mousePos = {
                    x: event.pageX,
                    y: event.pageY
                };
        }
        draw.onmousemove=mouseMove;
	var manageMove = function() {
        var pos = {x:0, y:0};
    	if (activeBall.active && (mousePos.x != mousePos2.x || mousePos.y != mousePos2.y)) {
		mousePos2.x = mousePos.x;
		mousePos2.y = mousePos.y;

		pos.x = (mousePos2.offsetX + mousePos.x - mousePos2.startX);
		if (pos.x > 800 || pos.x < -5) return;
		activeBall.active.style.left = pos.x + "px";
		pos.y = (mousePos2.offsetY + mousePos.y - mousePos2.startY);
		if (pos.y > 750 || pos.y < 50) return;
		activeBall.active.style.top = pos.y + "px";
		ws.send(JSON.stringify({"type":"move", "data":pos, "item":activeBall.id})); 
	}        
    }

	var firstMove = function(d) {
		console.log(d.data);
		var balls = draw.querySelectorAll(".ball");
		for(var i = 0; i < balls.length - 1; i++) {
			var bClass = /([a-z]+)([0-9]+)/g.exec(balls[i].className);
			balls[i].style.left = d.data[ bClass[1] ][ bClass[2]][0] + "px";
			balls[i].style.top = d.data[ bClass[1] ][ bClass[2]][1] + "px";
			balls[i].style.display = 'block';	
		}
	}

	var autoMove = function(d) {
		var target = draw.querySelector("." + d.item);
		if (d.item == activeBall.id) return;
		target.style.left=d.data.x + "px";
		target.style.top = d.data.y + "px";
	
	}
	wsConnect = function() {
	ws = new WebSocket(location.protocol.replace("http","ws") + "//" + window.location.hostname + ":9000");
	ws.binaryType = 'arraybuffer';
	ws.onopen = function() {
		setInterval(manageMove, 250);
	};

	ws.onmessage = function(msg) {
		if(typeof msg.data == 'string') {
		msg = JSON.parse(msg.data);
		
		switch(msg.type) {
			case 'connect':
			addUser(msg.data)
			break;
			
			case 'disconnect':
			removeUser(msg.data);
			break;
			
			case 'list':
			for(var key in msg.data)
				addUser(msg.data[key]);
			break;
			
			case 'msg':
			addMessage(msg);
			break;

			case 'move':
			autoMove(msg);
			break;

			case "balls":
			firstMove(msg)
			break;
		}
		}
	};

	ws.onerror = function(e) {
		console.log(['error', e]);
	};

	ws.onclose = function() {
		console.log("GoodBye");
		window.setTimeout(wsConnect, 2000);
	}
	};
var colours =  ["ali","white","black", "orange","red", "blue", "purple", "green"]; 
for (var c = 0; c < colours.length; c++) {
	for (var i = 0; i < 55; i++) {
		var newBall = document.createElement('div');
		newBall.className = "ball ";
		newBall.className += colours[c];
		newBall.className += " " + colours[c] + i;
		newBall.style.position = "absolute";
		newBall.style.left = 100 + i + "px";
		newBall.style.top = 35 + "px";
		newBall.style.zIndex = c + i * 10 + "";
		newBall.onclick = getActiveBall;
		newBall.style.display = 'none';
		draw.appendChild(newBall);
	}
}
wsConnect();
chatEntry.focus ()

});
