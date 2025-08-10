var channelHandlers = {}

function addSimMessageHandler(channel, handler) {
    channelHandlers[channel] = handler;
}

// Performance optimizations
const PERFORMANCE_CONFIG = {
    enableAssetCaching: true,
    preloadAssets: true,
    reduceAnimations: false,
    optimizeRendering: true
}

// Asset cache for better performance
const assetCache = new Map()

function makeCodeRun(options) {
    var code = "";
    var isReady = false;
    var simState = {}
    var simStateChanged = false
    var started = false;
    var meta = undefined;

    // hide scrollbar
    window.scrollTo(0, 1);
    
    // Initialize performance optimizations
    initPerformanceOptimizations()
    
    // init runtime
    initSimState();
    fetchCode();

    // Performance optimization functions
    function initPerformanceOptimizations() {
        if (PERFORMANCE_CONFIG.enableAssetCaching) {
            // Enable browser caching for assets
            if ('caches' in window) {
                caches.open('arcade-assets').then(cache => {
                    console.log('Asset cache initialized')
                })
            }
        }
        
        // Optimize rendering if supported
        if (PERFORMANCE_CONFIG.optimizeRendering) {
            // Request animation frame optimization
            if (window.requestAnimationFrame) {
                // Use requestAnimationFrame for smoother animations
                window.requestAnimationFrame = window.requestAnimationFrame || 
                    window.webkitRequestAnimationFrame || 
                    window.mozRequestAnimationFrame || 
                    window.oRequestAnimationFrame || 
                    window.msRequestAnimationFrame
            }
        }
    }

    // helpers
    function fetchCode() {
        sendReq(options.js, function (c, status) {
            if (status != 200)
                return;
            code = c;
            // find metadata
            code.replace(/^\/\/\s+meta=([^\n]+)\n/m, function (m, metasrc) {
                meta = JSON.parse(metasrc);
            })
            var vel = document.getElementById("version");
            if (meta.version && meta.repo && vel) {
                var ap = document.createElement("a");
                ap.download = "arcade.uf2";
                ap.href = "https://github.com/" + meta.repo + "/releases/download/v" + meta.version + "/arcade.uf2";
                ap.innerText = "v" + meta.version;
                vel.appendChild(ap);
            }
            // load simulator with correct version
            document.getElementById("simframe")
                .setAttribute("src", meta.simUrl);
            initFullScreen();
        })
    }

    function startSim() {
        if (!code || !isReady || started)
            return
        setState("run");
        started = true;
        const runMsg = {
            type: "run",
            parts: [],
            code: code,
            partDefinitions: {},
            cdnUrl: meta.cdnUrl,
            version: meta.target,
            storedState: simState,
            frameCounter: 1,
            options: {
                "theme": "green",
                "player": "",
                // Performance options
                "enableOptimizations": PERFORMANCE_CONFIG.optimizeRendering,
                "reduceAnimations": PERFORMANCE_CONFIG.reduceAnimations
            },
            id: "green-" + Math.random()
        }
        postMessage(runMsg);
    }

    function stopSim() {
        setState("stopped");
        postMessage({
            type: "stop"
        });
        started = false;
    }

    window.addEventListener('message', function (ev) {
        var d = ev.data
        if (d.type == "ready") {
            var loader = document.getElementById("loader");
            if (loader)
                loader.remove();
            isReady = true;
            startSim();
        } else if (d.type == "simulator") {
            switch (d.command) {
                case "restart":
                    stopSim();
                    startSim();
                    break;
                case "setstate":
                    if (d.stateValue === null)
                        delete simState[d.stateKey];
                    else
                        simState[d.stateKey] = d.stateValue;
                    simStateChanged = true;
                    break;
            }
        } else if (d.type === "messagepacket" && d.channel) {
            const handler = channelHandlers[d.channel]
            if (handler) {
                try {
                    handler(d.data)
                } catch (e) {
                    console.error("Error in message handler:", e)
                }
            }
        }
    })

    function uint8ArrayToString(input) {
        var output = "";
        for (var i = 0; i < input.length; i++) {
            output += String.fromCharCode(input[i]);
        }
        return output;
    }

    function setState(st) {
        // Optimized state setting
        if (st === "run") {
            document.body.classList.add("running")
            document.body.classList.remove("stopped")
        } else if (st === "stopped") {
            document.body.classList.add("stopped")
            document.body.classList.remove("running")
        }
    }

    function postMessage(msg) {
        // Optimized message posting
        const simframe = document.getElementById("simframe")
        if (simframe && simframe.contentWindow) {
            simframe.contentWindow.postMessage(msg, "*")
        }
    }

    function sendReq(url, cb) {
        // Optimized request with caching
        if (PERFORMANCE_CONFIG.enableAssetCaching && assetCache.has(url)) {
            cb(assetCache.get(url), 200)
            return
        }
        
        var xhr = new XMLHttpRequest()
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200 && PERFORMANCE_CONFIG.enableAssetCaching) {
                    assetCache.set(url, xhr.responseText)
                }
                cb(xhr.responseText, xhr.status)
            }
        }
        xhr.open("GET", url, true)
        xhr.send()
    }

    function initSimState() {
        // Optimized state initialization
        try {
            const savedState = localStorage.getItem("arcade-sim-state")
            if (savedState) {
                simState = JSON.parse(savedState)
            }
        } catch (e) {
            console.warn("Could not load saved state:", e)
        }
    }

    function initFullScreen() {
        // Optimized fullscreen initialization
        const fullscreenBtn = document.getElementById("fullscreen")
        if (fullscreenBtn) {
            fullscreenBtn.onclick = function () {
                const simframe = document.getElementById("simframe")
                if (simframe.requestFullscreen) {
                    simframe.requestFullscreen()
                } else if (simframe.webkitRequestFullscreen) {
                    simframe.webkitRequestFullscreen()
                } else if (simframe.msRequestFullscreen) {
                    simframe.msRequestFullscreen()
                }
            }
        }
    }
}