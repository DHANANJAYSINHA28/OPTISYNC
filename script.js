/* =====================================================
   OPTISYNK SMART GLASS DASHBOARD
   ESP32-C3 OLED CONTROLLER

   WEBSITE
      ↓
   Wi-Fi
      ↓
   WebSocket
      ↓
   ESP32-C3
      ↓
   OLED 128x64

   IMPORTANT:
   The website DOES NOT mirror or control
   the OLED scrolling position.

   ESP32 handles scrolling independently.
   ===================================================== */


/* =====================================================
   ELEMENTS
   ===================================================== */

// Message editor
const messageInput =
    document.getElementById("messageInput");

const characterCount =
    document.getElementById("characterCount");


// Browser preview
const previewText =
    document.getElementById("previewText");


// Message buttons
const sendBtn =
    document.getElementById("sendBtn");

const clearBtn =
    document.getElementById("clearBtn");


// Speed
const speedSlider =
    document.getElementById("speedSlider");

const speedValue =
    document.getElementById("speedValue");


// Font
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


// ESP32 connection
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


// Playback buttons
const startBtn =
    document.getElementById("startBtn");

const pauseBtn =
    document.getElementById("pauseBtn");

const resetBtn =
    document.getElementById("resetBtn");



/* =====================================================
   WEBSOCKET
   ===================================================== */

let socket = null;

let isConnected = false;


/*
 * Used for live typing.
 *
 * We KEEP live sending.
 */
let typingTimer = null;



/* =====================================================
   GET ESP32 IP
   ===================================================== */

function getESP32IP() {

    return esp32IP.value.trim();

}



/* =====================================================
   UPDATE WEBSOCKET ADDRESS
   ===================================================== */

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


esp32IP.addEventListener(
    "input",
    updateWebSocketAddress
);



/* =====================================================
   SEND TEXT TO ESP32
   ===================================================== */

function sendTextToESP32() {

    if (
        !socket ||
        socket.readyState !== WebSocket.OPEN
    ) {

        console.log(
            "ESP32 not connected - text not sent"
        );

        return false;
    }


    const text =
        messageInput.value;


    if (text.trim() === "") {

        return false;
    }


    /*
     * Send ONLY the text.
     *
     * ESP32 handles:
     * wrapping
     * scrolling
     * display
     */

    const command =
        "TEXT:" + text;


    socket.send(command);


    console.log(
        "TEXT SENT TO ESP32:",
        command
    );


    return true;
}



/* =====================================================
   CONNECT ESP32
   ===================================================== */

function connectESP32() {

    const ip =
        getESP32IP();


    if (ip === "") {

        showStatus(
            "ENTER ESP32 IP",
            false
        );

        return;
    }


    /*
     * Close old connection
     */

    if (socket) {

        try {

            socket.close();

        }

        catch (error) {

            console.log(
                "Old socket close error:",
                error
            );

        }

        socket = null;
    }


    const websocketURL =
        "ws://" + ip + ":81";


    console.log(
        "Connecting to:",
        websocketURL
    );


    /*
     * UI
     */

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


    /*
     * Create WebSocket
     */

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
       SOCKET OPEN
       ================================================= */

    socket.onopen = function() {

        console.log(
            "ESP32 WebSocket CONNECTED"
        );


        isConnected = true;


        connectionText.textContent =
            "DEVICE ONLINE";

        connectionSubtext.textContent =
            "ESP32-C3 connected";

        deviceStatus.textContent =
            "Connected";

        connectionBadge.textContent =
            "CONNECTED";

        statusDot.style.background =
            "#65d69a";

        previewStatus.textContent =
            "DEVICE READY";


        connectBtn.disabled =
            false;

        disconnectBtn.disabled =
            false;


        /*
         * IMPORTANT FIX
         *
         * If the user typed/pasted text
         * BEFORE connecting, send it now.
         */

        setTimeout(
            () => {

                if (
                    socket &&
                    socket.readyState ===
                    WebSocket.OPEN
                ) {

                    if (
                        messageInput.value.trim() !== ""
                    ) {

                        sendTextToESP32();

                        previewStatus.textContent =
                            "TEXT SENT TO ESP32";

                    }

                }

            },
            100
        );

    };



    /* =================================================
       ESP32 MESSAGE
       ================================================= */

    socket.onmessage = function(event) {

        const data =
            event.data;


        console.log(
            "ESP32:",
            data
        );


        if (
            typeof data !== "string"
        ) {

            return;
        }


        /*
         * We ONLY care about connection
         * confirmation.
         *
         * NO SYNC.
         * NO OLED MIRROR.
         * NO SCROLL POSITION.
         */

        if (
            data ===
            "ESP32_CONNECTED"
        ) {

            previewStatus.textContent =
                "DEVICE READY";

            return;
        }

    };



    /* =================================================
       ERROR
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
       CLOSED
       ================================================= */

    socket.onclose = function() {

        console.log(
            "ESP32 WebSocket DISCONNECTED"
        );


        setDisconnected();

    };

}



