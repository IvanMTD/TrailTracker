let watchID = null;
let map = null;
let myPlacemark = null;

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

var marker = null; // Объявляем переменную для маркера

var arrowIcon = L.icon({
    iconUrl: 'img/navi-arrow.webp', // Путь к изображению стрелки
    iconSize: [48, 48], // Размеры иконки
    iconAnchor: [12, 12], // Точка, куда указывает стрелка (в данном случае, середина изображения)
});

function onSuccess(position){
    // Получаем координаты пользователя
    var lat = position.coords.latitude;
    var lng = position.coords.longitude;

    // Если маркер уже существует, перемещаем его в новую позицию
    if (marker) {
        marker.setLatLng([lat, lng]).update();
    } else {
        // Создаем карту
        var map = L.map('map', {
            zoomControl: false // Отключаем элементы управления картой
        }).setView([lat, lng], 18); // Устанавливаем центр карты и уровень масштабирования

        // Добавляем слой OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        // Создаем маркер для текущей позиции пользователя с пользовательской иконкой стрелочки
        marker = L.marker([lat, lng], { icon: arrowIcon }).addTo(map);
            //.bindPopup('Вы здесь.')
            //.openPopup();
    }

    // Поворачиваем иконку маркера так, чтобы она указывала в направлении движения
    if (position.coords.heading) {
        marker.setRotationAngle(position.coords.heading);
    }

    // Поворачиваем карту так, чтобы маркер был в центре
    map.panTo([lat, lng]);
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

