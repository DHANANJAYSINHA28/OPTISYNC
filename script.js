/* =====================================================
   SMART GLASS DASHBOARD
   STEP 2 — REAL ESP32 WEBSOCKET CONNECTION
   =====================================================

   DATA FLOW:

   WEBSITE
      ↓
   Wi-Fi
      ↓
   WebSocket
      ↓
   ESP32-C3
      ↓
   OLED 128x64


   ESP32 WebSocket:
   ws://ESP32_IP:81

   Example:
   ws://10.22.95.175:81
   ===================================================== */


/* =====================================================
   ELEMENTS
   ===================================================== */

// Message editor
const messageInput =
    document.getElementById("messageInput");

const characterCount =
    document.getElementById("characterCount");


// Live browser preview
const previewText =
    document.getElementById("previewText");


// Message buttons
const sendBtn =
    document.getElementById("sendBtn");

const clearBtn =
    document.getElementById("clearBtn");


// Speed controls
const speedSlider =
    document.getElementById("speedSlider");

const speedValue =
    document.getElementById("speedValue");


// Font controls
const fontValue =
    document.getElementById("fontValue");


// Status
const previewStatus =
    document.getElementById("previewStatus");

const statusDot =
    document.getElementById("statusDot");

const connectionText =
    document.getElementById("connectionText");

const connectionSubtext =
    document.getElementById("connectionSubtext");

const deviceStatus =
    document.getElementById("deviceStatus");


// =====================================================
// NEW ESP32 CONNECTION ELEMENTS
// =====================================================

const esp32IP =
    document.getElementById("esp32IP");

const connectBtn =
    document.getElementById("connectBtn");

const disconnectBtn =
    document.getElementById("disconnectBtn");

const connectionBadge =
    document.getElementById("connectionBadge");

const websocketAddress =
    document.getElementById("websocketAddress");



/* =====================================================
   WEBSOCKET VARIABLES
   ===================================================== */

// This variable will contain our WebSocket connection
let socket = null;


// Current connection state
let isConnected = false;



/* =====================================================
   ESP32 IP ADDRESS
   ===================================================== */

// Get IP address from input box
function getESP32IP() {

    return esp32IP.value.trim();

}



/* =====================================================
   UPDATE WEBSOCKET ADDRESS
   ===================================================== */

// Whenever IP changes, update the displayed
// WebSocket address.

function updateWebSocketAddress() {

    const ip =
        getESP32IP();

    if (ip === "") {

        websocketAddress.textContent =
            "ws://ESP32-IP:81";

        return;
    }


    websocketAddress.textContent =
        "ws://" + ip + ":81";

}


// Update address when user types
esp32IP.addEventListener(
    "input",
    updateWebSocketAddress
);



/* =====================================================
   CONNECT TO ESP32
   ===================================================== */

function connectESP32() {

    const ip =
        getESP32IP();


    // Check if IP is empty
    if (ip === "") {

        showStatus(
            "ENTER ESP32 IP",
            false
        );

        return;
    }


    // If an old connection exists,
    // close it first.

    if (socket) {

        socket.close();

        socket = null;
    }


    // Create WebSocket URL

    const websocketURL =
        "ws://" + ip + ":81";


    console.log(
        "Connecting to:",
        websocketURL
    );


    // Show connecting status

    connectionText.textContent =
        "CONNECTING...";

    connectionSubtext.textContent =
        "Connecting to ESP32-C3";

    deviceStatus.textContent =
        "Connecting...";

    connectionBadge.textContent =
        "CONNECTING";


    statusDot.style.background =
        "#d8b15a";


    previewStatus.textContent =
        "CONNECTING";


    // =================================================
    // CREATE WEBSOCKET CONNECTION
    // =================================================

    try {

        socket =
            new WebSocket(websocketURL);

    }

    catch (error) {

        console.error(
            "WebSocket creation error:",
            error
        );

        setDisconnected();

        return;
    }



    /* =================================================
       WEBSOCKET OPEN
       ================================================= */

    socket.onopen = function() {

        console.log(
            "WebSocket connected!"
        );


        isConnected = true;


        // Header
        connectionText.textContent =
            "DEVICE ONLINE";


        connectionSubtext.textContent =
            "ESP32-C3 connected";


        // Device panel
        deviceStatus.textContent =
            "Connected";


        // Connection badge
        connectionBadge.textContent =
            "CONNECTED";


        // Green status indicator
        statusDot.style.background =
            "#65d69a";


        // Preview
        previewStatus.textContent =
            "ESP32 CONNECTED";


        // Enable / disable buttons
        connectBtn.disabled =
            false;

        disconnectBtn.disabled =
            false;


        console.log(
            "ESP32 WebSocket connection established."
        );

    };



    /* =================================================
       WEBSOCKET MESSAGE
       ================================================= */

    socket.onmessage = function(event) {

        console.log(
            "ESP32:",
            event.data
        );


        // ESP32 sends this immediately after connection
        //
        // ESP32_CONNECTED

        if (
            event.data ===
            "ESP32_CONNECTED"
        ) {

            previewStatus.textContent =
                "DEVICE READY";

            return;
        }


        // If ESP32 sends anything else,
        // display it in the console.

    };



    /* =================================================
       WEBSOCKET ERROR
       ================================================= */

    socket.onerror = function(error) {

        console.error(
            "WebSocket error:",
            error
        );


        previewStatus.textContent =
            "CONNECTION ERROR";


        connectionSubtext.textContent =
            "Unable to reach ESP32";


        deviceStatus.textContent =
            "Connection error";

    };



    /* =================================================
       WEBSOCKET CLOSED
       ================================================= */

    socket.onclose = function() {

        console.log(
            "WebSocket disconnected."
        );


        setDisconnected();

    };

}



