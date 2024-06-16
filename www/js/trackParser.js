function borderGpxParser(map, fileName) {
    fetch('borders/' + fileName + '.gpx')
        .then(response => response.text())
        .then(data => {
            gpxParse.parseGpx(data, function (error, parsedData) {
                if (error) {
                    console.error('Error parsing GPX file:', error);
                    return;
                }

                var trackPoints = parsedData.tracks[0].segments[0];

                // Преобразование треков в формат, пригодный для Yandex.Maps
                var coordinates = trackPoints.map(function (point) {
                    return [point.lat, point.lon];
                });
                // Создание полигона на карте
                createPolygon(map, coordinates);
            });
        });
}

function createPolygon(map, coordinates) {
    var polygon = new ymaps.GeoObject({
        geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
        },
        properties: {
            hintContent: 'Природный парк «Налычево»'
        }
    }, {
        fillColor: 'rgba(9,138,9,0.2)', // Прозрачный зеленый цвет
        strokeColor: '#058105', // Зеленые границы
        strokeWidth: 4
    });

    map.geoObjects.add(polygon);

    // Центрирование карты на полигоне
    var bounds = polygon.geometry.getBounds();
    map.setBounds(bounds, {
        checkZoomRange: true // Эта опция учитывает доступные уровни зума
    });
}

function gpxParser(map, fileName){
    fetch('gpx/' + fileName + '.gpx')
        .then(response => response.text())
        .then(data => {
            gpxParse.parseGpx(data, function(error, parsedData) {
                if (error) {
                    console.error('Error parsing GPX file:', error);
                    return;
                }

                var trackPoints = parsedData.tracks[0].segments[0];

                // Преобразование треков в формат, пригодный для Yandex.Maps
                var coordinates = trackPoints.map(function(point) {
                    return [point.lat, point.lon];
                });

                /*// Копируем массив координат, чтобы не менять исходный
                var reversedCoordinates = coordinates.slice();
                // Меняем местами начальную и конечную точки
                reversedCoordinates.reverse();

                coordinates = reversedCoordinates;*/

                // Создание линии маршрута на карте
                var routeLine = new ymaps.GeoObject({
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    },
                    properties: {
                        hintContent: 'Маршурт \"Налычево-Центральное\"'
                    }
                }, {
                    strokeColor: '#9900ff',
                    strokeWidth: 4
                });

                map.geoObjects.add(routeLine);

                // Установка маркеров
                addMarkers(map, coordinates);

                // Центрирование карты на маршруте
                /*var bounds = routeLine.geometry.getBounds();
                map.setBounds(bounds, {
                    checkZoomRange: true // Эта опция учитывает доступные уровни зума
                });*/
            });
        });
}

function gpxParserReverseControl(map, fileName, reverse){
    fetch('gpx/' + fileName + '.gpx')
        .then(response => response.text())
        .then(data => {
            gpxParse.parseGpx(data, function(error, parsedData) {
                if (error) {
                    console.error('Error parsing GPX file:', error);
                    return;
                }

                var trackPoints = parsedData.tracks[0].segments[0];

                // Преобразование треков в формат, пригодный для Yandex.Maps
                var coordinates = trackPoints.map(function(point) {
                    return [point.lat, point.lon];
                });

                if (reverse) {
                    coordinates.reverse();
                }

                /*// Копируем массив координат, чтобы не менять исходный
                var reversedCoordinates = coordinates.slice();
                // Меняем местами начальную и конечную точки
                reversedCoordinates.reverse();

                coordinates = reversedCoordinates;*/

                // Создание линии маршрута на карте
                var routeLine = new ymaps.GeoObject({
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    },
                    properties: {
                        hintContent: 'Маршурт \"Налычево-Центральное\"'
                    }
                }, {
                    strokeColor: '#9900ff',
                    strokeWidth: 4
                });

                map.geoObjects.add(routeLine);

                // Установка маркеров
                addMarkers(map, coordinates);

                // Центрирование карты на маршруте
                /*var bounds = routeLine.geometry.getBounds();
                map.setBounds(bounds, {
                    checkZoomRange: true // Эта опция учитывает доступные уровни зума
                });*/
            });
        });
}

