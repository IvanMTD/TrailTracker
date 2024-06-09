var watchID = null;
var map = null;
var firstStep = true;
var marker = null;
var followUser = false;
var drawTrack = false;
var currentPlatform = null;
var polyline = null;

var prevTimestamp = null;
var prevCoords = null;
var MAX_DISTANCE = 50; // Максимальное допустимое расстояние (в метрах) между двумя измерениями
var MIN_TIME_DIFF = 2000; // Минимальный допустимый промежуток времени (в миллисекундах) между двумя измерениями

var i_Latitude = null;
var i_Longitude = null;
var i_Altitude = null;
var i_Accuracy = null;
var i_AltitudeAccuracy = null;
var i_Heading = null;
var i_Speed = null;

var maxAttempts = 3;
var attempts = 0;

var track = [];

page('/', loadMainPage);
page('/info', loadInfoPage);
page('/profile', loadProfilePage);
page('/map', loadMapPage);
page('/camera', openCamera);
page();

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){
    currentPlatform = device.platform;
    console.log('platform is ' + currentPlatform);
    var permissions = cordova.plugins.permissions;
    console.log('Устройство готово!');
    $('#content').empty();
    $('#content').append(
        '<div class="container">' +
        '   <div class="row">' +
        '       <div class="col d-flex h-100 w-100">' +
        '           <div id="data" class="m-auto">' +
        '               <p>Устройство готово!</p>' +
        '           </div>' +
        '       </div>' +
        '   </div>' +
        '</div>'
    );

    function checkPermission() {
        $('#data').append(
            '<p>Проверка разрешения ... </p>'
        );
        permissions.hasPermission(permissions.ACCESS_FINE_LOCATION, function(status){
            if(!status.hasPermission) {
                requestPermission();
            } else {
                $('#data').append(
                    '<p>Разрешение есть можно работать!</p>'
                );
                loadMainPage();
            }
        }, function(){
            $('#data').append(
                '<p>Ошибка при проверке получения разрешения!</p>'
            );
        });
    }

    function requestPermission() {
        $('#data').append(
            '<p>Разрешения нет пробуем получить ...</p>'
        );
        permissions.requestPermission(permissions.ACCESS_FINE_LOCATION, function(status){
            if(status.hasPermission) {
                $('#data').append(
                    '<p>Разрешение получено!</p>'
                );
                loadMainPage();
            } else {
                $('#data').append(
                    '<p>Разрешение отклонено!</p>'
                );
            }
        }, function(){
            $('#data').append(
                '<p>Ошибка получения разрешения!</p>'
            );
        });
    }

    checkPermission();
}

function enableInsomnia() {
    if (window.plugins && window.plugins.insomnia) {
        window.plugins.insomnia.keepAwake();
    }
}

function disableInsomnia() {
    if (window.plugins && window.plugins.insomnia) {
        window.plugins.insomnia.allowSleepAgain();
    }
}

function loadMainPage(ctx, next) {
    fetch('main.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
            if(watchID != null){
                stopTracker(watchID);
            }
        });
}


function loadInfoPage(ctx, next) {
    fetch('info.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
            if(watchID != null){
                stopTracker(watchID);
            }
            hammerTime();
        });
}

function loadProfilePage(ctx, next) {
    fetch('profile.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
            if(watchID != null){
                stopTracker(watchID);
            }
        });
}

function loadMapPage(ctx, next) {
    fetch('map.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
            calcMapHeight();
            showCamera();
            createMap();
        });
}

function openCamera(ctx,next){
    navigator.camera.getPicture(cameraOnSuccess, onError, {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        saveToPhotoAlbum: true, // Сохранить фото в альбом
        correctOrientation: true // Исправить ориентацию изображения
    });
}

