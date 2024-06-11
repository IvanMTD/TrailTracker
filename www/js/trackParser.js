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
                var bounds = routeLine.geometry.getBounds();
                map.setBounds(bounds, {
                    checkZoomRange: true // Эта опция учитывает доступные уровни зума
                });
            });
        });
}

function addMarkers(map, coordinates) {
    var distance = 0;
    var kmCounter = 1;
    var lastPoint = coordinates[0];
    var R = 6371e3; // Радиус Земли в метрах

    // Установка маркера в начале маршрута
    addMarker(map, coordinates[0], 'Старт','islands#greenStretchyIcon');

    for (var i = 1; i < coordinates.length; i++) {
        var currentPoint = coordinates[i];
        distance += getDistanceFromLatLonInMeters(lastPoint[0], lastPoint[1], currentPoint[0], currentPoint[1]);
        lastPoint = currentPoint;

        if (distance >= kmCounter * 1000) {
            addMarker(map, currentPoint, kmCounter.toString(),'islands#blueCircleDotIcon');
            kmCounter++;
        }
    }

    // Установка маркера в конце маршрута
    addMarker(map, coordinates[coordinates.length - 1], 'Финиш', 'islands#redStretchyIcon');
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

// Функция для сохранения тайлов в локальное хранилище
function saveTile(url, path, filename, callback) {
    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
        dir.getDirectory(path, {create: true}, function (subdir) {
            var filePath = subdir.nativeURL + filename;
            var fileTransfer = new FileTransfer();
            fileTransfer.download(
                url,
                filePath,
                function (entry) {
                    callback(entry.nativeURL);
                },
                function (error) {
                    console.error("Error downloading file: " + error.code);
                    callback(url); // Возвращаем оригинальный URL в случае ошибки
                }
            );
        });
    });
}