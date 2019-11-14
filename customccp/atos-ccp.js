window.myCPP = window.myCPP || {};

var ccpUrl = "https://atosjnjsandbox.awsapps.com/connect/ccp#/";
var ccpDiv = document.getElementById("containerDiv");

var bCCP = document.getElementById("bCCP");

var bAnswer = document.getElementById("bAnswer");
var bHold = document.getElementById("bHold");
var bHangup = document.getElementById("bHangup");
var bCall = document.getElementById("bCall");
var logMsgs = document.getElementById("logMsgs");

ccpDiv.style.visibility = 'hidden';
bCCP.onclick = function (){
	ccpDiv.style.visibility = (ccpDiv.style.visibility == 'visible') ? 'hidden' : 'visible';
}

bAnswer.disabled = 'true';
bHold.disabled = 'true';
bHangup.disabled = 'true';

bAnswer.onclick = function() {
	acceptContact();
	bAnswer.disabled = 'true';
	bHangup.disabled = 'false';
}

bHangup.onclick = function() {
	disconnectContact();
	bAnswer.disabled = 'false';
	bHangup.disabled = 'true';
}

bCall.onclick = function (){
	logMsgToScreen("test - click");
	window.myCPP.agent.connect("12144032355", {
        
		success: function () {
			logMsgToScreen("Set agent status to Available (routable) via Streams");
		},
		failure: function () {
			logMsgToScreen("Failed to set agent status to Available (routable) via Streams");
		}
	});
}

logMsgToScreen("initCCP: start");

connect.core.initCCP(containerDiv, {
	ccpUrl: ccpUrl,
	loginPopup: true,
	softphone: {
		allowFramedSoftphone: true
	}
});
logMsgToScreen("initCCP: end");


connect.contact(eventContact);
function eventContact(contact) {
	window.myCPP.contact = contact;
	logMsgToScreen("new contact");
	if (contact.getActiveInitialConnection()
			&& contact.getActiveInitialConnection().getEndpoint()) {
		logMsgToScreen("New contact is from " + contact.getActiveInitialConnection().getEndpoint().phoneNumber.toString());
		bAnswer.disabled = 'false';
		bHold.disabled = 'false';
	} else {
		logMsgToScreen("This is an existing contact for this agent");
	}
	logMsgToScreen("Contact is from queue " + contact.getQueue().name);
	logMsgToScreen("Contact attributes are " + JSON.stringify(contact.getAttributes()));
	
	contact.onRefresh(eventContactRefresh);
	contact.onIncoming(eventContactIncoming);
	contact.onAccepted(eventContactAccepted);
	contact.onConnected(eventContactConnected);
	contact.onEnded(eventContactEnded);
}
function eventContactRefresh(contact) {
	logMsgToScreen("[contact.onRefresh] " + contactToString(contact));
}
function eventContactIncoming(contact) {
	logMsgToScreen("[contact.onIncoming] " + contactToString(contact));
}
function eventContactAccepted(contact) {
	logMsgToScreen("[contact.onAccepted] " + contactToString(contact));
	logMsgToScreen("[contact.onAccepted] window.open");
}
function eventContactConnected(contact) {
	logMsgToScreen("[contact.onContactConnected] " + contactToString(contact));
}
function eventContactEnded(contact) {
	logMsgToScreen("[contact.onEnded] " + contactToString(contact));
	clearAgentDisplay();
}
function contactToString(contact) {
	rv = [];
	if (!contact) {
		return "[Contact[nil]]";
	}
	id = contact.getContactId();
	rv.push("id:" + id);
	type = contact.getType();
	rv.push("type:" + type);
	queue = contact.getQueue().name;
	rv.push("queue:" + queue);
	rv.push("attributes:" + JSON.stringify(contact.getAttributes()));
	return "[Contact[" + rv.join(",") + "]]";
}
connect.agent(eventAgent);
function eventAgent(agent) {
	window.myCPP.agent = agent;
	logMsgToScreen("eventAgent: " + agent.getName());
	logMsgToScreen("Agent status: " + agent.getStatus().name);
    
        
    routingProfile = agent.getRoutingProfile();
    logMsgToScreen("got rp");
    logMsgtoScreen("rp: " + routingProfile.name);
    logMsgToScreen("got rp");
    logMsgtoScreen("rp-doq: " + JSON.stringify(routingProfile.defaultOutboundQueue));
    logMsgToScreen("got rp");
        
	agent.onRefresh(eventAgentRefresh);
	agent.onRoutable(eventAgentRoutable);
	agent.onNotRoutable(eventAgentNotRoutable);
	agent.onOffline(eventAgentOffline);
	agent.onError(eventAgentError);
	agent.onAfterCallWork(eventAfterCallWork);

    
}
function eventAgentRefresh(agent) {
	logMsgToScreen("[agent.onRefresh] " + agentToString(agent));
}
function eventAgentRoutable(agent) {
	logMsgToScreen("[agent.onRoutable] " + agentToString(agent));
}
function eventAgentNotRoutable(agent) {
	logMsgToScreen("[agent.onNotRoutable] " + agentToString(agent));
}
function eventAgentOffline(agent) {
	logMsgToScreen("[agent.onOffline] " + agentToString(agent));
}
function eventAgentError(agent) {
	logMsgToScreen("[agent.onError] " + agentToString(agent));
}
function eventAfterCallWork(agent) {
	logMsgToScreen("[agent.onAfterCallWork] " + agentToString(agent));
}
function agentToString(agent) {
	rv = [];
	if (!agent) {
		return "[Agent[nil]]";
	}
	state = agent.getState().name;
	rv.push("state:" + state);
	config = agent.getConfiguration();
	rv.push("name:" + config.name);
	rv.push("user:" + config.username);
	return "[Agent[" + rv.join(",") + "]]";
}
function goAvailable() {
	var routableState = window.myCPP.agent.getAgentStates().filter(function (state) {
		return state.type === connect.AgentStateType.ROUTABLE;
	})[0];
	window.myCPP.agent.setState(routableState, {
		success: function () {
			logMsgToScreen("Set agent status to Available (routable) via Streams");
		},
		failure: function () {
			logMsgToScreen("Failed to set agent status to Available (routable) via Streams");
		}
	});
}
function goOffline() {
	var offlineState = window.myCPP.agent.getAgentStates().filter(function (state) {
		return state.type === connect.AgentStateType.OFFLINE;
	})[0];
	window.myCPP.agent.setState(offlineState, {
		success: function () {
			logMsgToScreen("Set agent status to Offline via Streams");
		},
		failure: function () {
			logMsgToScreen("Failed to set agent status to Offline via Streams");
		}
	});
}
function acceptContact() {
	window.myCPP.contact.accept({
		success: function () {
			logMsgToScreen("Accepted contact via Streams");
		},
		failure: function () {
			logMsgToScreen("Failed to accept contact via Streams");
		}
	});
}
function disconnectContact() {
	//cannot do contact.destroy(), can only destroy (hang-up) agent connection
	window.myCPP.contact.getAgentConnection().destroy({
		success: function () {
			logMsgToScreen("Disconnected contact via Streams");
		},
		failure: function () {
			logMsgToScreen("Failed to disconnect contact via Streams");
		}
	});
}

function logMsgToScreen(msg) {
	console.log('lmts: ' + msg);
	logMsgs.innerHTML =  logMsgs.innerHTML + new Date().toLocaleTimeString() + ' ' + msg + '\n';
}


