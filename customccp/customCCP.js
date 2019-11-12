function loadCCP() {
    $("#navbar-frame").load("navbar.html");

    //Connect CCP Integration
    var container = document.getElementById("ccpContainer");
    var instanceAlias = alias;
    var loginURL = `https://${instanceAlias}.awsapps.com/connect/login`;
    var logoutURL = `https://${instanceAlias}.awsapps.com/connect/logout`;
    var instanceHome = `https://${instanceAlias}.awsapps.com/connect/home`;
    var ccpURL = `https://${alias}.awsapps.com/connect/ccp`;
    var agentMetricsURL = `https://${alias}.awsapps.com/connect/real-time-metrics?tableType=user`;
    var loginWindow;
    window.isMuted = false;
    window.ccp = window.ccp || {};
    connect.core.initCCP(container, {
        ccpUrl: ccpURL,
        loginPopup: false,
        softphone: {
            allowFramedSoftphone: true,
            disableRingtone: false
        }
    });
    connect.core.getEventBus().subscribe(connect.EventType.ACK_TIMEOUT, function () {
        try {
            connect.getLog().warn("ACK_TIMEOUT occurred, attempting to pop the login page.");
            var width = 500;
            var height = 600;
            var left = (screen.width / 2) - (width / 2);
            var top = (screen.height / 2) - (height / 2);

            loginWindow = window.open(loginURL, true, "width=" + width + ",height=" + height + ",menubar=no,status=no,toolbar=no,left=" + left + ",top=" + top);
        } catch (e) {
            connect.getLog().error("ACK_TIMEOUT occurred but we are unable to open the login popup." + e).withException(e);
        }

        connect.core.getEventBus().subscribe(connect.EventType.ACKNOWLEDGE, function () {
            closeLoginWindow();
        });

    });

    function logOut() {
        var width = 500;
        var height = 600;
        var left = (screen.width / 2) - (width / 2);
        var top = (screen.height / 2) - (height / 2);
        var sourceURL = window.location.href;

        logoutWindow = window.open(logoutURL, true, "width=" + width + ",height=" + height + ",menubar=no,status=no,toolbar=no,left=" + left + ",top=" + top);
        logoutWindow.close();
        console.log("closed the window");
        newWindow = window.location.replace(`/logout.html?sourceURL=${sourceURL}`);
    }

    function closeLoginWindow() {
        loginWindow.close();
        $('#logoutButton').show();
    }



    //Subscribe to Agent Events from streams-API, and handle agent events
    connect.agent((agent) => {
        $('#logoutButton').show();
        window.ccp.agent = agent;
        document.getElementById("agentName").innerHTML = agent.getName();
        document.getElementById("routingProfile").innerHTML = agent.getRoutingProfile().name;
        document.getElementById("showQueueList").value = `Show ${agent.getName()}'s Queues`;
        document.getElementById("hideQueueList").value = `Hide ${agent.getName()}'s Queues`;
        getRoutingProfileDetails(agent.getRoutingProfile());
        agent.onStateChange(agentStateChange);
        agent.onRefresh(agentRefresh);
        agent.onRoutable(agentRoutable);
        agent.onNotRoutable(agentNotRoutable);
        agent.onOffline(agentOffline);

        //Setup nav-bar action buttons
        //Handle Agent Logout Requests
        $("#logoutButton").click(() => {
            goOfflineLogout();
        });

        $("#goReady").click(() => {
            goAvailable();
        });

        //pop-native CCP
        $("#nativeCCP").click(() => {
            openNativeCCP();
        });

        //Open Agent Metrics Page
        $("#agentMetrics").click(() => {
            openAgentMetrics();
        });
    });

    function goOfflineLogout() {
        var offlineState = window.ccp.agent.getAgentStates().filter(function (state) {
            return state.type === connect.AgentStateType.OFFLINE;
        })[0];
        window.ccp.agent.setState(offlineState, {
            success: function () {
                console.log("Set agent status to Offline via Streams");
                logOut();
            },
            failure: function () {
                console.log("Failed to set agent status to Offline via Streams");
            }
        });
    }

    function openNativeCCP() {
        var width = 320;
        var height = 468;
        var left = (screen.width / 2) - (width / 2);
        var top = (screen.height / 2) - (height / 2);


        ccpWindow = window.open(ccpURL, true, "width=" + width + ",height=" + height + ",menubar=no,status=no,toolbar=no,left=" + left + ",top=" + top);
    }

    function openAgentMetrics() {
        agentMetricsWindow = window.open(agentMetricsURL, false);
    }

    function goAvailable() {
        var availableState = window.ccp.agent.getAgentStates().filter(function (state) {
            return state.type === connect.AgentStateType.ROUTABLE;
        })[0];


        var allStates = window.ccp.agent.getAgentStates();


        window.ccp.agent.setState(availableState, {
            success: function () {
                console.log("Set agent status to available via Streams");

            },
            failure: function (data) {
                console.log(data);
                console.log("Failed to set agent status to available via Streams");
            }
        });
    }

    function agentStateChange(agent) {
        console.log("in the agentStateChange function: Agent went from " + agent.oldState + " state to " + agent.newState);
        document.getElementById("agentStatus").innerHTML = agent.newState;
        fillStatusDropDown();



        if (agent.oldState === 'AfterCallWork' && agent.newState === 'Available') {

            document.getElementById("contactDetails").reset();
            document.getElementById('updateNameImg').src = "../assets/sync.svg";

            document.getElementById("phoneNumber").innerHTML = "";

            document.getElementById('custWaitTime').style.display = 'none';

            document.getElementById('custWaitTimeSpan').innerHTML = '';


            $('#visibleQueueList').hide();
            $('#hiddenQueueList').show();
            $('#visibleAttributes').hide();
            $('#hiddenAttributes').show();

            $('#attributes').DataTable().clear().draw();
        }

        if (agent.newState === 'Available') {

            document.getElementById("goReady").innerHTML = "I'M READY!";

            document.getElementById('custWaitTime').style.display = 'none';
            document.getElementById("contactDetails").reset();
            document.getElementById('updateNameImg').src = "../assets/sync.svg";
            document.getElementById('custWaitTimeSpan').innerHTML = '';
            document.getElementById('phoneNumber').innerHTML = '';
            $('#visibleAttributes').hide();
            $('#hiddenAttributes').show();
            $('#attributes').DataTable().clear().draw();
        }

        if (agent.newState != 'PendingBusy' & agent.newState != 'Available' & agent.newState != 'Busy') {
            document.getElementById("goReady").innerHTML = "LET'S GO!";


        }
        if (agent.newState != 'PendingBusy' & agent.newState != 'Busy' & agent.newState != 'FailedConnectCustomer' & agent.newState != 'AfterCallWork' & agent.newState != 'MissedCallAgent') {

            var newState = window.ccp.agent.getAgentStates().filter(function (state) {
                return state.name === agent.newState;
            })[0];

            if (newState) {
                document.getElementById("agentStatusDropdown").value = newState.agentStateARN;
                $('#agentStatusDropdown').niceSelect('update');
            }
            document.getElementById("agentStatusDropdown").value = newState.agentStateARN;
            $('#agentStatusDropdown').niceSelect('update');

        }

        if (agent.newState == 'error' & agent.newState == 'FailedConnectCustomer') {
            goAvailable();
        }

    }

    function agentRefresh(agent) {
        getRoutingProfileDetails(agent.getRoutingProfile());
        console.log("in the agentRefresh function: " + agent.getName() + " has refreshed");
    }

    function agentRoutable(agent) {
        console.log("in the agentRoutable function: " + agent.getName() + " is now routable");
    }

    function agentNotRoutable(agent) {
        console.log("in the agentNotRoutable function: " + agent.getName() + " is now not routable");
    }

    function agentOffline(agent) {
        console.log("in the agentOffline function: " + agent.getName() + " is now offline");
    }

    function getRoutingProfileDetails(routingProfile) {
        var queueList = routingProfile.queues;
        fillQueuesTable(queueList);
    }


    function goOffline() {
        var offlineState = window.ccp.agent.getAgentStates().filter(function (state) {
            return state.type === connect.AgentStateType.OFFLINE;
        })[0];
        window.ccp.agent.setState(offlineState, {
            success: function () {
                console.log("Set agent status to Offline via Streams");

            },
            failure: function () {
                console.log("Failed to set agent status to Offline via Streams");
            }
        });
    }


    function changeAgentState(myStateARN) {

        var newState = window.ccp.agent.getAgentStates().filter(function (state) {


            return state.agentStateARN === myStateARN;
        })[0];


        window.ccp.agent.setState(newState, {
            success: function () {
                console.log("Set agent status to available via Streams");

            },
            failure: function (data) {
                console.log(data);
                console.log("Failed to set agent status to available via Streams");
            }
        });
    }

    $('#agentStatusDropdown').change(function () {
        //Use $option (with the "$") to see that the variable is a jQuery object
        var $option = $(this).find('option:selected');
        //Added with the EDIT
        var stateARN = $option.val(); //to get content of "value" attrib

        var stateName = $option.text(); //to get <option>Text</option> content

        changeAgentState(stateARN);


    });


    function fillStatusDropDown() {
        let dropdown = $('#agentStatusDropdown');
        let allStates = window.ccp.agent.getAgentStates();
        dropdown.empty();

        dropdown.append('<option selected="true" disabled>Set Agent State</option>');
        dropdown.prop('selectedIndex', 0);
        $.each(allStates, function (key, entry) {

            dropdown.append($('<option></option>').attr('value', entry.agentStateARN).text(entry.name));
        });

        $('#agentStatusDropdown').niceSelect();

    }

   function muteButton(){
   console.log("isMuted is set to: " +isMuted);
   if (window.isMuted){
   window.ccp.agent.unmute();
   document.getElementById("answerCall").innerHTML = "Mute Agent";
   window.isMuted = false;
   }

      else{
         window.ccp.agent.mute();
         document.getElementById("answerCall").innerHTML = "Unmute Agent";
         window.isMuted = true;
      }

   }

    //Subscribe to Contact Events from streams-API, and handle Contact  events
    connect.contact((contact) => {
        window.ccp.contact = contact;
        console.log("Subscribing to events for contact");
        if (contact.getActiveInitialConnection() && contact.getActiveInitialConnection().getEndpoint()) {
            console.log("New contact is from " + contact.getActiveInitialConnection().getEndpoint().phoneNumber);
        } else {
            console.log("This is an existing contact for this agent");
        }

        contact.onIncoming(contactIncoming);
        contact.onConnecting(contactConnecting);
        contact.onAccepted(contactAccepted);
        contact.onConnected(contactConnected);
        contact.onEnded(contactEnded);
        contact.onRefresh(contactRefreshed);



    });


    function contactIncoming(contact) {
        console.log("incoming contact show the answer button");

    }

    function contactRefreshed(contact) {
        console.log("contact refreshed");
        getContactAttributes(contact);
    }

    function contactConnecting(contact) {
        var c1 = contact.getConnections()[1];
        var isInbound = contact.isInbound();
        document.getElementById("contactID").value = contact.contactId;
        document.getElementById("phoneNumber").innerHTML = c1.getAddress().phoneNumber;
        getContactAttributes(contact);
         console.log(`isInbound value is ${isInbound}`);

         if(isInbound){
            console.log("Contact is an incoming call");
            document.getElementById("answerCall").innerHTML = "Answer";
            $('#answerCall').show();
            $('#rejectCall').show();
            $("#answerCall").click(() => {
            acceptContact();
             });

            $("#rejectCall").click(() => {
            rejectCall();
             });
         }else{
            console.log("Contact is an outbound call");
         }

    }

    function acceptContact() {
        window.ccp.contact.accept({
            success: function () {
                console.log("Got success on accept contact via Streams");
               $('#answerCall').off(); 
               $('#answerCall').hide();

            },
            failure: function () {
                console.log("Failed to accept contact via Streams");
            }
        });
    }

    function contactAccepted(contact) {
        console.log("incoming contact has been accepted");
        $('#rejectCall').hide();
        $('#answerCall').hide();



        console.log("Accepted contact via Streams");

    }

    function contactConnected(contact) {
        console.log("contact has been answered");
        getContactAttributes(contact);
         document.getElementById("endContact").innerHTML = "Hang-UP";
         document.getElementById("answerCall").innerHTML = "Mute Agent";
         
        $('#endContact').show();
        $('#answerCall').show();         
        $("#endContact").click(() => {
            disconnectContact();
        });
         $("#answerCall").click(() => {
            muteButton();
        });

    }

    function disconnectContact() {
        console.log("in the disconnect contact function");
        //cannot do contact.destroy(), can only destroy (hang-up) agent connection
        window.ccp.contact.getAgentConnection().destroy({
            success: function () {
                $('#endContact').hide();
                $('#answerCall').off();
                $('#answerCall').hide();

                console.log("Disconnected contact via Streams");
            },
            failure: function () {
                console.log("Failed to disconnect contact via Streams");
            }
        });
    }

    function contactEnded(contact) {
        if (contact) {
            console.log("Contact has ended. Contact state is " + contact.getStatus().type);
            $('#endContact').hide();
            $('#answerCall').off();
            $('#answerCall').hide();
            $('#rejectCall').hide();
        } else {
            console.log("Contact has ended. Null contact passed to event handler");
        }
    }

    function rejectCall() {
        console.log("trying to reject the call");
        //cannot do contact.destroy(), can only destroy (hang-up) agent connection
        window.ccp.contact.getAgentConnection().destroy({
            success: function () {
                goOffline();
                $('#rejectCall').hide();
                $('#endContact').hide();
                console.log("Disconnected contact via Streams");
            },
            failure: function () {
                console.log("Failed to disconnect contact via Streams");
            }
        });
    }





    function getContactAttributes(contact) {
        var attributes = contact.getAttributes();
        if (attributes.customerWaitTime) {
            var waitTimeInSeconds = parseInt(attributes.customerWaitTimeInSecs.value);

            if (waitTimeInSeconds > 30) {
                document.getElementById('custWaitTimeSpan').innerHTML = `${attributes.customerWaitTime.value} <i class="fa fa-warning" style="font-size:15px;color: #ff9933"></i>`;

            } else {
                document.getElementById('custWaitTimeSpan').innerHTML = `${attributes.customerWaitTime.value} <i class="fa fa-check" style="font-size:15px;color:green"></i>`;

            }

            document.getElementById('custWaitTime').style.display = '';
        }

        if (attributes.firstName) {
            document.getElementById("firstName").value = attributes.firstName.value;
        }
        if (attributes.lastName) {
            document.getElementById("lastName").value = attributes.lastName.value;
        }
        fillAttributesTable(attributes);
    }


    //Create table to show attributes
    var attributesTable;
    $(document).ready((a) => {
        attributesTable = $('#attributes').DataTable({
            columns: [{
                    title: "Name"
                },
                {
                    title: "Value"
                }
            ],
            paging: false,
            info: false,
            searching: false
        });
        $("#showAttributes").click(() => {
            $('#visibleAttributes').show();
            $('#hiddenAttributes').hide();
        });
        $("#hideAttributes").click(() => {
            $('#visibleAttributes').hide();
            $('#hiddenAttributes').show();
        });

    });

    //Populate attribute table with new contact attributes
    var fillAttributesTable = (attributes) => {
        attributesTable.clear();
        for (var k in attributes) {
            var value = attributes[k].value;
            if (value.startsWith("http")) {
                value = '<a target="_blank" href="' + value + '">' + value + '</a>';
            }
            attributesTable.row.add([k, value]);
        }
        attributesTable.draw();
    };

    //Create table to show assigned queues
    var queueTable;
    $(document).ready((a) => {
        queueTable = $('#queueList').DataTable({
            columns: [{
                title: "Queue Name:"
            }],
            paging: false,
            info: false,
            searching: false
        });

        $("#showQueueList").click(() => {

            $('#visibleQueueList').show();
            $('#hiddenQueueList').hide();
        });
        $("#hideQueueList").click(() => {
            $('#visibleQueueList').hide();
            $('#hiddenQueueList').show();
        });

    });

    //Populate queue table with agent queues from routing profile
    var fillQueuesTable = (queueList) => {
        queueTable.clear();
        for (var k in queueList) {
            var queueName = queueList[k].name;
            queueTable.row.add(["&nbsp&nbsp&nbsp" + queueName]);
        }
        queueTable.draw();
    };

    /* attach a submit handler to the form */
    $("#contactDetails").submit(function (event) {

        /* stop form from submitting normally */
        event.preventDefault();

        var body = {
            "function Name": "Update Name",
            "functionID": "10",
            "phoneNumber": document.getElementById("phoneNumber").innerHTML,
            "firstName": document.getElementById("firstName").value,
            "lastName": document.getElementById("lastName").value,
        };

        var posting = $.ajax({
                url: "https://myvvhs8lgj.execute-api.us-east-1.amazonaws.com/prod/",
                method: "POST",
                data: JSON.stringify(body)
            })
            .done(function (msg) {
                var serverResultObject = JSON.stringify(msg);
                var serverResult = JSON.parse(serverResultObject);
                var statusCode = serverResult.statusCode;

                if (statusCode == 200) {
                    document.getElementById('updateNameImg').src = "../assets/checkmark.png";
                    console.log("Name Updated Successfully");

                } else {
                    console.log("Server said: " + JSON.parse(msg.body).message);
                }

            })
            .fail(function (msg) {
                console.log("Failed with response: " + JSON.stringify(msg));
            });

    });



}
$(document).ready(loadCCP);
