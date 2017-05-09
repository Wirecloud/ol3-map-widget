/* global MashupPlatform, MockMP, ol, Widget */

(function () {

    "use strict";

    var HTML_FIXTURE = '<div id="map" class="map"></div>\n' +
        '<div id="button" class="se-btn"><span>Capas</span></div>';

    var clearDocument = function clearDocument() {
        var elements = document.querySelectorAll('body > *:not(.jasmine_html-reporter)');

        for (var i = 0; i < elements.length; i++) {
            elements[i].parentElement.removeChild(elements[i]);
        }
    };

    describe("Test ShortProjectName", function () {
        var widget;
        beforeAll(function () {
            window.MashupPlatform = new MockMP.MockMP();
        });

        beforeEach(function () {
            clearDocument();
            document.body.innerHTML += HTML_FIXTURE;
            MashupPlatform.reset();
            widget = new Widget();
        });

        it("Registers input endpoint callbacks", function () {
            widget.init();
            expect(MashupPlatform.wiring.registerCallback).toHaveBeenCalledWith("layerInfo", jasmine.any(Function));
        });

        it("Accepts the addLayer command", function () {
            window.URL = function (url) {
                this.prototcol = "http:";
                this.href = url;
            };
            widget.init();
            widget.map.addLayer.calls.reset();
            MashupPlatform.simulateReceiveEvent('layerInfo', '{"action": "addLayer", "data": {"url": "http://wms.example.com", "name": "LayerName"}}');
            expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Image));
        });
    });
})();