function cameraOnSuccess(imageURI) {
    attempts = 0;
    var modal = document.getElementById('photoModal');
    var img = document.getElementById('photoPreview');
    var imageContent = imageURI;

    if (currentPlatform === 'browser') {
        imageContent = 'data:image/png;base64,' + imageURI;
        img.src = imageContent;
    } else {
        console.log(imageURI);
        $('#test').empty();
        $('#test').append(
            '' + imageURI + ''
        );
        // Get the file object using the Cordova file plugin
        window.resolveLocalFileSystemURL(imageURI, function(fileEntry) {
            fileEntry.file(function(file) {
                console.log('File type:', file.type); // выводим тип файла в консоль
                console.log('File data:', file); // выводим данные файла в консоль

                var blob = file.slice(0, file.size, file.type); // создаем объект Blob из объекта File с помощью метода slice
                var reader = new FileReader();
                reader.onloadend = function(event) {
                    imageContent = event.target.result;
                    console.log('Image content:', imageContent); // выводим данные изображения в консоль
                    img.src = imageContent;
                };
                reader.readAsDataURL(blob);
            });
        });
    }

    modal.style.display = "block";

    document.getElementById('savePhoto').addEventListener('click', function() {
        var comment = document.getElementById('photoComment').value;
        savePhotoData(imageContent, comment);
        modal.style.display = "none";
    });

    document.getElementById('cancelPhoto').addEventListener('click', function() {
        modal.style.display = "none";
    });

    document.getElementById('closeModal').addEventListener('click', function() {
        modal.style.display = "none";
    });
}

