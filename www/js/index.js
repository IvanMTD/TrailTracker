var watchID = null;
var map = null;

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
            startTacker();
        });
}

function calcMapHeight(){
    // Вычисляем высоту header
    var headerHeight = document.querySelector('header').offsetHeight;

    // Вычисляем высоту footer
    var footerHeight = document.querySelector('footer').offsetHeight;

    // Устанавливаем высоту для карты, учитывая высоту header и footer
    var mapHeight = window.innerHeight - (headerHeight + footerHeight);
    document.getElementById('map').style.height = mapHeight + 15 + 'px';
}

var arrowIcon = L.icon({
    iconUrl: 'img/navi-arrow.webp', // Путь к изображению стрелки
    iconSize: [48, 48], // Размеры иконки
    iconAnchor: [12, 12], // Точка, куда указывает стрелка (в данном случае, середина изображения)
});

var arrowMarker;
var prevPoint = null; // сохраняем предыдущую точку
var trackPoints = [];
var trackLine;

function createMap(){
    // Создаем карту
    map = L.map('map', {
        zoomControl: false // Отключаем элементы управления картой
    }).setView([0, 0], 18); // Устанавливаем центр карты и уровень масштабирования

    // Добавляем слой OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    trackLine = L.polyline(trackPoints, {color: 'blue'}).addTo(map);

    // Создаем маркер для текущей позиции пользователя с пользовательской иконкой стрелочки
    arrowMarker = L.marker([0, 0], { icon: arrowIcon }).addTo(map);
    //.bindPopup('Вы здесь.').openPopup();
}

function startTacker() {
    watchID = navigator.geolocation.watchPosition(onSuccess,onError,
        {
        enableHighAccuracy: true, // Запрашиваем максимально возможную точность
        timeout: 5000, // Задаем таймаут в 5 секунд
        maximumAge: 0 // Запрашиваем всегда только свежие данные
        }
    );
}

function stopTracker(id){
    navigator.geolocation.clearWatch(id);
}

function onSuccess(position){
    // Получаем координаты пользователя
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var altitude = position.coords.altitude;
    var accuracy = position.coords.accuracy;
    var altitudeAccuracy = position.coords.altitudeAccuracy;
    var heading = position.coords.heading;
    var speed = position.coords.speed;
    var timestamp = position.timestamp;

    var corectSpeed = speed;
    if(corectSpeed > 60){
        corectSpeed = 60;
    }
    if(corectSpeed < 1){
        corectSpeed = 1;
    }

    let zoom = 18 - (corectSpeed / 60 * 18);
    if(zoom < 1){
        zoom = 1;
    }
    if(zoom > 18){
        zoom = 18;
    }

    console.log('Широта: ' + latitude);
    console.log('Долгота: ' + longitude);

    console.log('Высота: ' + altitude);
    console.log('Уровень точности координат широты и долготы в метрах: ' + accuracy);
    console.log('Уровень точности координаты высоты в метрах: ' + altitudeAccuracy);
    console.log('Направление движения, указанное в градусах, считая по часовой стрелке относительно истинного севера: ' + heading);
    console.log('Текущая путевая скорость устройства, указанная в метрах в секунду: ' + speed);

    console.log("Timestamp: " + timestamp);

    // Если предыдущая точка не существует, сохраняем текущую точку в качестве предыдущей
    if (!prevPoint) {
        prevPoint = [latitude, longitude];
    }
    // Вычисляем расстояние между текущей и предыдущей точками
    var distance = L.latLng([latitude, longitude]).distanceTo(L.latLng(prevPoint));

    // Если расстояние больше 5 метров, добавляем точку в массив для отрисовки и сохраняем текущую точку в качестве предыдущей
    if (distance > 5) {
        trackPoints.push([latitude, longitude]);
        prevPoint = [latitude, longitude];

        // Обновляем линию на карте
        trackLine.setLatLngs(trackPoints);

        // Если маркер уже существует, перемещаем его в новую позицию
        if (arrowMarker) {
            arrowMarker.setLatLng([latitude, longitude]).update();
        } else{
            arrowMarker = L.marker([latitude, longitude], { icon: arrowIcon }).addTo(map);
        }

        // Поворачиваем иконку маркера стрелочки так, чтобы она указывала в направлении движения
        if (position.coords.heading) {
            var currentAngle = arrowMarker.options.rotationAngle; // сохраняем текущий угол поворота маркера
            var newAngle = position.coords.heading;
            var angleDiff = newAngle - currentAngle;
            var angleStep = 5; // шаг изменения угла поворота в градусах

            // Если разница между углами больше шага, изменяем угол поворота на шаг
            if (Math.abs(angleDiff) > angleStep) {
                if (angleDiff > 0) {
                    newAngle = currentAngle + angleStep;
                } else {
                    newAngle = currentAngle - angleStep;
                }
            }

            // Устанавливаем новый угол поворота с небольшой задержкой
            setTimeout(function() {
                arrowMarker.setRotationAngle(newAngle);
            }, 50); // задержка в миллисекундах
        }

        // Поворачиваем карту так, чтобы маркер был в центре
        map.flyTo([latitude, longitude], zoom, {
            animate: true,
            duration: 1 // длительность анимации в секундах
        });
    }
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

loadMainPage();

