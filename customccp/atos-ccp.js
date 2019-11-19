var ccpDiv = document.getElementById("containerDiv");

var bCCP = document.getElementById("bCCP");
var login = document.getElementById("login");
var logout = document.getElementById("logout");

var bHold = document.getElementById("bHold");
var bMute = document.getElementById("bMute");
var bUnmute = document.getElementById("bUnmute");
var bHangup = document.getElementById("bHangup");
var bCall = document.getElementById("bCall");
var logMsgs = document.getElementById("logMsgs");
var pAlias = document.getElementById("alias");
var pStatus = document.getElementById("status");
var dialnum = document.getElementById("phonenumber")

window.myCPP = window.myCPP || {};
window.myCPP.agent = window.myCPP.agent || null;

var alias = "atosjnjsandbox";

var url = new URL(document.URL);
alias = url.searchParams.get("alias");
if (url.searchParams.get("alias")) {
    alias = url.searchParams.get("alias");
    pAlias.innerHTML = alias;
}

//https://atosjnjsandbox.awsapps.com/connect/home
//https://atosjnjsandbox.awsapps.com/connect/login
//https://atosjnjsandbox.awsapps.com/connect/logout


var ccpUrl = `https://${alias}.awsapps.com/connect/ccp#/`;
var loginUrl = `https://${alias}.awsapps.com/connect/login`;
var logoutUrl = `https://${alias}.awsapps.com/connect/logout`;


if (!window.myCPP.agent) {
    pStatus.innerHTML = "Login Needed";
}


ccpDiv.style.visibility = 'hidden';
bCCP.onclick = function () {
    ccpDiv.style.visibility = (ccpDiv.style.visibility == 'visible') ? 'hidden' : 'visible';
    ccpDiv.style.display = 'block';
}

ccpStateNotReady();

login.onclick = function () {
    logMsgToScreen("login");
    window.open(loginUrl);
}

logout.onclick = function () {
    logMsgToScreen("logout");
    window.open(logoutUrl);
}


bHold.onclick = function () {
    logMsgToScreen("hold - click");
    toggleHold();
}

bHangup.onclick = function () {
    disconnectContact();
}

bMute.onclick = function () {
    logMsgToScreen("mute - click");
    window.myCPP.agent.mute();
}

bUnmute.onclick = function () {
    logMsgToScreen("unmute - click");
    window.myCPP.agent.unmute();

}
bCall.onclick = function () {
    logMsgToScreen("call - click");

    var obqueue = window.myCPP.agent.getRoutingProfile().defaultOutboundQueue;
    var qarn = obqueue.queueARN;
    if (dialnum.value.length > 0) {
        if (!dialnum.value.startsWith("+1")) {
            dialnum.value = "+1" + dialnum.value
        }
        if (!dialnum.value.startsWith("+")) {
            dialnum.value = "+" + dialnum.value
        }

        var endpoint = connect.Endpoint.byPhoneNumber(dialnum.value);
        window.myCPP.agent.connect(endpoint, {
            queueARN: qarn,
            success: function () {
                logMsgToScreen("Set agent status to Available (routable) via Streams");
                ccpStateCalling();

            },
            failure: function () {
                logMsgToScreen("Failed to set agent status to Available (routable) via Streams");
                ccpStateNotReady();
                alert("Failed to connect");

            }
        });
    } else {
        alert("Enter Phone Number to Dial");
    }

}


function ccpStateNotReady() {
    pStatus.innerHTML = "Not Ready";
    bHold.disabled = true;
    bHangup.disabled = true;
    bMute.disabled = true;
    bUnmute.disabled = true;
    bCall.disabled = true;
}

function ccpStateReady() {
    pStatus.innerHTML = "Ready";
    bHold.disabled = true;
    bHangup.disabled = true;
    bMute.disabled = true;
    bUnmute.disabled = true;
    bCall.disabled = false;
}

function ccpStateCalling() {
    pStatus.innerHTML = "Calling";
    bHold.disabled = true;
    bHangup.disabled = false;
    bMute.disabled = true;
    bUnmute.disabled = true;
    bCall.disabled = true;
}

function ccpStateConnected() {
    pStatus.innerHTML = "Connected";
    bHold.disabled = false;
    bHangup.disabled = false;
    bMute.disabled = false;
    bUnmute.disabled = true;
    bCall.disabled = true;
}

function ccpStateMuted() {
    bHold.disabled = true;
    bHangup.disabled = false;
    bMute.disabled = true;
    bUnmute.disabled = false;
    bCall.disabled = true;
}

function ccpStateUnmuted() {
    bHold.disabled = false;
    bHangup.disabled = false;
    bMute.disabled = false;
    bUnmute.disabled = true;
    bCall.disabled = true;
}


logMsgToScreen("initCCP: start");

connect.core.initCCP(containerDiv, {
    ccpUrl: ccpUrl,
    loginPopup: false,
    softphone: {
        allowFramedSoftphone: true
    }
});
logMsgToScreen("initCCP: end");


var eventbus = connect.core.getEventBus()

