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
   Website does NOT mirror OLED scrolling.
   ESP32 controls OLED independently.
===================================================== */


/* =====================================================
   ELEMENTS
===================================================== */

const messageInput =
    document.getElementById("messageInput");

const characterCount =
    document.getElementById("characterCount");

const previewText =
    document.getElementById("previewText");

const sendBtn =
    document.getElementById("sendBtn");

const clearBtn =
    document.getElementById("clearBtn");

const speedSlider =
    document.getElementById("speedSlider");

const speedValue =
    document.getElementById("speedValue");

const fontValue =
    document.getElementById("fontValue");

const previewStatus =
    document.getElementById("previewStatus");

const statusDot =
    document.getElementById("statusDot");

const connectionText =
    document.getElementById("connectionText");

const connectionSubtext =
    document.getElementById("connectionSubtext");

const connectionContainer =
    document.getElementById("connectionContainer");

const liveBadge =
    document.getElementById("liveBadge");

const deviceStatus =
    document.getElementById("deviceStatus");

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
   ONLINE VISUALS
===================================================== */

function setOnlineVisuals() {

    /* Top-right green dot */

    statusDot.classList.add("online");


    /* Top-right connection text */

    connectionContainer.classList.add("online");


    /* LIVE green */

    liveBadge.classList.add("active");


    /* Connection badge */

    connectionBadge.classList.add(
        "connected"
    );

}


/* =====================================================
   OFFLINE VISUALS
===================================================== */

function setOfflineVisuals() {

    /* Remove top-right glow */

    statusDot.classList.remove("online");


    connectionContainer.classList.remove(
        "online"
    );


    /* Remove LIVE glow */

    liveBadge.classList.remove("active");


    /* Remove badge glow */

    connectionBadge.classList.remove(
        "connected"
    );

}


/* =====================================================
   SEND TEXT
===================================================== */

function sendTextToESP32() {

    if (
        !socket ||
        socket.readyState !== WebSocket.OPEN
    ) {

        console.log(
            "ESP32 not connected"
        );

        return false;
    }


    const text =
        messageInput.value;


    if (
        text.trim() === ""
    ) {

        return false;
    }


    /*
     * IMPORTANT:
     * Normal TEXT:
     * No backslash.
     */

    const command =
        "TEXT:" + text;


    console.log(
        "TEXT COMMAND:",
        JSON.stringify(command)
    );


    socket.send(command);


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


    /* Close old socket */

    if (socket) {

        try {
            socket.close();
        }

        catch (error) {

            console.log(
                "Old socket error:",
                error
            );

        }

        socket = null;
    }


    const websocketURL =
        "ws://" + ip + ":81";


    console.log(
        "Connecting:",
        websocketURL
    );


    /* Connecting state */

    connectionText.textContent =
        "CONNECTING...";

    connectionSubtext.textContent =
        "Connecting to ESP32-C3";

    deviceStatus.textContent =
        "Connecting...";

    connectionBadge.textContent =
        "CONNECTING";

    previewStatus.textContent =
        "CONNECTING";


    setOfflineVisuals();


    /* Create socket */

    try {

        socket =
            new WebSocket(
                websocketURL
            );

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
    ================================================== */

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


        /* GREEN GLOW */

        setOnlineVisuals();


        previewStatus.textContent =
            "DEVICE READY";


        connectBtn.disabled =
            false;

        disconnectBtn.disabled =
            false;


        /*
         * If text was already typed before
         * connecting, send it.
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

                    }

                }

            },
            150
        );

    };


    /* =================================================
       ESP32 MESSAGE
    ================================================== */

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


        if (
            data ===
            "ESP32_CONNECTED"
        ) {

            previewStatus.textContent =
                "DEVICE READY";

        }

    };


    /* =================================================
       ERROR
    ================================================== */

    socket.onerror = function(error) {

        console.error(
            "WebSocket error:",
            error
        );


        previewStatus.textContent =
            "CONNECTION ERROR";

        deviceStatus.textContent =
            "Connection error";

    };


    /* =================================================
       CLOSE
    ================================================== */

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

    previewStatus.textContent =
        "DEVICE OFFLINE";


    setOfflineVisuals();


    disconnectBtn.disabled =
        true;

}


/* =====================================================
   CONNECT BUTTON
===================================================== */

connectBtn.addEventListener(
    "click",
    connectESP32
);


/* =====================================================
   DISCONNECT BUTTON
===================================================== */

disconnectBtn.addEventListener(
    "click",
    disconnectESP32
);


/* =====================================================
   LIVE TEXT INPUT
===================================================== */

messageInput.addEventListener(
    "input",
    () => {

        const text =
            messageInput.value;


        /* Character count */

        characterCount.textContent =
            text.length;


        /* Browser preview */

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


        /* Reset preview */

        previewText.style.transform =
            "translateY(0px)";


        /* Cancel previous timer */

        clearTimeout(
            typingTimer
        );


        /*
         * Live send after 120ms.
         */

        typingTimer =
            setTimeout(
                () => {

                    if (
                        socket &&
                        socket.readyState ===
                        WebSocket.OPEN
                    ) {

                        sendTextToESP32();

                        previewStatus.textContent =
                            "TEXT SENT";

                    }

                },
                120
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


        if (
            message === ""
        ) {

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


        clearTimeout(
            typingTimer
        );


        sendTextToESP32();


        previewText.textContent =
            message;


        previewStatus.textContent =
            "TEXT SENT";


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


                previewStatus.textContent =
                    "MESSAGE READY";


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
                        "TEXT SENT";

                }

            }
        );

    }
);


/* =====================================================
   SPEED
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
   FONT SIZE
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


                if (
                    size === "small"
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


                else if (
                    size === "medium"
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


                else {

                    previewText.style.fontSize =
                        "36px";

                    previewText.style.lineHeight =
                        "36px";

                    fontValue.textContent =
                        "Large";

                    fontNumber =
                        3;

                }


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


                if (
                    socket &&
                    socket.readyState ===
                    WebSocket.OPEN
                ) {

                    socket.send(
                        "MODE:" +
                        mode.toUpperCase()
                    );

                }


                previewStatus.textContent =
                    mode === "scroll"
                        ? "SCROLL MODE"
                        : "STATIC MODE";

            }
        );

    }
);


/* =====================================================
   START
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


        clearTimeout(
            typingTimer
        );


        const text =
            messageInput.value;


        /*
         * ALWAYS send text first.
         */

        if (
            text.trim() !== ""
        ) {

            const command =
                "TEXT:" + text;


            console.log(
                "START →",
                JSON.stringify(command)
            );


            socket.send(
                command
            );


            /*
             * Wait for ESP32 to wrap
             * before PLAY.
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
                200
            );

        }

        else {

            socket.send(
                "PLAY"
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

        previewText.style.transform =
            "translateY(0px)";


        previewStatus.textContent =
            "READY";


        if (
            socket &&
            socket.readyState ===
            WebSocket.OPEN
        ) {

            socket.send(
                "RESET"
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
   STATUS MESSAGE
===================================================== */

function showStatus(
    message,
    success
) {

    previewStatus.textContent =
        message;


    if (success) {

        previewStatus.style.color =
            "#65e6a4";

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

updateWebSocketAddress();

setDisconnected();


console.log(
    "================================="
);

console.log(
    "OPTISYNK DASHBOARD LOADED"
);

console.log(
    "OLED MIRROR: DISABLED"
);

console.log(
    "ESP32 OLED: INDEPENDENT"
);

console.log(
    "================================="
);
