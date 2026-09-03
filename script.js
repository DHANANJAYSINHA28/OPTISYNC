/* =====================================================
   OPTISYNK SMART GLASS DASHBOARD
   ESP32-C3 REAL-TIME OLED MIRROR
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

   OLED → WEBSITE MIRROR

   ESP32 sends:

   ESP32_CONNECTED

   LINES_BEGIN:3:2
   LINE:0:HELLO WORLD
   LINE:1:SMART GLASS
   LINE:2:READY
   LINES_END

   SYNC:24:2:SCROLL:1

   Where:

   offset  = OLED scroll position
   font    = OLED font size
   mode    = STATIC / SCROLL
   playing = 1 / 0

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
// ESP32 CONNECTION ELEMENTS
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

let socket = null;

let isConnected = false;



/* =====================================================
   OLED MIRROR VARIABLES
   ===================================================== */

// Exact wrapped lines received from ESP32
let mirrorLines = [];


// Number of lines expected from ESP32
let mirrorExpectedLines = 0;


// Font currently used by OLED
let mirrorFont = 1;


// Current OLED scroll offset
let mirrorOffset = 0;


// Current OLED mode
let mirrorMode = "STATIC";


// Current OLED playback state
let mirrorPlaying = false;


// Are we currently receiving line data?
let receivingLines = false;



/* =====================================================
   ESP32 IP ADDRESS
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


        // Buttons
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



        /* =================================================
           ESP32 CONNECTED
           ================================================= */

        if (
            data ===
            "ESP32_CONNECTED"
        ) {

            previewStatus.textContent =
                "DEVICE READY";

            return;
        }



        /* =================================================
           LINES BEGIN

           Example:

           LINES_BEGIN:3:2

           3 = number of lines
           2 = OLED font
           ================================================= */

        if (
            data.startsWith(
                "LINES_BEGIN:"
            )
        ) {

            const parts =
                data.split(":");


            if (parts.length >= 2) {

                mirrorExpectedLines =
                    Number(parts[1]);


                if (
                    parts.length >= 3
                ) {

                    mirrorFont =
                        Number(parts[2]);

                }


                mirrorLines = [];

                receivingLines = true;


                console.log(
                    "OLED LINES BEGIN:",
                    mirrorExpectedLines,
                    "font:",
                    mirrorFont
                );

            }


            return;
        }



        /* =================================================
           LINE

           Example:

           LINE:0:HELLO WORLD

           We do NOT split the complete string because
           the actual line may itself contain ":".
           ================================================= */

        if (
            data.startsWith(
                "LINE:"
            )
        ) {

            if (!receivingLines) {

                return;
            }


            const firstColon =
                data.indexOf(":");

            const secondColon =
                data.indexOf(
                    ":",
                    firstColon + 1
                );


            if (
                firstColon !== -1 &&
                secondColon !== -1
            ) {

                const index =
                    Number(
                        data.substring(
                            firstColon + 1,
                            secondColon
                        )
                    );


                const line =
                    data.substring(
                        secondColon + 1
                    );


                mirrorLines[index] =
                    line;


                console.log(
                    "OLED LINE",
                    index,
                    ":",
                    line
                );

            }


            return;
        }



        /* =================================================
           LINES END
           ================================================= */

        if (
            data ===
            "LINES_END"
        ) {

            receivingLines = false;


            console.log(
                "OLED LINES COMPLETE:",
                mirrorLines
            );


            renderOLEDLines();


            return;
        }



        /* =================================================
           DISPLAY SYNC

           ESP32 sends:

           SYNC:24:2:SCROLL:1

           offset  = 24
           font    = 2
           mode    = SCROLL
           playing = true
           ================================================= */

        if (
            data.startsWith(
                "SYNC:"
            )
        ) {

            const parts =
                data.split(":");


            if (
                parts.length >= 5
            ) {

                const oledOffset =
                    Number(parts[1]);


                const oledFont =
                    Number(parts[2]);


                const oledMode =
                    parts[3];


                const oledPlaying =
                    parts[4] === "1";


                syncGlassPreview(
                    oledOffset,
                    oledFont,
                    oledMode,
                    oledPlaying
                );

            }


            return;
        }

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
   OLED FONT → BROWSER FONT
   ===================================================== */

