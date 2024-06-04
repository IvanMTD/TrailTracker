var watchID = null;
var map = null;
var firstStep = true;
var marker = null;
var prevPoint = null;
var followUser = false;

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
    var MyLayer = function (){
        var layer = new ymaps.Layer('http://tile.openstreetmap.org/%z/%x/%y.png');
        layer.getCopyrights = function () {
            return ymaps.vow.resolve('');
        };
        layer.getZoomRange = function () {
            return ymaps.vow.resolve([0, 18]);
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
        //type: 'yandex#myLayer',
        controls: []
    }, {
        suppressMapOpenBlock: true // Убираем надпись "открыть в Яндекс.Картах"
    });

    console.log('создаю маркер');
    marker = new ymaps.Placemark([58.0000, 160.0000], {}, {
        iconLayout: 'default#image',
        iconImageHref: 'img/navi-arrow.webp',
        iconImageSize: [32, 32],
        iconImageOffset: [-16, -16]
    });

    // Добавляем маркер на карту
    map.geoObjects.add(marker);

    // Создаем кнопку, которая будет включать/отключать центрирование камеры на маркере
    var followButton = new ymaps.control.Button({
        data: {
            content: '<i class="bi bi-person fs-4"></i>'
        },
        options: {
            selectOnClick: true
        }
    });
    // Добавляем кнопку на карту
    map.controls.add(followButton);

    // Обработчик нажатия на кнопку
    followButton.events.add('select', function () {
        followUser = !followUser; // Меняем флаг на противоположный
        if (followUser) {
            console.log(followUser);
            followButton.data.set('content', '<i class="bi bi-person-fill fs-4"></i>');
        } else {
            console.log(followUser);
            followButton.data.set('content', '<i class="bi bi-person fs-4"></i>');
        }
    });
    startTacker();
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

    setInfo(latitude);

    // Если предыдущая точка не существует, сохраняем текущую точку в качестве предыдущей
    if (!prevPoint) {
        prevPoint = [latitude, longitude];
    }

    marker.geometry.setCoordinates([latitude, longitude]);
    marker.options.set('iconImageOffset', [-16, -16 + (heading / 360) * 32]);

    if(firstStep){
        cameraControl(latitude,longitude,zoom);
        firstStep = false;
    }

    if(followUser){
        cameraControl(latitude,longitude,zoom);
    }

    prevPoint = [latitude, longitude];
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

/*function onSuccess(position){
    // Получаем координаты пользователя и некоторые другие полезные данные
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var altitude = position.coords.altitude;
    var accuracy = position.coords.accuracy;
    var altitudeAccuracy = position.coords.altitudeAccuracy;
    var heading = position.coords.heading;
    var speed = position.coords.speed;
    var timestamp = position.timestamp;

    var date = new Date(timestamp); // преобразуем timestamp в объект Date

    var day = date.getDate(); // получаем день месяца
    var month = date.getMonth() + 1; // получаем месяц (от 1 до 12)
    var year = date.getFullYear(); // получаем год

    var hours = date.getHours(); // получаем часы (от 0 до 23)
    var minutes = date.getMinutes(); // получаем минуты (от 0 до 59)
    var seconds = date.getSeconds(); // получаем секунды (от 0 до 59)

    var result = day + '.' + month + '.' + year + ' ' + hours + ':' + minutes + ':' + seconds;

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

    $('#information').empty();
    /!*setInfo(latitude);
    setInfo(longitude);
    setInfo(altitude);
    setInfo(accuracy);
    setInfo(altitudeAccuracy);
    setInfo('Направление: ' + heading);
    setInfo(speed);
    setInfo(result);*!/

    // Если предыдущая точка не существует, сохраняем текущую точку в качестве предыдущей
    if (!prevPoint) {
        prevPoint = [latitude, longitude];
    }
    console.log("prev point is: " + prevPoint);
    // Вычисляем расстояние между текущей и предыдущей точками
    var distance = L.latLng([latitude, longitude]).distanceTo(L.latLng(prevPoint));

    console.log('distance: ' + distance);

    // Если расстояние больше 5 метров, добавляем точку в массив для отрисовки и сохраняем текущую точку в качестве предыдущей
    if (distance > 1) {
        trackPoints.push([latitude, longitude]);
        prevPoint = [latitude, longitude];
    }

    // Если маркер уже существует, перемещаем его в новую позицию
    if (arrowMarker) {
        arrowMarker.setLatLng([latitude, longitude], {
            animate: true // включаем анимацию перемещения маркера
        });
    } else {
        arrowMarker = L.marker([latitude, longitude], {
            icon: arrowIcon,
            rotationAngle: 0
        }).addTo(map);
    }

    // Поворачиваем иконку маркера стрелочки так, чтобы она указывала в направлении движения
    if (position.coords.heading) {
        arrowMarker.setRotationAngle(position.coords.heading);
    }

    // Обновляем линию на карте
    trackLine.setLatLngs(trackPoints);
    // Поворачиваем карту так, чтобы маркер был в центре
    if(firstStep) {
        map.flyTo([prevPoint[0], prevPoint[1]], zoom, {
            animate: true,
            duration: 1 // длительность анимации в секундах
        });
        firstStep = false;
    }
}*/

function setInfo(info){
    /*var infoPanel = document.createElement('div');
    infoPanel.className = 'container';
    infoPanel.innerHTML = '' +
        '<div class="row">' +
        '   <div class="col d-flex">' +
        '       <div class="m-auto">' +
        '           <p>' + info + '</p>' +
        '       </div>' +
        '   </div>' +
        '</div>' +
        '';
    map.controls.add(infoPanel);*/

    /*var infoTable = new ymaps.control.Button({
        data: {
            content: info
        }
    });*/
    // Добавляем кнопку на карту
    //map.controls.add(infoTable);
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

loadMapPage();

