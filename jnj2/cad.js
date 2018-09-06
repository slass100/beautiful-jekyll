

            window.myCPP = window.myCPP || {};
            //var ccpUrl = "https://atosjnjsandbox.awsapps.com/connect/ccp#/";
            var ccpUrl = "https://jnj-gsd-na.awsapps.com/connect/ccp#/";
            //var agentMsgs = document.getElementById("agentMsgs");
            //var historyMsgs = document.getElementById("historyMsgs");
            //var logMsgs = document.getElementById("logMsgs");
            //var openURLCB = document.getElementById("openURL");
            //var url1 = document.getElementById("url1");

            console.log("LOG LOG");
            connect.core.initCCP(containerDiv, {
                ccpUrl: ccpUrl,
                loginPopup: true,
                softphone: {
                    allowFramedSoftphone: true
                }
            });
            connect.contact(subscribeToContactEvents);
            function subscribeToContactEvents(contact) {
                window.myCPP.contact = contact;
                logMsgToScreen("Subscribing to events for contact");
                if (contact.getActiveInitialConnection()
                        && contact.getActiveInitialConnection().getEndpoint()) {
                    var phonestr = contact.getActiveInitialConnection().getEndpoint().phoneNumber.toString()
                    logMsgToScreen("New contact is from " + phonestr);
                    displayMsgToAgent("Calling: " + phonestr);
                    window.VUE.currentCall.number = phonestr;
                } else {
                    logMsgToScreen("This is an existing contact for this agent");
                }
                var timestr = new Date().toLocaleString();
                window.VUE.currentCall.time = timestr;
                var queuestr = contact.getQueue().name.toString();
                logMsgToScreen("Contact is from queue " + queuestr);
                displayMsgToAgent("Queue: " + queuestr);
                window.VUE.currentCall.queue = queuestr;
                logMsgToScreen("Contact attributes are " + JSON.stringify(contact.getAttributes()));
                var ca = contact.getAttributes();
                window.wwid = "unknown";
                if (ca && ca.WWID) {
                    window.wwid = ca.WWID.value;
                }
                displayMsgToAgent("WWID: " + window.wwid);
                window.VUE.currentCall.wwid = window.wwid;
                window.url = "unknown";
                if (ca && ca.URL) {
                    window.url = ca.URL.value;
                }
                window.VUE.currentCall.snow = window.url;
                logMsgToScreen("URL: " + window.url);
                window.topic = "unknown";
                if (ca && ca.Topic) {
                    window.topic = ca.Topic.value;
                }
                window.VUE.currentCall.topic = window.topic;
                logMsgToScreen("Topic: " + window.topic);               
                //setURL1("<a href='" + window.url +"'>" + window.url + "</a>");
                contact.onRefresh(eventContactRefresh);
                contact.onIncoming(eventContactIncoming);
                contact.onAccepted(eventContactAccepted);
                contact.onConnected(eventContactConnected);
                contact.onEnded(eventContactEnded);
                //displayMsgToAgent('Open URLs in new tab');
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
                console.log(window.url);
                //if (openURLCB.checked) {
                //  window.open(window.url);
                //}

            }
            function eventContactConnected(contact) {
                logMsgToScreen("[contact.onContactConnected] " + contactToString(contact));
                if (contact) {
                    displayMsgToHistory(contact.getQueue().name + ": " + contact.getAttributes().CustomerNumber.value);
                }
            }
            function eventContactEnded(contact) {
                logMsgToScreen("[contact.onEnded] " + contactToString(contact));
                window.VUE.callHistory.unshift({
                    time: window.VUE.currentCall.time,
                    wwid: window.VUE.currentCall.wwid,
                    number: window.VUE.currentCall.number,
                    queue: window.VUE.currentCall.queue,
                    topic: window.VUE.currentCall.topic,
                    snow: window.VUE.currentCall.snow
                });
                window.VUE.callHistory.pop();
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



            connect.agent(subscribeToAgentEvents);
            function subscribeToAgentEvents(agent) {
                window.myCPP.agent = agent;
                console.log('Hi ' + agent.getName() + ' !')
                //agentMsgs.innerHTML = 'Hi ' + agent.getName() + ' !\n';
                window.VUE.userInfo.name = agent.getName()
                logMsgToScreen("Subscribing to events for agent " + agent.getName());
                logMsgToScreen("Agent is currently in status of " + agent.getStatus().name);
                agent.onRefresh(eventAgentRefresh);
                agent.onRoutable(eventAgentRoutable);
                agent.onNotRoutable(eventAgentNotRoutable);
                agent.onOffline(eventAgentOffline);
                agent.onError(eventAgentError);
                agent.onAfterCallWork(eventAfterCallWork);
            }
            function eventAgentRefresh(agent) {
                //logMsgToScreen("[agent.onRefresh] " + agentToString(agent));
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


            function displayMsgToHistory(msg) {
                console.log("hist: " + msg);
                //historyMsgs.innerHTML = '' + new Date().toLocaleTimeString() + ' ' + String(msg) + "\n" + String(historyMsgs.innerHTML);
            }

            
            function displayMsgToAgent(msg) {
                console.log("dta: " + msg);
                //agentMsgs.innerHTML = "" + String(agentMsgs.innerHTML) + String(msg) + "\n";
            }

            function logMsgToScreen(msg) {
                console.log('lmts: ' + msg);
                //logMsgs.innerHTML =  logMsgs.innerHTML + new Date().toLocaleTimeString() + ' ' + msg + '\n';
            }

            //function logInfoMsg(msg) {
            //    console.log('lim: ' + msg);
            //    connect.getLog().info(msg);
            //    logMsgToScreen(msg);
            //}
            //function logInfoEvent(eventMsg) {
            //    console.log('lie: ' + msg);
            //    connect.getLog().info(eventMsg);
            //}
            function displayAgentStatus(status) {
                console.log('displayAgentStatus: ' + msg);
                //eventMsgs.innerHTML = 'Status: ' + status;
            }

            function clearAgentDisplay() {
                console.log('clearAgentDisplay: ');             
                //agentMsgs.innerHTML = "";
            }
            function setURL1(msg) {
                console.log('clearAgentDisplay: ');     
                //url1.innerHTML = msg;
            }