function getBrowserFontSize(
    oledFont
) {

    if (oledFont === 1) {

        return 20;

    }

    if (oledFont === 2) {

        return 28;

    }

    if (oledFont === 3) {

        return 36;

    }


    return 20;

}



/* =====================================================
   OLED LINE HEIGHT → BROWSER LINE HEIGHT
   ===================================================== */

function getBrowserLineHeight(
    oledFont
) {

    /*
     * OLED line height:

       FONT 1 → 8 pixels
       FONT 2 → 16 pixels
       FONT 3 → 24 pixels

     * Browser preview uses the same scale
       as the browser font size.
     */

    if (oledFont === 1) {

        return 20;

    }

    if (oledFont === 2) {

        return 28;

    }

    if (oledFont === 3) {

        return 36;

    }


    return 20;

}



/* =====================================================
   OLED SCALE FACTOR
   ===================================================== */

function getPreviewScale(
    oledFont
) {

    /*
     * Browser font / OLED font height

       FONT 1:
       20 / 8 = 2.5

       FONT 2:
       28 / 16 = 1.75

       FONT 3:
       36 / 24 = 1.5
    */

    if (oledFont === 1) {

        return 2.5;

    }

    if (oledFont === 2) {

        return 1.75;

    }

    if (oledFont === 3) {

        return 1.5;

    }


    return 2.5;

}



/* =====================================================
   RENDER EXACT OLED LINES
   ===================================================== */

function renderOLEDLines() {

    if (!previewText) {

        return;
    }


    /*
     * If ESP32 has not sent lines yet,
     * don't destroy the normal preview.
     */

    if (
        mirrorLines.length === 0
    ) {

        return;
    }


    // Remove undefined entries safely

    const cleanLines =
        mirrorLines.map(
            line => {

                if (
                    typeof line ===
                    "string"
                ) {

                    return line;

                }

                return "";

            }
        );


    /*
     * IMPORTANT:

     * We use the EXACT line breaks
     * received from ESP32.

     * Browser will NOT create its own
     * line wrapping.
     */

    previewText.textContent =
        cleanLines.join("\n");


    // Force exact line rendering
    previewText.style.whiteSpace =
        "pre";


    previewText.style.wordWrap =
        "normal";


    previewText.style.overflowWrap =
        "normal";


    // Apply OLED font
    previewText.style.fontSize =
        getBrowserFontSize(
            mirrorFont
        ) + "px";


    // Apply matching line height
    previewText.style.lineHeight =
        getBrowserLineHeight(
            mirrorFont
        ) + "px";


    // Reset transform before new state
    previewText.style.transform =
        "translateY(0px)";


    console.log(
        "GLASS MIRROR RENDERED:",
        cleanLines
    );

}



/* =====================================================
   OLED → GLASS REAL-TIME SYNC
   ===================================================== */

function syncGlassPreview(
    oledOffset,
    oledFont,
    oledMode,
    oledPlaying
) {

    /*
     * Save the REAL OLED state.
     */

    mirrorOffset =
        oledOffset;

    mirrorFont =
        oledFont;

    mirrorMode =
        oledMode;

    mirrorPlaying =
        oledPlaying;



    /* =================================================
       UPDATE FONT
       ================================================= */

    previewText.style.fontSize =
        getBrowserFontSize(
            oledFont
        ) + "px";


    previewText.style.lineHeight =
        getBrowserLineHeight(
            oledFont
        ) + "px";



    /* =================================================
       UPDATE FONT LABEL
       ================================================= */

    if (
        oledFont === 1
    ) {

        fontValue.textContent =
            "Small";

    }

    else if (
        oledFont === 2
    ) {

        fontValue.textContent =
            "Medium";

    }

    else if (
        oledFont === 3
    ) {

        fontValue.textContent =
            "Large";

    }



    /* =================================================
       STATIC MODE
       ================================================= */

    if (
        oledMode ===
        "STATIC"
    ) {

        previewText.style.transform =
            "translateY(0px)";

    }



    /* =================================================
       SCROLL MODE
       ================================================= */

    else if (
        oledMode ===
        "SCROLL"
    ) {

        /*
         * Convert OLED pixels to browser
         * preview pixels.

         * The OLED is 128x64.
         * Browser preview is visually larger.

         * Therefore we multiply the OLED
         * offset by the browser scale.
         */

        const scale =
            getPreviewScale(
                oledFont
            );


        const browserOffset =
            oledOffset * scale;


        /*
         * THIS IS THE IMPORTANT PART.

         * Website does NOT calculate its
         * own scrolling.

         * It simply follows the OLED.
         */

        previewText.style.transform =
            "translateY(-" +
            browserOffset +
            "px)";

    }



    /* =================================================
       PLAY / PAUSE
       ================================================= */

    if (
        oledPlaying
    ) {

        previewStatus.textContent =
            "PLAYING";

    }

    else {

        if (
            oledMode ===
            "STATIC"
        ) {

            previewStatus.textContent =
                "STATIC MODE";

        }

        else {

            previewStatus.textContent =
                "PAUSED";

        }

    }



    console.log(
        "GLASS SYNC →",
        "offset:",
        oledOffset,
        "font:",
        oledFont,
        "mode:",
        oledMode,
        "playing:",
        oledPlaying
    );

}