/* =====================================================
   DISCONNECT
   ===================================================== */

function disconnectESP32() {

    if (socket) {

        console.log(
            "Disconnecting ESP32..."
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
   LIVE MESSAGE INPUT
   ===================================================== */

/*
 * This is KEPT.
 *
 * When user types/pastes:
 *
 * WEBSITE → TEXT → ESP32
 *
 * But the website does NOT mirror
 * the OLED scroll.
 */

messageInput.addEventListener(
    "input",
    () => {

        const text =
            messageInput.value;


        /*
         * Character count
         */

        characterCount.textContent =
            text.length;


        /*
         * Normal browser preview.
         *
         * This is just an editor preview.
         * It is NOT synchronized with OLED.
         */

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


        /*
         * Reset browser preview position.
         */

        previewText.style.transform =
            "translateY(0px)";


        /*
         * Debounce live sending.
         */

        clearTimeout(
            typingTimer
        );


        typingTimer =
            setTimeout(
                () => {

                    if (
                        !socket ||
                        socket.readyState !==
                        WebSocket.OPEN
                    ) {

                        console.log(
                            "ESP32 not connected - waiting"
                        );

                        return;
                    }


                    sendTextToESP32();


                    previewStatus.textContent =
                        "TEXT SENT TO ESP32";

                },
                80
            );

    }
);



/* =====================================================
   SEND BUTTON
   ===================================================== */

sendBtn.addEventListener(
    "click",
    () => {

        const message =
            messageInput.value.trim();


        if (message === "") {

            showStatus(
                "ENTER A MESSAGE",
                false
            );

            return;
        }


        if (
            !socket ||
            socket.readyState !==
            WebSocket.OPEN
        ) {

            showStatus(
                "ESP32 NOT CONNECTED",
                false
            );

            return;
        }


        /*
         * Cancel pending live-send timer.
         */

        clearTimeout(
            typingTimer
        );


        sendTextToESP32();


        previewText.textContent =
            message;

        previewText.style.transform =
            "translateY(0px)";


        previewStatus.textContent =
            "TEXT SENT TO ESP32";


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

        previewText.style.transform =
            "translateY(0px)";

        previewStatus.textContent =
            "READY";


        clearTimeout(
            typingTimer
        );

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


                messageInput.value =
                    message;


                characterCount.textContent =
                    message.length;


                previewText.textContent =
                    message;


                previewText.style.transform =
                    "translateY(0px)";


                previewStatus.textContent =
                    "MESSAGE READY";


                /*
                 * Immediately send quick message
                 * if connected.
                 */

                if (
                    socket &&
                    socket.readyState ===
                    WebSocket.OPEN
                ) {

                    clearTimeout(
                        typingTimer
                    );

                    sendTextToESP32();

                    previewStatus.textContent =
                        "TEXT SENT TO ESP32";

                }

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
            Number(
                speedSlider.value
            );


        speedValue.textContent =
            speed + "%";


        /*
         * Website:
         * 1 - 100
         *
         * ESP32:
         * 1 - 10
         */

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
                "SPEED:" +
                espSpeed;


            socket.send(
                command
            );


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

                /*
                 * Remove active
                 */

                sizeButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                const size =
                    button.dataset.size;


                let fontNumber;


                /*
                 * SMALL
                 */

                if (
                    size ===
                    "small"
                ) {

                    previewText.style.fontSize =
                        "20px";

                    previewText.style.lineHeight =
                        "20px";

                    fontValue.textContent =
                        "Small";

                    fontNumber =
                        1;

                }


                /*
                 * MEDIUM
                 */

                else if (
                    size ===
                    "medium"
                ) {

                    previewText.style.fontSize =
                        "28px";

                    previewText.style.lineHeight =
                        "28px";

                    fontValue.textContent =
                        "Medium";

                    fontNumber =
                        2;

                }


                /*
                 * LARGE
                 */

                else if (
                    size ===
                    "large"
                ) {

                    previewText.style.fontSize =
                        "36px";

                    previewText.style.lineHeight =
                        "36px";

                    fontValue.textContent =
                        "Large";

                    fontNumber =
                        3;

                }


                /*
                 * Send font to ESP32
                 */

                if (
                    socket &&
                    socket.readyState ===
                    WebSocket.OPEN
                ) {

                    const command =
                        "FONT:" +
                        fontNumber;


                    socket.send(
                        command
                    );


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

                modeButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                const mode =
                    button.dataset.mode;


                /*
                 * STATIC
                 */

                if (
                    mode ===
                    "static"
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


                /*
                 * SCROLL
                 */

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
   PLAY
   ===================================================== */

startBtn.addEventListener(
    "click",
    () => {

        if (
            !socket ||
            socket.readyState !==
            WebSocket.OPEN
        ) {

            showStatus(
                "ESP32 NOT CONNECTED",
                false
            );

            return;
        }


        /*
         * Cancel any pending live text send.
         */

        clearTimeout(
            typingTimer
        );


        /*
         * IMPORTANT:
         *
         * Send current textbox FIRST.
         *
         * Then PLAY.
         *
         * This guarantees that ESP32 has
         * the latest paragraph before
         * calculating scroll lines.
         */

        const text =
            messageInput.value;


        if (
            text.trim() !== ""
        ) {

            const textCommand =
                "TEXT:" + text;


            socket.send(
                textCommand
            );


            console.log(
                "PLAY → TEXT SENT FIRST"
            );


            /*
             * Give ESP32 a moment to process
             * and wrap the text.
             */

            setTimeout(
                () => {

                    if (
                        socket &&
                        socket.readyState ===
                        WebSocket.OPEN
                    ) {

                        socket.send(
                            "PLAY"
                        );


                        console.log(
                            "PLAY SENT"
                        );

                    }

                },
                120
            );

        }

        else {

            socket.send(
                "PLAY"
            );


            console.log(
                "PLAY SENT"
            );

        }


        previewStatus.textContent =
            "PLAYING";

    }
);



/* =====================================================
   PAUSE
   ===================================================== */

pauseBtn.addEventListener(
    "click",
    () => {

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


            previewStatus.textContent =
                "PAUSED";

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
   RESET
   ===================================================== */

resetBtn.addEventListener(
    "click",
    () => {

        /*
         * Browser preview only.
         */

        previewText.style.transform =
            "translateY(0px)";


        previewStatus.textContent =
            "READY";


        /*
         * ESP32 reset.
         */

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
   STATUS
   ===================================================== */

function showStatus(
    message,
    success
) {

    previewStatus.textContent =
        message;


    if (
        success
    ) {

        previewStatus.style.color =
            "#b7c0ce";

    }

    else {

        previewStatus.style.color =
            "#d0a5a5";

    }

}



/* =====================================================
   KEYBOARD SHORTCUT
   ===================================================== */

messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey &&
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            sendBtn.click();

        }

    }
);



/* =====================================================
   INITIALIZATION
   ===================================================== */

updateWebSocketAddress();

setDisconnected();


console.log(
    "OPTISYNK Dashboard loaded."
);

console.log(
    "OLED MIRROR DISABLED."
);

console.log(
    "ESP32 controls OLED scrolling independently."
);
