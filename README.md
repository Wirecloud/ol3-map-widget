# OpenLayers Map Widget

[![](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/visualization.svg)](https://www.fiware.org/developers/catalogue/)
![](https://img.shields.io/github/license/Wirecloud/ol3-map-widget.svg)

[![Build Status](https://travis-ci.org/Wirecloud/ol3-map-widget.svg?branch=develop)](https://travis-ci.org/Wirecloud/ol3-map-widget)
[![Coverage Status](https://coveralls.io/repos/github/Wirecloud/ol3-map-widget/badge.svg?branch=develop)](https://coveralls.io/github/Wirecloud/ol3-map-widget?branch=develop)

Map viewer [WireCloud widget](http://wirecloud.readthedocs.org/en/latest/) uses OpenLayers. It can receive Layers or
Point of Interest data and display them on the map.

## Build

Be sure to have installed [Node.js](http://node.js) and [Bower](http://bower.io) in your system. For example, you can
install it on Ubuntu and Debian running the following commands:

```console
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install nodejs
sudo apt-get install npm
sudo npm install -g bower
```

Install other npm dependencies by running:

```console
npm install
```

In order to build this operator you need to download grunt:

```console
sudo npm install -g grunt-cli
```

And now, you can use grunt:

```console
grunt
```

If everything goes well, you will find a wgt file in the `dist` folder.


## Documentation

Documentation about how to use this widget is available on the [User Guide](src/doc/userguide.md). Anyway, you can find
general information about how to use widgets on the
[WireCloud's User Guide](https://wirecloud.readthedocs.io/en/stable/user_guide/) available on Read the Docs.


## Copyright and License

Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politecnica de Madrid
Copyright (c) 2017-2019 Future Internet Consulting and Development Solutions S.L.


Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the
License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific
language governing permissions and limitations under the License.
