var demoServer = null;
var nodeList = [];

function display_message(message) {
    var author, content, timestamp;
    if (message.author && message.content) {
        author = "<td>" + message.author + "</td>";
        content = "<td>" + message.content + "</td>";
        if (message.timestamp) {
            timestamp = "<td>" + message.timestamp + "</td>";
        } else {
            timestamp = "<td></td>";
        }
        $("conversation").insert("<tr>" + timestamp + author + content + "</td>");
    }
}

function respondTo(httpReq) {
    var data, message, queryString, postData, i, received, response;

    if (httpReq.body && httpReq.body.length > 0) {
        data = httpReq.body.evalJSON(true);
    } else {
        queryString = httpReq.rawPath.split('?')[1];
        if (queryString) {
            postData = queryString.toQueryParams().postData;
        }
        if (postData) {
            data = postData.evalJSON(true);
        }
    }
        
    if (data && data.messages) {
        for (i = 0; i < data.messages.length; i += 1) {
            message = data.messages[i];
            if (message.origin) {
                display_message(message);
                add_chat_node(message.origin);
            }
        }
        received = true;
    } else {
        received = false;
    }

    if (data && data.callback) {
        response = data.callback + "(" + Object.toJSON({ received: true }) + ");";
    } else {
        response = Object.toJSON({ received: true });
    }

    httpReq.respond(200, "OK", { 'Content-Type': 'application/json' }, response);
}

function render_node_list() {
    var newContent = [], i;
    for (i = 0; i < nodeList.length; i += 1) {
        newContent.push("<li>" + nodeList[i] + "</li>");
    }
    $("nodeList").innerHTML = newContent.join("\n");
}

function add_chat_node(node) {
    var i;
    for (i = 0; i < nodeList.length; i += 1) {
        if (nodeList[i] === node) {
            return;
        }
    }
    nodeList.push(node);
    render_node_list();
}

function add_chat_node_from_form() {
    var newNode = $("newNode").value;
    $("newNode").value = "";
    add_chat_node(newNode);
}

function send_to_node(node, message) {
    var author = $("screenName").value,
        origin = $("demoLabel_link").href,
        parameters,
        receivedOk = null;

    parameters = '?callback=?&postData=';
    parameters += escape(Object.toJSON({ messages: [{ author: author, content: message, origin: origin }] })),
    jQuery.getJSON(node + parameters, function(data) {
        alert('called back with ' + data);
        if (data && data.received) {
            receivedOk = true;
        }
    });

    // Wait 15 seconds for a success response, and display an error if none is received.
    window.setTimeout(function() {
        if (!receivedOk) {
//            display_message({ author: "error!", content: "Could not deliver message to " + node + "." });
        }
    }, 15000);
}

function send_message() {
    var message = $("message").value, i;
    $("message").value = "";
    for (i = 0; i < nodeList.length; i += 1) {
        send_to_node(nodeList[i], message);
    }
}

var demoLabel_keypress_timeout = null;

function demoLabel_changed() {
    begin_serving();
}

function demoLabel_keypress() {
    if (demoLabel_keypress_timeout != null) {
	clearTimeout(demoLabel_keypress_timeout);
	demoLabel_keypress_timeout = null;
    }
    demoLabel_keypress_timeout = setTimeout(demoLabel_changed, 300);
}

function demo_main() {
    var initialValue = "chat" + Math.round(Math.random() * 100000);
    $("demoLabel").value = initialValue;
    begin_serving();
}

function begin_serving() {
    var label = $("demoLabel").value;
    if (demoServer == null || demoServer.label != label) {
	if (demoServer != null) { demoServer.stop(); }
	demoServer = new HttpServer(label, respondTo, {onLocationChanged: updateLocation,
						       debug: log});
    }

    function updateLocation(newLoc) {
	$("demoLabel_link").href = newLoc;
	$("demoLabel_link").innerHTML = newLoc;
    }
}
