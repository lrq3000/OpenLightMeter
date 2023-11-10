# OpenLightMeter
(WIP) First open-source light (lux) meter app for Android

This app aims to provide a simple light meter for Android. It displays the current value as well as the 30 last observed values as a graph (number of points can be changed at runtime).

Technically, it is built over `react-native` and `expo`, because `expo` is a framework that not only eases development but more importantly offers an up-to-date and actively maintained package to access sensors, whereas other light sensors packages for react-native are usually unmaintained and can break at any time.

Currently the app works but it is rough around the edges and has no dark mode.

In the future, I would like to also implement the same app in Flutter to see for myself which framework I prefer to develop such apps.

Initially I wanted the app to work on Windows and iOS too, but iOS does not allow to access the light sensor, and Windows is very tricky to get right although there are some packages, but this will be left for later since expo doesn't support (I would need to re-implement everything specifically for the Windows app - basically it would be like another app, so better just do another app, it will be more maintanable).
