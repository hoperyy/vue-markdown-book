```

{
    "name": "demo",
    "version": "1.0.0",
    "manifest_version": 2,
    "description": "demo description",
    "icons": {
        "16": "static/img/demo-16.png",
        "32": "static/img/demo-32.png",
        "48": "static/img/demo-48.png",
        "128": "static/img/demo-128.png"
    },

    "browser_action": {
        "default_icon": "static/img/demo-128.png",
        "default_title": "demo",
        "default_popup": "template/popup.html"
    },

    "background": {
        "persistent": true,
        "scripts": [
            "static/lib/jquery-3.1.1.min.js"
        ]
    },

    "permissions": [
        "tabs",
        "contextMenus",
        "cookies",
        "notifications",
        "alarms",
        "webNavigation",
        "\u003Call_urls\u003E"
    ],

    "web_accessible_resources": [
        "static/img/demo-16.png",
        "static/img/demo-32.png",
        "static/img/demo-48.png",
        "static/img/demo-128.png",
        "static/css/demo.css"
    ],

    "content_scripts": [
        {
            "matches": [
                "http://*/*",
                "https://*/*",
                "file://*/*"
            ],
            "js": [
                "static/lib/jquery-3.1.1.min.js",
                "static/js/content-script.js"
            ],
            "run_at": "document_end",
            "all_frames": false
        }
    ],
    "content_security_policy": "style-src 'self' 'unsafe-inline';script-src 'self' 'unsafe-eval'; object-src 'self' ""content_security_policy": "style-src 'self' 'unsafe-inline';script-src 'self' 'unsafe-eval'; object-src 'self' "

}

```