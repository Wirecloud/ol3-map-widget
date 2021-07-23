/*
 * Copyright (c) 2014-2018 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global Widget */


(function () {

    "use strict";

    const parseInputEndpointData = function parseInputEndpointData(data) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch (e) {
                throw new MashupPlatform.wiring.EndpointTypeError();
            }
        } else if (data == null || typeof data !== "object") {
            throw new MashupPlatform.wiring.EndpointTypeError();
        }
        return data;
    };

    const widget = new Widget('body', '#incoming-modal');
    widget.init();

    MashupPlatform.prefs.registerCallback((new_values) => {
        if ("useclustering" in new_values) {
            widget.setClustering(new_values.useclustering);
        }
    });

    MashupPlatform.wiring.registerCallback('layerInfo', (commands) => {
        commands = parseInputEndpointData(commands);

        if (!Array.isArray(commands)) {
            commands = [commands];
        }

        if (commands.some((command) => {return command == null || ["addLayer", "updateLayer", "removeLayer", "setBaseLayer"].indexOf(command.action) === -1;})) {
            throw new MashupPlatform.wiring.EndpointValueError("Invalid command action");
        }

        commands.forEach((command) => {
            switch (command.action) {
            case "addLayer":
                widget.addLayer(command.data);
                break;
            case "updateLayer":
                widget.updateLayer(command.data);
                break;
            case "removeLayer":
                widget.removeLayer(command.data);
                break;
            case "setBaseLayer":
                widget.setBaseLayer(command.data);
                break;
            }
        });
    });

    MashupPlatform.wiring.registerCallback('poiInput', (poi_info) => {
        poi_info = parseInputEndpointData(poi_info);

        if (!Array.isArray(poi_info)) {
            poi_info = [poi_info];
        }
        poi_info.forEach(widget.registerPoI, widget);
    });

    MashupPlatform.wiring.registerCallback('replacePoIs', (poi_info) => {
        poi_info = parseInputEndpointData(poi_info);

        if (!Array.isArray(poi_info)) {
            poi_info = [poi_info];
        }
        widget.replacePoIs(poi_info);
    });

    MashupPlatform.wiring.registerCallback('poiInputCenter', (poi_info) => {
        if (poi_info == null) {
            poi_info = [];
        }

        poi_info = parseInputEndpointData(poi_info);

        if (!Array.isArray(poi_info)) {
            poi_info = [poi_info];
        }

        poi_info.forEach((poi) => {
            if (poi != null && typeof poi === "object") {
                widget.registerPoI(poi)
            }
        });
        widget.centerPoI(poi_info);
    });

    MashupPlatform.wiring.registerCallback('deletePoiInput', (poi_info) => {
        poi_info = parseInputEndpointData(poi_info);

        if (!Array.isArray(poi_info)) {
            poi_info = [poi_info];
        }
        poi_info.forEach(widget.removePoI, widget);
    });

})();
