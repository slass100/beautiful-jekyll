var ccpDiv = document.getElementById("containerDiv");

var bCCP = document.getElementById("bCCP");
var bHold = document.getElementById("bHold");
var bMute = document.getElementById("bMute");
var bHangup = document.getElementById("bHangup");
var bCall = document.getElementById("bCall");
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

bHold.onclick = function () {
    ccpLogger("hold - click");
    toggleHold();
}

bHangup.onclick = function () {
    disconnectContact();
}

bMute.onclick = function () {
    ccpLogger("mute - click");
    if (bMute.innerHTML == "mute") {
        window.myCPP.agent.mute();
    }
    else {
        window.myCPP.agent.unmute();
    }
    
}

bCall.onclick = function () {
    ccpLogger("call - click");

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
                ccpLogger("Set agent status to Available (routable) via Streams");
                ccpStateCalling();

            },
            failure: function () {
                ccpLogger("Failed to set agent status to Available (routable) via Streams");
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
    bCall.disabled = true;
}

function ccpStateReady() {
    pStatus.innerHTML = "Ready";
    bHold.disabled = true;
    bHangup.disabled = true;
    bMute.disabled = true;
    bCall.disabled = false;
}

function ccpStateCalling() {
    pStatus.innerHTML = "Calling";
    bHold.disabled = true;
    bHangup.disabled = false;
    bMute.disabled = true;
    bCall.disabled = true;
}

function ccpStateConnected() {
    pStatus.innerHTML = "Connected";
    bHold.disabled = false;
    bHangup.disabled = false;
    bMute.disabled = false;
    bCall.disabled = true;
}

function ccpStateMuted() {
    bMute.innerHTML = "unmute";
}

function ccpStateUnmuted() {
    bMute.innerHTML = "mute";
}


ccpLogger("initCCP: start");

connect.core.initCCP(containerDiv, {
    ccpUrl: ccpUrl,
    loginPopup: false,
    softphone: {
        allowFramedSoftphone: true
    }
});
ccpLogger("initCCP: end");


connect.contact(eventContact);

function eventContact(contact) {
    window.myCPP.contact = contact;
    if (contact.getActiveInitialConnection() &&
        contact.getActiveInitialConnection().getEndpoint()) {
        ccpLogger("New contact is from " + contact.getActiveInitialConnection().getEndpoint().phoneNumber.toString());
    } else {
        ccpLogger("This is an existing contact for this agent");
    }
    contact.onConnected(eventContactConnected);
    contact.onEnded(eventContactEnded);
}

function eventContactConnected(contact) {
    ccpStateConnected();
}

function eventContactEnded(contact) {
    ccpStateReady();
}

function contactToString(contact) {
    rv = [];
    try {
        id = contact.getContactId();
        rv.push("id:" + id);
    } catch (err) {}
    return "[Contact[" + rv.join(",") + "]]";
}

//========================================================

connect.agent(eventAgent);

function eventAgent(agent) {
    window.myCPP.agent = agent;
    pStatus.innerHTML = "Agent Logged In";
    var routingProfile = agent.getRoutingProfile();
    agent.onError(eventAgentError);
    agent.onAfterCallWork(eventAfterCallWork);
    agent.onMuteToggle(eventMuteToggle);
    ccpStateReady();
}

function eventAgentError(agent) {
    alert("Agent Error");
}

function eventAfterCallWork(agent) {
    ccpStateReady();
}

function eventMuteToggle(muted) {
    if (muted.muted == true) {
        ccpStateMuted();
    } else {
        ccpStateUnmuted();
    }
}

function agentToString(agent) {
    rv = [];
    config = agent.getConfiguration();
    rv.push("name:" + config.name);
    rv.push("user:" + config.username);
    return "[Agent[" + rv.join(",") + "]]";
}

function toggleHold() {
    var conn = window.myCPP.contact.getInitialConnection();
    if (conn.isOnHold()) {
        conn.resume({
            success: function () {
                ccpLogger("resume - success");
            },
            failure: function () {
                ccpLogger("resume - fail");
            }
        });
    } else {
        conn.hold({
            success: function () {
                ccpLogger("hold - success");
            },
            failure: function () {
                ccpLogger("hold - fail");
            }
        });

    }
}

function disconnectContact() {
    window.myCPP.contact.getAgentConnection().destroy({
        success: function () {
            ccpLogger("Disconnected contact via Streams");
        },
        failure: function () {
            ccpLogger("Failed to disconnect contact via Streams");
        }
    });
}

function ccpLogger(msg) {
    console.log('ccp1: ' + msg);
}
