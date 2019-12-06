
var ccpDiv = document.getElementById("containerDiv");

var uibCCP = document.getElementById("CCP");
var uibHold = document.getElementById("Hold");
var uibMute = document.getElementById("Mute");
var uibHangup = document.getElementById("Hangup");
var uibCall = document.getElementById("Call");
var uipAlias = document.getElementById("Alias");
var uipStatus = document.getElementById("Status");
var uiiDialnum = document.getElementById("PhoneNum");
var uiiAgentnum = document.getElementById("AgentNum");
var uibAgentSet = document.getElementById("AgentSet");

window.myCCP = window.myCCP || {};
window.myCCP.agent = window.myCCP.agent || null;

var alias = "janssen-na-fras-qa";
uipAlias.innerHTML = alias;

var idpUrl = 'https://sso.connect.pingidentity.com/sso/sp/initsso?saasid=1b7ae09e-ca9b-4a29-ad27-f4e325fce893&idpid=7f5c3f99-306a-48c4-9247-82f6e16f3a44&appurl=https%3A%2F%2Fus-east-1.console.aws.amazon.com%2Fconnect%2Ffederate%2Fe9f556c8-c6e4-4adc-9977-de9e2ee0ca36%3Fdestination%3D%2Fconnect%2Fccp%23%2F';

var ccpUrl = 'https://janssen-na-fras-qa.awsapps.com/connect/ccp#/';
var loginUrl = 'https://janssen-na-fras-qa.awsapps.com/connect/login';
var logoutUrl = 'https://janssen-na-fras-qa.awsapps.com/connect/logout';


var loginwindow = null;
window.onload = function () {
    ccpLogger("windows:onload");
    setTimeout(function () {
        ccpLogger('windows:onload:start');
        if (window.myCCP.agent == null) {
            ccpLogger('agent null');
        }
        if (!window.myCCP.agent) {
            uipStatus.innerHTML = "Login Needed";
            loginwindow = window.open(idpUrl, 'Custom CCP', 'width=450, height=600');
        }
        ccpLogger('windows:onload:end');
    }, 000);
};


ccpDiv.style.visibility = 'hidden';
uibCCP.onclick = function () {
    ccpDiv.style.visibility = (ccpDiv.style.visibility == 'visible') ? 'hidden' : 'visible';
    ccpDiv.style.display = 'block';
}

ccpStateNotReady();

uibAgentSet.onclick = function () {
    setuiiAgentnum();
}


uibHold.onclick = function () {
    toggleHold();
}

uibHangup.onclick = function () {
    disconnectContact();
}

uibMute.onclick = function () {
    if (uibMute.innerHTML == "mute") {
        window.myCCP.agent.mute();
    } else {
        window.myCCP.agent.unmute();
    }

}

var cblist = document.getElementsByClassName("ccpcall");
var i;
for (i = 0; i < cblist.length; i++) {
    cblist[i].onclick = function () {
        var ispan = this.firstElementChild;
        var phonenum = ispan.innerHTML;
        outboundcall(phonenum);
    }
}

uibCall.onclick = function () {
    if (uiiDialnum.value.length > 0) {
        if (!uiiDialnum.value.startsWith("+1")) {
            uiiDialnum.value = "+1" + uiiDialnum.value
        }
        if (!uiiDialnum.value.startsWith("+")) {
            uiiDialnum.value = "+" + uiiDialnum.value
        }
        outboundcall(uiiDialnum.value);
    } else {
        alert("Enter Phone Number to Dial");
    }

}


function ccpStateNotReady() {
    uipStatus.innerHTML = "Not Ready";
    uibHold.disabled = true;
    uibHangup.disabled = true;
    uibMute.disabled = true;
    uibCall.disabled = true;
}

function ccpStateReady() {
    uipStatus.innerHTML = "Ready";
    uibHold.disabled = true;
    uibHangup.disabled = true;
    uibMute.disabled = true;
    uibCall.disabled = false;
}

function ccpStateCalling() {
    uipStatus.innerHTML = "Calling";
    uibHold.disabled = true;
    uibHangup.disabled = false;
    uibMute.disabled = true;
    uibCall.disabled = true;
}

function ccpStateConnected() {
    uipStatus.innerHTML = "Connected";
    uibHold.disabled = false;
    uibHangup.disabled = false;
    uibMute.disabled = false;
    uibCall.disabled = true;
}

function ccpStateMuted() {
    uibMute.innerHTML = "unmute";
}

function ccpStateUnmuted() {
    uibMute.innerHTML = "mute";
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
    window.myCCP.contact = contact;
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
    ccpLogger('eventAgent');
    window.myCCP.agent = agent;
    if (loginwindow) {
        loginwindow.close();
        loginwindow = null;
    }
    uipStatus.innerHTML = "Agent Logged In";
    var routingProfile = agent.getRoutingProfile();
    agent.onError(eventAgentError);
    agent.onAfterCallWork(eventAfterCallWork);
    agent.onMuteToggle(eventMuteToggle);
    ccpStateReady();
}

function eventAgentError(agent) {
    ccpLogger("agent error: " + agentToString(agent));
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


//================================================


function setuiiAgentnum() {
    var agentconfig = window.myCCP.agent.getConfiguration();
    if (uiiAgentnum.value.length > 0) {
        ccpLogger("deskphone");
        if (!uiiAgentnum.value.startsWith("+1")) {
            uiiAgentnum.value = "+1" + uiiAgentnum.value
        }
        if (!uiiAgentnum.value.startsWith("+")) {
            uiiAgentnum.value = "+" + uiiAgentnum.value
        }
        agentconfig.softphoneEnabled = false;
        agentconfig.extension = uiiAgentnum.value;
    } else {
        ccpLogger("softphone");
        agentconfig.softphoneEnabled = true;
    }
    window.myCCP.agent.setConfiguration(agentconfig, {
        success: function (data) {
            ccpLogger("agentconfig:set");
        },
        failure: function (data) {
            alert("Invalid Agent Number");
            return false;
        }
    });
    return true;
}


function outboundcall(phonenum) {
    var obqueue = window.myCCP.agent.getRoutingProfile().defaultOutboundQueue;
    var qarn = obqueue.queueARN;
    var endpoint = connect.Endpoint.byPhoneNumber(phonenum);
    window.myCCP.agent.connect(endpoint, {
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
}




function toggleHold() {
    var conn = window.myCCP.contact.getInitialConnection();
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
    window.myCCP.contact.getAgentConnection().destroy({
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
