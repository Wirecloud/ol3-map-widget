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

/* global _CoNWeT_ol3_Widget_Internal */


(function () {

    "use strict";

    class Widget {
        constructor(MashupPlatform, shadowDOM, extra) {
            this.MashupPlatform = MashupPlatform;
            this.shadowDOM = shadowDOM;

            this.widget = new _CoNWeT_ol3_Widget_Internal(MashupPlatform, shadowDOM, extra);
            this.widget.init();

            this.MashupPlatform.prefs.registerCallback((new_values) => {
                if ("useclustering" in new_values) {
                    this.widget.setClustering(new_values.useclustering);
                }
            });

            this.MashupPlatform.wiring.registerCallback('layerInfo', (commands) => {
                commands = this.parseInputEndpointData(commands);

                if (!Array.isArray(commands)) {
                    commands = [commands];
                }

                if (commands.some((command) => {return command == null || ["addLayer", "updateLayer", "removeLayer", "setBaseLayer"].indexOf(command.action) === -1;})) {
                    throw new this.MashupPlatform.wiring.EndpointValueError("Invalid command action");
                }

                commands.forEach((command) => {
                    switch (command.action) {
                    case "addLayer":
                        this.widget.addLayer(command.data);
                        break;
                    case "updateLayer":
                        this.widget.updateLayer(command.data);
                        break;
                    case "removeLayer":
                        this.widget.removeLayer(command.data);
                        break;
                    case "setBaseLayer":
                        this.widget.setBaseLayer(command.data);
                        break;
                    }
                });
            });

            this.MashupPlatform.wiring.registerCallback('poiInput', (poi_info) => {
                poi_info = this.parseInputEndpointData(poi_info);

                if (!Array.isArray(poi_info)) {
                    poi_info = [poi_info];
                }
                poi_info.forEach(this.widget.registerPoI, this.widget);
            });

            this.MashupPlatform.wiring.registerCallback('replacePoIs', (poi_info) => {
                poi_info = this.parseInputEndpointData(poi_info);

                if (!Array.isArray(poi_info)) {
                    poi_info = [poi_info];
                }
                this.widget.replacePoIs(poi_info);
            });

            this.MashupPlatform.wiring.registerCallback('poiInputCenter', (poi_info) => {
                if (poi_info == null) {
                    poi_info = [];
                }

                poi_info = this.parseInputEndpointData(poi_info);

                if (!Array.isArray(poi_info)) {
                    poi_info = [poi_info];
                }

                poi_info.forEach((poi) => {
                    if (poi != null && typeof poi === "object") {
                        this.widget.registerPoI(poi)
                    }
                });
                this.widget.centerPoI(poi_info);
            });

            this.MashupPlatform.wiring.registerCallback('deletePoiInput', (poi_info) => {
                poi_info = this.parseInputEndpointData(poi_info);

                if (!Array.isArray(poi_info)) {
                    poi_info = [poi_info];
                }
                poi_info.forEach(this.widget.removePoI, this.widget);
            });
        }

        parseInputEndpointData(data) {
            if (typeof data === "string") {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    throw new this.MashupPlatform.wiring.EndpointTypeError();
                }
            } else if (data == null || typeof data !== "object") {
                throw new this.MashupPlatform.wiring.EndpointTypeError();
            }
            return data;
        }
    }

    window.CoNWeT_ol3_Widget = Widget;

})();
