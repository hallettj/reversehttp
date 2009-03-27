var demoServer = null;

function respondTo(httpReq) {
    var payload, data, commit, i;
    if (httpReq.body && httpReq.body.length > 0) {
        payload = httpReq.body.split('=')[1];
        if (payload) {
            data = unescape(payload).evalJSON(true);
            if (data.commits) {
                for (i = 0; i < data.commits.length; i += 1) {
                    commit = data.commits[i];
                    $("commit-list").insert("<li>" + commit.timestamp + " -- " + commit.message + " (from " + commit.author.email + ")" + "</li>");
                }
            }
        }
    }
    httpReq.respond(200, "OK", {}, "Received OK");
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
    var initialValue = "github" + Math.round(Math.random() * 100000);
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
