var watchID = null;
var map = null;
var firstStep = true;
var marker = null;
var prevPoint = null;
var followUser = false;

var i_Latitude = null;
var i_Longitude = null;
var i_Altitude = null;
var i_Accuracy = null;
var i_AltitudeAccuracy = null;
var i_Heading = null;
var i_Speed = null;

page('/', loadMainPage);
page('/info', loadInfoPage);
page('/profile', loadProfilePage);
page('/map', loadMapPage);
page();

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){
    var permissions = cordova.plugins.permissions;
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
            createMap();
        });
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
    // Создаем макет метки.
    /*marker = new ymaps.Placemark([58.0000, 160.0000], {}, {
        iconLayout: 'default#image',
        iconImageHref: 'img/navi-arrow.webp',
        iconRotation: 0,
        iconImageSize: [32, 32],
        iconImageOffset: [-16, -16]
    });*/

    var MyIconContentLayout = ymaps.templateLayoutFactory.createClass(
        '<div class="rotating-icon" style="transform: rotate({{ options.rotate }}deg);">' +
        '<img src="img/navi-arrow.webp"/>' +
        '</div>'
    );

    marker = new ymaps.Placemark([58.0000, 160.0000], {}, {
        iconLayout: 'default#imageWithContent',
        iconImageHref: '',
        //iconImageSize: [64, 64],
        //iconImageOffset: [-16, -16],
        rotate: 0
    });

    // Добавляем маркер на карту
    map.geoObjects.add(marker);

    console.log('создаю кнопку для центрирование на пользователе');
    var followButton = new ymaps.control.Button({
        data: {
            content: '<i class="bi bi-person fs-4"></i>'
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
    map.controls.add(followButton);

    // Обработчик нажатия на кнопку
    followButton.events.add('click', function () {
        followUser = !followUser; // Меняем флаг на противоположный
        if (followUser) {
            console.log(followUser);
            followButton.data.set('content', '<i class="bi bi-person-fill fs-4"></i>');
        } else {
            console.log(followUser);
            followButton.data.set('content', '<i class="bi bi-person fs-4"></i>');
        }
    });

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
    watchID = navigator.geolocation.watchPosition(onSuccess,onError,
        {
        enableHighAccuracy: true, // Запрашиваем максимально возможную точность
        //timeout: 5000, // Задаем таймаут в 5 секунд
        maximumAge: 0 // Запрашиваем всегда только свежие данные
        }
    );
}

function stopTracker(id){
    navigator.geolocation.clearWatch(id);
    firstStep = true;
}

function onSuccess(position){
    // Получаем координаты пользователя и некоторые другие полезные данные
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var altitude = position.coords.altitude;
    var accuracy = position.coords.accuracy;
    var altitudeAccuracy = position.coords.altitudeAccuracy;
    var heading = Math.random() * 360;//position.coords.heading;
    var speed = position.coords.speed;
    var timestamp = getDate(position.timestamp);
    var zoom = getZoom(speed);

    i_Latitude.data.set('content', '<p>Широта: ' + latitude + '</p>');
    i_Longitude.data.set('content', '<p>Долгота: ' + longitude + '</p>');
    i_Altitude.data.set('content', '<p>Высота: ' + altitude + '</p>');
    i_Accuracy.data.set('content', '<p>Точность: ' + accuracy + '</p>');
    i_AltitudeAccuracy.data.set('content', '<p>Точность высоты: ' + altitudeAccuracy + '</p>');
    i_Heading.data.set('content', '<p>Направление: ' + heading + '</p>');
    i_Speed.data.set('content', '<p>Скорость: ' + speed + '</p>');

    // Если предыдущая точка не существует, сохраняем текущую точку в качестве предыдущей
    if (!prevPoint) {
        prevPoint = [latitude, longitude];
    }

    smoothMoveMarker(marker, {lat: latitude, lng: longitude});
    smoothRotateMarker(marker, heading);

    if (firstStep) {
        cameraControl(latitude, longitude, zoom);
        firstStep = false;
    }

    if (followUser) {
        cameraControl(latitude, longitude, zoom);
    }

    prevPoint = [latitude, longitude];
}

// Плавное перемещение маркера
function smoothMoveMarker(marker, newPosition) {
    console.log(marker);
    console.log(newPosition);
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

// Плавное вращение маркера
function smoothRotateMarker(marker, newHeading) {
   /* marker.options.set('rotate', newHeading);
    marker.options.set('iconContentLayout', ymaps.templateLayoutFactory.createClass(
        '<div class="rotating-icon" style="transform: rotate(' + newHeading + 'deg);">' +
        '<img src="img/navi-arrow.webp" width="32" height="32" />' +
        '</div>'
    ));*/
    var startHeading = marker.options.get('rotate'),
        endHeading = newHeading,
        duration = 1000, // Продолжительность анимации в миллисекундах
        startTime = new Date().getTime(), // Время начала анимации
        animateRotation = function() {
            var time = new Date().getTime() - startTime,
                percent = time / duration;
            if (percent < 1) {
                var newHeading = startHeading + (endHeading - startHeading) * percent;
                marker.options.set('rotate', newHeading);
                marker.options.set('iconContentLayout', ymaps.templateLayoutFactory.createClass(
                    '<div class="rotating-icon" style="transform: rotate(' + newHeading + 'deg);">' +
                    '<img src="img/navi-arrow.webp"/>' +
                    '</div>'
                ));
                requestAnimationFrame(animateRotation);
            } else {
                marker.options.set('iconContentLayout', ymaps.templateLayoutFactory.createClass(
                    '<div class="rotating-icon" style="transform: rotate(' + endHeading + 'deg);">' +
                    '<img src="img/navi-arrow.webp"/>' +
                    '</div>'
                ));
            }
        };
    animateRotation();
}

function cameraControl(latitude,longitude,zoom){
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
        '           <p class="fs-2 text-dark">Ошибка соеденения со спутником!</p>' +
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

//coloadMapPage();