/* =====================================================
   LIVE MESSAGE INPUT
   ===================================================== */

let typingTimer = null;


messageInput.addEventListener(
    "input",
    () => {

        const text =
            messageInput.value;


        // Update character count
        characterCount.textContent =
            text.length;


        /*
         * Before ESP32 responds,
         * show the typed message.
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
         * Once the ESP32 responds with
         * LINES_BEGIN / LINE / LINES_END,
         * renderOLEDLines() will replace
         * this with the exact OLED layout.
         */


        // -----------------------------------------------
        // LIVE SEND TO ESP32
        // -----------------------------------------------

        clearTimeout(
            typingTimer
        );


        typingTimer =
            setTimeout(
                () => {

                    // Don't send if ESP32 is not connected
                    if (
                        !socket ||
                        socket.readyState !==
                        WebSocket.OPEN
                    ) {

                        console.log(
                            "ESP32 not connected - message not sent"
                        );

                        return;
                    }


                    /*
                     * Send TEXT command.
                     */

                    const command =
                        "TEXT:" + text;


                    socket.send(
                        command
                    );


                    console.log(
                        "LIVE SENT:",
                        command
                    );


                    previewStatus.textContent =
                        "LIVE TO GLASS";


                },
                80
            );

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

        if (
            message === ""
        ) {

            showStatus(
                "ENTER A MESSAGE",
                false
            );

            return;
        }


        // Update browser preview

        previewText.textContent =
            message;


        // CHECK WEBSOCKET CONNECTION

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


        // SEND TEXT TO ESP32

        const command =
            "TEXT:" + message;


        socket.send(
            command
        );


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


        previewText.style.transform =
            "translateY(0px)";


        previewStatus.textContent =
            "READY";


        /*
         * Reset mirror state.
         */

        mirrorLines = [];

        mirrorOffset = 0;

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


                previewText.style.transform =
                    "translateY(0px)";


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
            Number(
                speedSlider.value
            );


        // Update website display

        speedValue.textContent =
            speed + "%";


        /*
         * Website speed = 1 to 100
         *
         * ESP32 speed = 1 to 10
         *
         * Convert 1-100 → 1-10
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



                /* =========================================
                   SMALL
                   ========================================= */

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



                /* =========================================
                   MEDIUM
                   ========================================= */

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



                /* =========================================
                   LARGE
                   ========================================= */

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



                /* =========================================
                   SEND FONT SIZE TO ESP32
                   ========================================= */

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



                /* =========================================
                   STATIC MODE
                   ========================================= */

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



                /* =========================================
                   SCROLL MODE
                   ========================================= */

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


        /*
         * Immediately return website preview
         * to the top.
         */

        mirrorOffset = 0;

        previewText.style.transform =
            "translateY(0px)";


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
   KEYBOARD SHORTCUTS
   ===================================================== */

// Ctrl + Enter
// Send message

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

// Show correct WebSocket address

updateWebSocketAddress();


// Start disconnected

setDisconnected();


// Initial mirror state

mirrorLines = [];

mirrorOffset = 0;

mirrorFont = 1;

mirrorMode = "STATIC";

mirrorPlaying = false;


console.log(
    "OPTISYNK Smart Glass Dashboard loaded."
);

console.log(
    "OLED mirror synchronization enabled."
);

console.log(
    "Enter ESP32 IP and click CONNECT."
);