eventbus.subscribe(connect.EventType.ACKNOWLEDGE,
    function () {
        logMsgToScreen("Event: ACKNOWLEDGE");
    });

eventbus.subscribe(connect.EventType.ACK_TIMEOUT,
    function () {
        logMsgToScreen("Event: ACK_TIMEOUT");
    });

eventbus.subscribe(connect.EventType.API_REQUEST,
    function () {
        logMsgToScreen("Event: API_REQUEST");
    });

eventbus.subscribe(connect.EventType.API_RESPONSE,
    function () {
        logMsgToScreen("Event: API_RESPONSE");
    });

eventbus.subscribe(connect.EventType.CLOSE,
    function () {
        logMsgToScreen("Event: CLOSE");
    });

eventbus.subscribe(connect.EventType.TERMINATE,
    function () {
        logMsgToScreen("Event: TERMINATE");
    });

eventbus.subscribe(connect.EventType.TERMINATED,
    function () {
        logMsgToScreen("Event: TERMINATED");
    });




connect.contact(eventContact);

function eventContact(contact) {
    window.myCPP.contact = contact;
    logMsgToScreen("new contact");
    if (contact.getActiveInitialConnection() &&
        contact.getActiveInitialConnection().getEndpoint()) {
        logMsgToScreen("New contact is from " + contact.getActiveInitialConnection().getEndpoint().phoneNumber.toString());
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
    ccpStateConnected();
}

function eventContactEnded(contact) {
    logMsgToScreen("[contact.onEnded] " + contactToString(contact));
}

function contactToString(contact) {
    rv = [];
    try {
        if (!contact) {
            return "[Contact[nil]]";
        }
    } catch (err) {}
    try {
        id = contact.getContactId();
        rv.push("id:" + id);
    } catch (err) {}
    try {
        state = contact.getState();
        rv.push("state:" + state);
    } catch (err) {}
    try {
        type = contact.getType();
        rv.push("type:" + type);
    } catch (err) {}
    try {
        queue = contact.getQueue().name;
        rv.push("queue:" + queue);
    } catch (err) {}
    try {
        rv.push("attributes:" + JSON.stringify(contact.getAttributes()));
    } catch (err) {}

    return "[Contact[" + rv.join(",") + "]]";
}

//========================================================

connect.agent(eventAgent);

function eventAgent(agent) {
    window.myCPP.agent = agent;
    pStatus.innerHTML = "Agent Logged In";
    logMsgToScreen("eventAgent: " + agent.getName());
    logMsgToScreen("Agent status: " + agent.getStatus().name);


    var routingProfile = agent.getRoutingProfile();
    logMsgToScreen("rp: " + JSON.stringify(routingProfile.name));
    logMsgToScreen("rp-doq: " + JSON.stringify(routingProfile.defaultOutboundQueue));

    //agent.onRefresh(eventAgentRefresh);
    agent.onRoutable(eventAgentRoutable);
    agent.onNotRoutable(eventAgentNotRoutable);
    agent.onOffline(eventAgentOffline);
    agent.onError(eventAgentError);
    agent.onAfterCallWork(eventAfterCallWork);
    agent.onMuteToggle(eventMuteToggle);
    ccpStateReady();
}

function eventAgentRefresh(agent) {
    logMsgToScreen("[agent.onRefresh] " + agentToString(agent));
    if (agent.getState().name == "Available") {
        logMsgToScreen("[agent.onRefresh]: Available");
        ccpStateReady();
    } else if (agent.getState().name == "CallingCustomer") {
        logMsgToScreen("[agent.onRefresh]: Calling");
        ccpStateCalling();
    } else if (agent.getState().name == "Busy") {
        logMsgToScreen("[agent.onRefresh]: Connected");
        ccpStateConnected();
    }
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
    alert("Agent Error");
}

function eventAfterCallWork(agent) {
    logMsgToScreen("[agent.onAfterCallWork] " + agentToString(agent));
    ccpStateReady();
}

function eventMuteToggle(muted) {
    logMsgToScreen("[agent.eventMuteToggle] " + JSON.stringify(muted));
    if (muted.muted == true) {
        ccpStateMuted();
    } else {
        ccpStateUnmuted();
    }
}

function agentToString(agent) {
    rv = [];
    if (!agent) {
        return "[Agent[nil]]";
    }
    state = agent.getState().name;
    rv.push("state:" + state);
    type = agent.getState().type;
    rv.push("type:" + type);
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

function toggleHold() {
    var conn = window.myCPP.contact.getAgentConnection();
    if (conn.isOnHold()) {
        conn.resume({
            success: function () {
                logMsgToScreen("resume - success");
            },
            failure: function () {
                logMsgToScreen("resume - fail");
            }
        });
    } else {
        conn.hold({
            success: function () {
                logMsgToScreen("hold - success");
            },
            failure: function () {
                logMsgToScreen("hold - fail");
            }
        });

    }
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
    logMsgs.innerHTML = logMsgs.innerHTML + new Date().toLocaleTimeString() + ' ' + msg + '\n';
}