/* =====================================================
   DISCONNECT ESP32
   ===================================================== */

function disconnectESP32() {

    if (socket) {

        console.log(
            "Disconnecting..."
        );

        socket.close();

        socket = null;
    }

    else {

        setDisconnected();
    }

}



/* =====================================================
   DISCONNECTED STATE
   ===================================================== */

function setDisconnected() {

    isConnected = false;


    connectionText.textContent =
        "DEVICE OFFLINE";


    connectionSubtext.textContent =
        "Waiting for ESP32-C3";


    deviceStatus.textContent =
        "Not connected";


    connectionBadge.textContent =
        "DISCONNECTED";


    statusDot.style.background =
        "#9aa3b3";


    previewStatus.textContent =
        "DEVICE OFFLINE";


    disconnectBtn.disabled =
        true;

}



/* =====================================================
   CONNECT BUTTON
   ===================================================== */

if (connectBtn) {

    connectBtn.addEventListener(
        "click",
        connectESP32
    );

}



/* =====================================================
   DISCONNECT BUTTON
   ===================================================== */

if (disconnectBtn) {

    disconnectBtn.addEventListener(
        "click",
        disconnectESP32
    );

}



/* =====================================================
   MESSAGE INPUT
   ===================================================== */

messageInput.addEventListener(
    "input",
    () => {

        const text =
            messageInput.value;


        // Update character count

        characterCount.textContent =
            text.length;


        // Update browser preview

        if (
            text.trim() !== ""
        ) {

            previewText.textContent =
                text;

        }

        else {

            previewText.textContent =
                "YOUR MESSAGE";

        }

    }
);



/* =====================================================
   SEND MESSAGE TO ESP32
   ===================================================== */

sendBtn.addEventListener(
    "click",
    () => {

        const message =
            messageInput.value.trim();


        // Don't send empty messages

        if (message === "") {

            showStatus(
                "ENTER A MESSAGE",
                false
            );

            return;
        }


        // Update browser preview

        previewText.textContent =
            message;


        // =================================================
        // CHECK WEBSOCKET CONNECTION
        // =================================================

        if (
            !socket ||
            socket.readyState !== WebSocket.OPEN
        ) {

            showStatus(
                "ESP32 NOT CONNECTED",
                false
            );

            return;
        }


        // =================================================
        // SEND TEXT TO ESP32
        // =================================================
        //
        // ESP32 expects:
        //
        // TEXT:Hello World
        //
        // The ESP32 code removes "TEXT:"
        // and displays "Hello World".
        // =================================================

        const command =
            "TEXT:" + message;


        socket.send(command);


        console.log(
            "Sent:",
            command
        );


        previewStatus.textContent =
            "SENT TO GLASS";


        showStatus(
            "MESSAGE SENT",
            true
        );

    }
);



/* =====================================================
   CLEAR
   ===================================================== */

clearBtn.addEventListener(
    "click",
    () => {

        messageInput.value =
            "";

        characterCount.textContent =
            "0";

        previewText.textContent =
            "YOUR MESSAGE";

        previewStatus.textContent =
            "READY";

    }
);



/* =====================================================
   QUICK MESSAGES
   ===================================================== */

const quickButtons =
    document.querySelectorAll(
        ".quick-btn"
    );


quickButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const message =
                    button.dataset.message;


                // Put message into editor

                messageInput.value =
                    message;


                // Update character count

                characterCount.textContent =
                    message.length;


                // Update preview

                previewText.textContent =
                    message;


                previewStatus.textContent =
                    "MESSAGE READY";

            }
        );

    }
);



/* =====================================================
   SPEED CONTROL
   ===================================================== */

speedSlider.addEventListener(
    "input",
    () => {

        const speed =
            Number(speedSlider.value);


        // Update website display

        speedValue.textContent =
            speed + "%";


        // =================================================
        // SEND SPEED TO ESP32
        // =================================================
        //
        // Website speed = 1 to 100
        //
        // ESP32 speed = 1 to 10
        //
        // Convert 1-100 → 1-10
        // =================================================

        const espSpeed =
            Math.max(
                1,
                Math.min(
                    10,
                    Math.ceil(
                        speed / 10
                    )
                )
            );


        if (
            socket &&
            socket.readyState ===
            WebSocket.OPEN
        ) {

            const command =
                "SPEED:" + espSpeed;


            socket.send(command);


            console.log(
                "Sent:",
                command
            );

        }

    }
);



