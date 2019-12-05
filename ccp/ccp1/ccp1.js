var ccpDiv = document.getElementById("containerDiv");

var bCCP = document.getElementById("bCCP");
var bHold = document.getElementById("bHold");
var bMute = document.getElementById("bMute");
var bHangup = document.getElementById("bHangup");
var bCall = document.getElementById("bCall");
var bCall2 = document.getElementById("bCall2");
var pAlias = document.getElementById("alias");
var pStatus = document.getElementById("status");
var dialnum = document.getElementById("phonenumber");

window.myCPP = window.myCPP || {};
window.myCPP.agent = window.myCPP.agent || null;

var alias = "janssen-na-fras-qa";
pAlias.innerHTML = alias;



var idpUrl = `https://sso.connect.pingidentity.com/sso/sp/initsso?saasid=1b7ae09e-ca9b-4a29-ad27-f4e325fce893&idpid=7f5c3f99-306a-48c4-9247-82f6e16f3a44&appurl=https%3A%2F%2Fus-east-1.console.aws.amazon.com%2Fconnect%2Ffederate%2Fe9f556c8-c6e4-4adc-9977-de9e2ee0ca36%3Fdestination%3D%2Fconnect%2Fccp%23%2F`;

var ccpUrl = `https://janssen-na-fras-qa.awsapps.com/connect/ccp#/`;
var loginUrl = `https://janssen-na-fras-qa.awsapps.com/connect/login`;
var logoutUrl = `https://janssen-na-fras-qa.awsapps.com/connect/logout`;


var loginwindow = null;

window.onload = function () {
    if (!window.myCPP.agent) {
        pStatus.innerHTML = "Login Needed";
        loginwindow = window.open(idpUrl, 'Custom CCP', 'width=450, height=600');
    }
};



ccpDiv.style.visibility = 'hidden';
bCCP.onclick = function () {
    ccpDiv.style.visibility = (ccpDiv.style.visibility == 'visible') ? 'hidden' : 'visible';
    ccpDiv.style.display = 'block';
}

ccpStateNotReady();

bHold.onclick = function () {
    toggleHold();
}

bHangup.onclick = function () {
    disconnectContact();
}

bMute.onclick = function () {
    if (bMute.innerHTML == "mute") {
        window.myCPP.agent.mute();
    } else {
        window.myCPP.agent.unmute();
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

//bCall2.onclick = function () {
//    //var a = document.getElementById("bCall2");
//    var b = this.firstElementChild;
//    var c = b.innerHTML;
//    outboundcall(c);
//}

bCall.onclick = function () {
    if (dialnum.value.length > 0) {
        if (!dialnum.value.startsWith("+1")) {
            dialnum.value = "+1" + dialnum.value
        }
        if (!dialnum.value.startsWith("+")) {
            dialnum.value = "+" + dialnum.value
        }
        outboundcall(dialnum.value);
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
    loginwindow.close();
    loginwindow = null;
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


//================================================

function outboundcall(phonenum) {
    var obqueue = window.myCPP.agent.getRoutingProfile().defaultOutboundQueue;
    var qarn = obqueue.queueARN;
    var endpoint = connect.Endpoint.byPhoneNumber(phonenum);
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
