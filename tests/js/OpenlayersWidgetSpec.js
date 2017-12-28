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

    describe("ol3-map", function () {

        var widget;

        beforeAll(function () {
            window.MashupPlatform = new MockMP({
                type: 'widget',
                prefs: {
                    'initialCenter': '',
                    'initialZoom': ''
                },
                outputs: ['poiListOutput']
            });
        });

        beforeEach(function () {
            clearDocument();
            document.body.innerHTML += HTML_FIXTURE;
            MashupPlatform.reset();
            widget = new Widget();
        });

        it("supports adding PoIs", () => {
            widget.init();
            widget.registerPoI({
                id: '1',
                data: {},
                location: {
                    type: 'Point',
                    coordinates: [0, 0]
                }
            });

        });

        describe("addLayer", function () {

            it("throws an EndpointValueError exception for invalid layer types", () => {
                widget.init();
                expect(() => {
                    widget.addLayer({
                        type: "invalid"
                    });
                }).toThrowError(MashupPlatform.wiring.EndpointValueError);
            });

            it("supports basic ImageWMS layers", function () {
                widget.init();
                spyOn(widget.map, 'addLayer');
                widget.addLayer({
                    type: "ImageWMS",
                    url: "http://wms.example.com",
                    name: "LayerName"
                });
                expect(widget.map.addLayer).toHaveBeenCalledWith(jasmine.any(ol.layer.Image));
            });

        });
    });
})();