/* =====================================================
   TEXT SIZE
   ===================================================== */

const sizeButtons =
    document.querySelectorAll(
        ".size-btn"
    );


sizeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                // Remove active from all

                sizeButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                // Activate selected button

                button.classList.add(
                    "active"
                );


                const size =
                    button.dataset.size;


                let fontNumber;


                // =========================================
                // SMALL
                // =========================================

                if (
                    size === "small"
                ) {

                    previewText.style.fontSize =
                        "20px";

                    fontValue.textContent =
                        "Small";

                    fontNumber = 1;

                }


                // =========================================
                // MEDIUM
                // =========================================

                else if (
                    size === "medium"
                ) {

                    previewText.style.fontSize =
                        "28px";

                    fontValue.textContent =
                        "Medium";

                    fontNumber = 1;

                }


                // =========================================
                // LARGE
                // =========================================

                else if (
                    size === "large"
                ) {

                    previewText.style.fontSize =
                        "38px";

                    fontValue.textContent =
                        "Large";

                    fontNumber = 2;

                }


                // =========================================
                // SEND FONT SIZE TO ESP32
                // =========================================

                if (
                    socket &&
                    socket.readyState ===
                    WebSocket.OPEN
                ) {

                    const command =
                        "FONT:" + fontNumber;


                    socket.send(command);


                    console.log(
                        "Sent:",
                        command
                    );

                }

            }
        );

    }
);



/* =====================================================
   DISPLAY MODE
   ===================================================== */

const modeButtons =
    document.querySelectorAll(
        ".mode-btn"
    );


modeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                // Remove active state

                modeButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                // Activate selected mode

                button.classList.add(
                    "active"
                );


                const mode =
                    button.dataset.mode;


                // =========================================
                // STATIC MODE
                // =========================================

                if (
                    mode === "static"
                ) {

                    previewStatus.textContent =
                        "STATIC MODE";


                    if (
                        socket &&
                        socket.readyState ===
                        WebSocket.OPEN
                    ) {

                        socket.send(
                            "MODE:STATIC"
                        );

                    }

                }


                // =========================================
                // SCROLL MODE
                // =========================================

                else {

                    previewStatus.textContent =
                        "SCROLL MODE";


                    if (
                        socket &&
                        socket.readyState ===
                        WebSocket.OPEN
                    ) {

                        socket.send(
                            "MODE:SCROLL"
                        );

                    }

                }

            }
        );

    }
);



/* =====================================================
   PLAY BUTTON
   ===================================================== */

startBtn.addEventListener(
    "click",
    () => {

        previewStatus.textContent =
            "PLAYING";


        // Send PLAY to ESP32

        if (
            socket &&
            socket.readyState ===
            WebSocket.OPEN
        ) {

            socket.send(
                "PLAY"
            );


            console.log(
                "Sent: PLAY"
            );

        }

        else {

            showStatus(
                "ESP32 NOT CONNECTED",
                false
            );

        }

    }
);



/* =====================================================
   PAUSE BUTTON
   ===================================================== */

pauseBtn.addEventListener(
    "click",
    () => {

        previewStatus.textContent =
            "PAUSED";


        // Send PAUSE to ESP32

        if (
            socket &&
            socket.readyState ===
            WebSocket.OPEN
        ) {

            socket.send(
                "PAUSE"
            );


            console.log(
                "Sent: PAUSE"
            );

        }

        else {

            showStatus(
                "ESP32 NOT CONNECTED",
                false
            );

        }

    }
);



/* =====================================================
   RESET BUTTON
   ===================================================== */

resetBtn.addEventListener(
    "click",
    () => {

        previewStatus.textContent =
            "READY";


        // Send RESET to ESP32

        if (
            socket &&
            socket.readyState ===
            WebSocket.OPEN
        ) {

            socket.send(
                "RESET"
            );


            console.log(
                "Sent: RESET"
            );

        }

        else {

            showStatus(
                "ESP32 NOT CONNECTED",
                false
            );

        }

    }
);



/* =====================================================
   STATUS FUNCTION
   ===================================================== */

function showStatus(
    message,
    success
) {

    previewStatus.textContent =
        message;


    if (success) {

        previewStatus.style.color =
            "#b7c0ce";

    }

    else {

        previewStatus.style.color =
            "#d0a5a5";

    }

}



/* =====================================================
   KEYBOARD SHORTCUTS
   ===================================================== */

// Ctrl + Enter
// Send message

messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            sendBtn.click();

        }

    }
);



/* =====================================================
   INITIALIZATION
   ===================================================== */

// Show correct WebSocket address
updateWebSocketAddress();


// Start disconnected
setDisconnected();


console.log(
    "Smart Glass Dashboard loaded."
);

console.log(
    "Enter ESP32 IP and click CONNECT."
);