function savePhotoData(imageURI, comment) {
    navigator.geolocation.getCurrentPosition(function(position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;

        var photoData = {
            imageURI: imageURI,
            comment: comment,
            latitude: latitude,
            longitude: longitude
        };

        // Получение текущих сохраненных данных
        var savedPhotos = JSON.parse(localStorage.getItem('photos')) || [];
        console.log('Текущие сохраненные фотографии:', savedPhotos);

        // Добавление новой фотографии
        savedPhotos.push(photoData);
        console.log('Фотографии после добавления новой:', savedPhotos);

        // Сохранение данных в localStorage
        localStorage.setItem('photos', JSON.stringify(savedPhotos));

        // Проверка, что данные действительно сохранены
        var savedPhotosAfterSave = JSON.parse(localStorage.getItem('photos'));
        console.log('Фотографии после сохранения:', savedPhotosAfterSave);

        // Добавление маркера на карту
        addPhotoMarker(photoData);
    }, function(error) {
        console.error('Ошибка получения местоположения:', error);
        if (attempts < maxAttempts) {
            attempts++;
            setTimeout(getCurrentPosition, 5000);
        } else {
            console.error('Превышено максимальное количество попыток получения местоположения.');
        }
    }, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
}

function addPhotoMarker(photoData) {
    console.log('Пробую установить маркер на карту {' + JSON.stringify(photoData) + '}');

    var MyIconContentLayout = ymaps.templateLayoutFactory.createClass(
        '<div class="rounded-circle border border-dark border-2 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; overflow: hidden;">' +
        '   <img src="' + photoData.imageURI + '" class="img-fluid" alt="" style="width: 100%; height: 100%; object-fit: cover;" />' +
        '</div>'
    );

    var placemark = new ymaps.Placemark(
        [photoData.latitude, photoData.longitude],
        {
            balloonContent: '<img src="' + photoData.imageURI + '" style="width:100px;"><br>' + photoData.comment,
        },
        {
            iconLayout: 'default#imageWithContent',
            iconImageHref: '', // путь к изображению, если нужно
            iconImageSize: [50, 50], // размер иконки
            iconContentLayout: MyIconContentLayout,
            iconImageOffset: [-25, -25], // смещение, чтобы центрировать иконку
            balloonPanelMaxMapArea: 0 // убираем ограничение размера балуна
        }
    );

    // Добавление маркера на карту
    console.log('маркер создан {' + placemark + '}');
    map.geoObjects.add(placemark);
}

function calcMapHeight(){
    // Вычисляем высоту header
    var headerHeight = document.querySelector('header').offsetHeight;

    // Вычисляем высоту footer
    var footerHeight = document.querySelector('footer').offsetHeight;

    // Устанавливаем высоту для карты, учитывая высоту header и footer
    var mapHeight = window.innerHeight - (headerHeight + footerHeight);
    document.getElementById('map').style.height = mapHeight + 'px';
}

function createMap(){
    ymaps.ready(init);
}

function init(){
    console.log('создаю собственный слой карты');

    var MyLayer = function () {
        var subdomains = ['a', 'b', 'c'];

        /*var getTileUrl = function (tile, zoom, callback) {
            if (typeof cordova !== 'undefined') {
                var s = subdomains[Math.floor(Math.random() * subdomains.length)];
                var url = `https://${s}.tile.opentopomap.org/${zoom}/${tile[0]}/${tile[1]}.png`;
                var path = `${zoom}/${tile[0]}/`;
                var filename = `${tile[1]}.png`;

                window.resolveLocalFileSystemURL(
                    cordova.file.dataDirectory + path + filename,
                    function (entry) {
                        // Тайл уже существует, используем его
                        callback(entry.nativeURL);
                    },
                    function () {
                        // Тайл не существует, скачиваем его
                        saveTile(url, path, filename, callback);
                    }
                );
            }else{
                var s = subdomains[Math.floor(Math.random() * subdomains.length)];
                return `https://${s}.tile.opentopomap.org/${zoom}/${tile[0]}/${tile[1]}.png`;
            }
        };*/

        /*var layer = new ymaps.Layer(function (tile, zoom) {
            return new ymaps.vow.Promise(function (resolve) {
                getTileUrl(tile, zoom, function (tileUrl) {
                    resolve(tileUrl);
                });
            });
        }, { projection: ymaps.projection.sphericalMercator });*/

        var getTileUrl = function (tile, zoom) {
            var s = subdomains[Math.floor(Math.random() * subdomains.length)];
            return `https://${s}.tile.opentopomap.org/${zoom}/${tile[0]}/${tile[1]}.png`;
        };

        var layer = new ymaps.Layer(getTileUrl, {projection: ymaps.projection.sphericalMercator});

        layer.getCopyrights = function () {
            return ymaps.vow.resolve('');
        };
        layer.getZoomRange = function () {
            return ymaps.vow.resolve([0, 17]);
        };
        return layer;
    };

    ymaps.layer.storage.add('my#layer', MyLayer);
    var myMapType = new ymaps.MapType('MY', ['my#layer']);
    ymaps.mapType.storage.add('yandex#myLayer', myMapType);

    console.log('создаю карту');
    map = new ymaps.Map('map', {
        center: [58.0000, 160.0000],
        zoom: 5,
        type: 'yandex#myLayer',
        controls: []
    }, {
        suppressMapOpenBlock: true // Убираем надпись "открыть в Яндекс.Картах"
    });

    console.log('создаю маркер');
    var MyIconContentLayout = ymaps.templateLayoutFactory.createClass(
        '<div class="rotating-icon border border-dark border-2" style="transform:rotate({{options.rotate}}deg);">' +
        '   {% include "default#image" %}',
        '</div>'
    );

    marker = new ymaps.Placemark([58.0000, 160.0000], {},
        {
            iconLayout: MyIconContentLayout,
            iconImageHref: 'img/arrow-icon.svg',
            iconImageSize: [32, 32],
            iconImageOffset: [0, 0],
            iconRotate: 0
        }
    );

    /*marker = new ymaps.Placemark(
        [58.0000, 160.0000], {},
        {
            iconLayout: 'default#imageWithContent',
            iconImageHref: '', // путь к изображению, если нужно
            iconImageSize: [150, 150], // размер иконки
            iconContentLayout: MyIconContentLayout,
            iconImageOffset: [-25, -25], // смещение, чтобы центрировать иконку
            balloonPanelMaxMapArea: 0, // убираем ограничение размера балуна
            rotate: 0
        }
    );*/

    map.geoObjects.add(marker);

    console.log('создаю кнопки');
    var followButton = new ymaps.control.Button({
        data: {
            content: '<i class="bi bi-person fs-4"></i>'
        },
        options: {
            selectOnClick: true
        }
    });
    var trackerButton = new ymaps.control.Button({
        data: {
            content: '<i class="bi bi-person-walking fs-4"></i>'
        },
        options: {
            selectOnClick: true
        }
    });
    i_Latitude = new ymaps.control.Button({
        data: {
            content: '<p>' + 0 + '</p>'
        }
    });
    i_Longitude = new ymaps.control.Button({
        data: {
            content: '<p>' + 0 + '</p>'
        }
    });
    i_Altitude = new ymaps.control.Button({
        data: {
            content: '<p>' + 0 + '</p>'
        }
    });
    i_Accuracy = new ymaps.control.Button({
        data: {
            content: '<p>' + 0 + '</p>'
        }
    });
    i_AltitudeAccuracy = new ymaps.control.Button({
        data: {
            content: '<p>' + 0 + '</p>'
        }
    });
    i_Heading = new ymaps.control.Button({
        data: {
            content: '<p>' + 0 + '</p>'
        }
    });
    i_Speed = new ymaps.control.Button({
        data: {
            content: '<p>' + 0 + '</p>'
        }
    });

    i_Latitude.options.set('maxWidth', 300);
    i_Longitude.options.set('maxWidth', 300);
    i_Altitude.options.set('maxWidth', 300);
    i_Accuracy.options.set('maxWidth', 300);
    i_AltitudeAccuracy.options.set('maxWidth', 300);
    i_Heading.options.set('maxWidth', 300);
    i_Speed.options.set('maxWidth', 300);

    // Создаем контейнер для кнопок
    var buttonsContainer = new ymaps.control.ListBox({
        data: {
          content:'Данные'
        },
        items: [
            i_Latitude,
            i_Longitude,
            i_Altitude,
            i_Accuracy,
            i_AltitudeAccuracy,
            i_Heading,
            i_Speed
        ]
    });

    map.controls.add(buttonsContainer, { float: 'left' });
    map.controls.add(trackerButton);
    map.controls.add(followButton);

    // Обработчик нажатия на кнопку
    followButton.events.add('click', function () {
        followUser = !followUser; // Меняем флаг на противоположный
        if (followUser) {
            followButton.data.set('content', '<i class="bi bi-person-fill fs-4"></i>');
        } else {
            followButton.data.set('content', '<i class="bi bi-person fs-4"></i>');
        }
    });

    trackerButton.events.add('click', function () {
        drawTrack = !drawTrack; // Меняем флаг на противоположный
        if (drawTrack) {
            trackerButton.data.set('content', '<i class="bi bi-person-standing fs-4"></i>');
        } else {
            trackerButton.data.set('content', '<i class="bi bi-person-walking fs-4"></i>');
            track = []; // Очистите трек, если вы хотите начать новый трек
            // Если на карте есть линия, удалите ее
            if (polyline) {
                map.geoObjects.remove(polyline);
                polyline = null;
            }
        }
    });

    console.log('пробую добавить трек маршрут');
    //gpxParser(map,'Налычево_Таловские');
    //addParkBoundaries('Налычево');
    loadSavedPhotos();

    /*map.events.add('click', function (e) {
        var coords = e.get('coords');
        console.log('Координаты точки: ' + coords[0].toFixed(6) + ', ' + coords[1].toFixed(6));
    });

    // Проверка проекции карты и установка на EPSG:3857, если необходимо
    var currentProjection = map.options.get('projection');
    if (currentProjection !== ymaps.projection.sphericalMercator) {
        console.log('Проекция карты отличается от EPSG:3857. Настройка проекции...');
        map.options.set('projection', ymaps.projection.sphericalMercator);
    }*/

    startTacker();
}

function startTacker() {
    enableInsomnia();
    /*watchID = navigator.geolocation.watchPosition(onSuccess,onError,
        {
        enableHighAccuracy: true, // Запрашиваем максимально возможную точность
        //timeout: 5000, // Задаем таймаут в 5 секунд
        maximumAge: 0 // Запрашиваем всегда только свежие данные
        }
    );*/
    startMockGeolocation();
}

function stopTracker(id){
    navigator.geolocation.clearWatch(id);
    disableInsomnia();
    hideCamera();
    firstStep = true;
}

function onSuccess(position){
    // Получаем координаты пользователя и некоторые другие полезные данные
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var altitude = position.coords.altitude;
    var accuracy = position.coords.accuracy;
    var altitudeAccuracy = position.coords.altitudeAccuracy;
    var heading = position.coords.heading;
    var speed = position.coords.speed;
    var timestamp = getDate(position.timestamp);
    var zoom = getZoom(speed);

    if (!prevCoords) {
        prevCoords = [latitude, longitude];
        prevTimestamp = timestamp;
        return;
    }else {
        var distance = getDistanceFromLatLonInMeters(prevCoords[0], prevCoords[1], latitude, longitude);
        var timeDiff = timestamp - prevTimestamp;

        if (distance > MAX_DISTANCE && timeDiff < MIN_TIME_DIFF) {
            // Если дистанция слишком большая и прошло меньше допустимого времени, игнорируем это значение
            return;
        }

        // Обновляем предыдущие координаты и время
        prevCoords = [latitude, longitude];
        prevTimestamp = timestamp;
    }

    i_Latitude.data.set('content', '<p>Широта: ' + latitude + '</p>');
    i_Longitude.data.set('content', '<p>Долгота: ' + longitude + '</p>');
    i_Altitude.data.set('content', '<p>Высота: ' + altitude + '</p>');
    i_Accuracy.data.set('content', '<p>Точность: ' + accuracy + '</p>');
    i_AltitudeAccuracy.data.set('content', '<p>Точность высоты: ' + altitudeAccuracy + '</p>');
    i_Heading.data.set('content', '<p>Направление: ' + heading + '</p>');
    i_Speed.data.set('content', '<p>Скорость: ' + speed + '</p>');

    smoothMoveMarker(marker, {lat: latitude, lng: longitude});
    smoothRotateMarker(marker, heading);

    if (firstStep) {
        cameraControl(latitude, longitude, zoom);
        firstStep = false;
    }

    if(drawTrack){
        drawingTrack({lat: latitude, lng: longitude});
    }

    if (followUser) {
        cameraControl(latitude, longitude, zoom);
    }
}

function drawingTrack(point){
    track.push([point.lat,point.lng]);

    // Если на карте уже есть линия, удалите ее
    if (polyline) {
        map.geoObjects.remove(polyline);
    }

    polyline = new ymaps.Polyline(track, {}, {
        strokeColor: "#0000FF",
        strokeWidth: 4
    });

    map.geoObjects.add(polyline);
}

// Плавное перемещение маркера
function smoothMoveMarker(marker, newPosition) {
    var start = marker.geometry.getCoordinates(),
        end = [newPosition.lat, newPosition.lng],
        duration = 1000, // Продолжительность анимации в миллисекундах
        startTime = new Date().getTime(), // Время начала анимации
        animateMarker = function() {
            var time = new Date().getTime() - startTime,
                percent = time / duration;
            if (percent < 1) {
                var newPosition = [
                    start[0] + (end[0] - start[0]) * percent,
                    start[1] + (end[1] - start[1]) * percent
                ];
                marker.geometry.setCoordinates(newPosition);
                requestAnimationFrame(animateMarker);
            } else {
                marker.geometry.setCoordinates(end);
            }
        };
    animateMarker();
}

function correctHeading(startHeading, endHeading) {
    var delta = endHeading - startHeading;
    if (delta > 180) {
        delta -= 360;
    } else if (delta < -180) {
        delta += 360;
    }
    return delta;
}

function smoothRotateMarker(marker, newHeading) {
    marker.options.set('iconRotate', newHeading);
    /*var startHeading = marker.options.get('iconRotate'),
        endHeading = newHeading,
        duration = 1000, // Продолжительность анимации в миллисекундах
        startTime = new Date().getTime(), // Время начала анимации
        animateRotation = function() {
            var time = new Date().getTime() - startTime,
                percent = time / duration;

            // Коррекция угла для плавного вращения
            var delta = correctHeading(startHeading, endHeading);

            if (percent < 1) {
                var interpolatedHeading = startHeading + delta * percent;
                interpolatedHeading = (interpolatedHeading + 360) % 360;

                marker.options.set('iconRotate', interpolatedHeading);
                /!*marker.options.set('iconContentLayout', ymaps.templateLayoutFactory.createClass(
                    '<div class="rotating-icon" style="transform: rotate(' + interpolatedHeading + 'deg);">' +
                    '   {% include "default#image" %}',
                    '</div>'
                ));*!/
                /!*marker.options.set('rotate', interpolatedHeading);
                marker.options.set('iconContentLayout', ymaps.templateLayoutFactory.createClass(
                    '<div class="rotating-icon" style="transform: rotate(' + interpolatedHeading + 'deg);">' +
                    '   <img src="img/navi-arrow.webp"/>' +
                    '</div>'
                ));*!/
                requestAnimationFrame(animateRotation);
            } else {
                if (endHeading < 0) {
                    endHeading += 360;
                } else if (endHeading >= 360) {
                    endHeading -= 360;
                }
                marker.options.set('rotate', endHeading);
                marker.options.set('iconContentLayout', ymaps.templateLayoutFactory.createClass(
                    '<div class="rotating-icon" style="transform: rotate(' + endHeading + 'deg);">' +
                    '   <img src="img/navi-arrow.webp"/>' +
                    '</div>'
                ));
            }
        };
    animateRotation();*/
}

function cameraControl(latitude,longitude, originalZoom){
    var zoom = Math.round(originalZoom);
    map.panTo([latitude, longitude], {
        duration: 1000 // Длительность анимации в миллисекундах
    })
        .then(() => {
            // Устанавливаем зум карты после перемещения
            map.setZoom(zoom, {
                duration: 500 // Длительность анимации в миллисекундах
            });
        });
}

function getDate(timestamp){
    var date = new Date(timestamp); // преобразуем timestamp в объект Date

    var day = date.getDate(); // получаем день месяца
    var month = date.getMonth() + 1; // получаем месяц (от 1 до 12)
    var year = date.getFullYear(); // получаем год

    var hours = date.getHours(); // получаем часы (от 0 до 23)
    var minutes = date.getMinutes(); // получаем минуты (от 0 до 59)
    var seconds = date.getSeconds(); // получаем секунды (от 0 до 59)

    return  day + '.' + month + '.' + year + ' ' + hours + ':' + minutes + ':' + seconds;
}

function onError(error){
    $('#content').empty();
    $('#content').append(
        '<div class="container">' +
        '   <div class="row">' +
        '       <div class="col">' +
        '           <p class="fs-2 text-dark">Ошибка!</p>' +
        '           <p>' + error + '</p>' +
        '       </div>' +
        '   </div>' +
        '</div>'
    );
}

function hammerTime(){
    // Initialize Hammer.js for the touch-carousel element
    var touchCarousel = document.querySelector('.touch-carousel');
    var mc = new Hammer(touchCarousel);

    // Configure Hammer.js to recognize swipe gestures
    mc.get('swipe').set({direction: Hammer.DIRECTION_HORIZONTAL});

    // Handle swipe left events
    mc.on('swipeleft', function (ev) {
        ev.preventDefault();
        $('#columnsCarousel').carousel('next');
    });

    // Handle swipe right events
    mc.on('swiperight', function (ev) {
        ev.preventDefault();
        $('#columnsCarousel').carousel('prev');
    });

    // Handle button clicks
    $('[id^=btn-column-]').click(function (ev) {
        ev.preventDefault();
        var columnIndex = parseInt(this.id.split('-')[2], 10);
        $('#columnsCarousel').carousel(columnIndex - 1);
    });
}

function getZoom(speed){
    var correctSpeed = speed;
    if(correctSpeed > 60){
        correctSpeed = 60;
    }
    if(correctSpeed < 1){
        correctSpeed = 1;
    }

    var zoom = 17 - ((correctSpeed / 60) * 17);
    if(zoom < 1){
        zoom = 1;
    }
    if(zoom > 17){
        zoom = 17;
    }
    return zoom;
}

function showCamera(){
    $(document).ready(function () {
        var footerRow = $('#footerRow');
        var middleCol = $('#middleCol');
        var middleIcon = middleCol.find('.expand');

        middleCol.removeClass('hidden');
        footerRow.removeClass('row-cols-4').addClass('row-cols-5');
        setTimeout(function () {
            middleIcon.addClass('expanded');
        }, 50); // Добавляем небольшую задержку для активации анимации
    });
}

function hideCamera() {
    $(document).ready(function () {
        var footerRow = $('#footerRow');
        var middleCol = $('#middleCol');
        var middleIcon = middleCol.find('.expand');

        middleIcon.removeClass('expanded');
        setTimeout(function () {
            middleCol.addClass('hidden');
            footerRow.removeClass('row-cols-5').addClass('row-cols-4');
        }, 500); // Добавляем задержку, чтобы завершить анимацию
    });
}

function addParkBoundaries(parkName) {
    fetch('borders/' + parkName + '.osm') // Путь к вашему файлу с границами парка Налычево
        .then(response => response.text())
        .then(xmlData => {
            const parkBoundaries = parseOSMData(xmlData);
            // Отображаем границы на карте
            parkBoundaries.forEach(coordinates => {
                // Трансформируем координаты для правильного формата Яндекс.Карт
                const transformedCoordinates = coordinates.map(coord => [coord[1], coord[0]]);
                const parkBoundary = new ymaps.Polyline(
                    coordinates,
                    {},
                    { strokeColor: "#FF0000", strokeWidth: 2 }
                );
                map.geoObjects.add(parkBoundary);
            });
        })
        .catch(error => console.error("Ошибка загрузки файла OSM: ", error));
}

function loadSavedPhotos() {
    var savedPhotos = JSON.parse(localStorage.getItem('photos')) || [];
    savedPhotos.forEach(function(photoData) {
        addPhotoMarker(photoData);
    });
}

function startMockGeolocation() {
    var latitude = 37.7749; // Начальные координаты
    var longitude = -122.4194;
    var heading = 0; // Начальное направление

    watchID = setInterval(function() {
        heading -= 19; // Увеличиваем направление
        if (heading >= 360) {
            heading = 0;
        }
        if(heading < 0){
            heading = 360;
        }

        var position = {
            coords: {
                latitude: latitude,
                longitude: longitude,
                altitude: null,
                accuracy: 10,
                altitudeAccuracy: null,
                heading: heading,
                speed: 0.0001
            },
            timestamp: Date.now()
        };

        // Вызываем ваш onSuccess метод с фейковыми данными
        onSuccess(position);

        // Меняем координаты для следующего вызова
        latitude += 0.0001;
        longitude += 0.0001;
    }, 1000); // Обновляем каждую секунду
}

function stopMockGeolocation() {
    clearInterval(watchID);
}

loadMapPage();