function gpxCombainParser(map, fileName1, reverse1, fileName2, reverse2) {
    // Функция для загрузки и парсинга GPX файла
    function parseGpxFile(fileName, reverse, callback) {
        fetch('gpx/' + fileName + '.gpx')
            .then(response => response.text())
            .then(data => {
                gpxParse.parseGpx(data, function(error, parsedData) {
                    if (error) {
                        console.error('Error parsing GPX file:', error);
                        return;
                    }

                    var trackPoints = parsedData.tracks[0].segments[0];

                    // Преобразование трека в формат, пригодный для Yandex.Maps
                    var coordinates = trackPoints.map(function(point) {
                        return [point.lat, point.lon];
                    });

                    // Если требуется развернуть трек
                    if (reverse) {
                        coordinates.reverse();
                    }

                    callback(coordinates);
                });
            });
    }

    // Парсим первый GPX файл
    parseGpxFile(fileName1, reverse1, function(coordinates1) {
        // Парсим второй GPX файл
        parseGpxFile(fileName2, reverse2, function(coordinates2) {
            // Объединяем координаты из двух файлов
            var combinedCoordinates = coordinates1.concat(coordinates2);

            // Создание линии маршрута на карте
            var routeLine = new ymaps.GeoObject({
                geometry: {
                    type: 'LineString',
                    coordinates: combinedCoordinates
                },
                properties: {
                    hintContent: 'Маршурт \"Налычево-Центральное\"'
                }
            }, {
                strokeColor: '#9900ff',
                strokeWidth: 4
            });

            map.geoObjects.add(routeLine);

            // Установка маркеров
            addMarkers(map, combinedCoordinates);

            // Центрирование карты на маршруте
            /*var bounds = routeLine.geometry.getBounds();
            map.setBounds(bounds, {
                checkZoomRange: true // Эта опция учитывает доступные уровни зума
            });*/
        });
    });
}

function addMarkers(map, coordinates) {
    var distance = 0;
    var kmCounter = 1;
    var lastPoint = coordinates[0];
    var R = 6371e3; // Радиус Земли в метрах

    // Установка маркера в начале маршрута
    addMarker(map, coordinates[0], 'Старт','islands#blueStretchyIcon');

    for (var i = 1; i < coordinates.length; i++) {
        var currentPoint = coordinates[i];
        distance += getDistanceFromLatLonInMeters(lastPoint[0], lastPoint[1], currentPoint[0], currentPoint[1]);
        lastPoint = currentPoint;

        if (distance >= kmCounter * 1000) {
            addWayMarker(map, currentPoint, kmCounter.toString());
            kmCounter++;
        }
    }

    // Установка маркера в конце маршрута
    addMarker(map, coordinates[coordinates.length - 1], 'Финиш', 'islands#blueStretchyIcon');
}

function addMarker(map, coordinates, text, preset) {
    var marker = new ymaps.Placemark(coordinates, {
        iconContent: text
    }, {
        preset: preset,
        iconColor: preset === 'islands#blueCircleDotIcon' ? '#1e98ff' : undefined // Для км маркеров - голубая кайма
    });
    map.geoObjects.add(marker);
}

function addWayMarker(map, coordinates, text){
    var MyIconContentLayout = ymaps.templateLayoutFactory.createClass(
        '<div class="rounded-circle border border-primary border-2 d-flex align-items-center justify-content-center bg-white" style="width: 28px; height: 28px; overflow: hidden;">' +
        '   <p class="text-center">' + text + '</p>' +
        '</div>'
    );

    var placemark = new ymaps.Placemark(
        coordinates,
        {},
        {
            iconLayout: 'default#imageWithContent',
            iconImageHref: '', // путь к изображению, если нужно
            iconImageSize: [28, 28], // размер иконки
            iconContentLayout: MyIconContentLayout,
            iconImageOffset: [-14, -14], // смещение, чтобы центрировать иконку
            balloonPanelMaxMapArea: 0 // убираем ограничение размера балуна
        }
    );

    map.geoObjects.add(placemark);
}

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    var R = 6371e3; // Радиус Земли в метрах
    var φ1 = lat1 * Math.PI/180; // φ, λ в радианах
    var φ2 = lat2 * Math.PI/180;
    var Δφ = (lat2 - lat1) * Math.PI/180;
    var Δλ = (lon2 - lon1) * Math.PI/180;

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var distance = R * c; // В метрах
    return distance;
}