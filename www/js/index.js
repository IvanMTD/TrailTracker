let watchID = null;
let map = null;
let myPlacemark = null;


page('/', loadMainPage);
page('/info', loadInfoPage);
page('/profile', loadProfilePage);
page('/map', loadMapPage);
page();

loadMainPage();

function loadMainPage(ctx, next) {
    fetch('main.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
        });
}


function loadInfoPage(ctx, next) {
    fetch('info.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;

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
        });
}

function loadProfilePage(ctx, next) {
    fetch('profile.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
        });
}

function loadMapPage(ctx, next) {
    fetch('map.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
            initGeo();
        });
}

function initGeo() {
    //watchID = navigator.geolocation.watchPosition(onSuccess, onError, { enableHighAccuracy: true });
    navigator.geolocation.watchPosition(onSuccess,onError,
        {
        enableHighAccuracy: true, // Запрашиваем максимально возможную точность
        timeout: 10000, // Задаем таймаут в 5 секунд
        maximumAge: 0 // Запрашиваем всегда только свежие данные
        }
    );
}

let num = 0;
function onSuccess(position){
    num++;
    console.log(position.coords.longitude + ' | ' + position.coords.latitude + ' - ' + num);
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

/*async function onSuccess(position){
    console.log(position.coords.latitude);
    console.log(position.coords.longitude);
    // Промис `ymaps3.ready` будет зарезолвлен, когда загрузятся все компоненты основного модуля API
    await ymaps3.ready;

    const {YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer} = ymaps3;
    const {YMapDefaultMarker} = await ymaps3.import('@yandex/ymaps3-markers@0.0.1');

    map = new YMap(
        // Передаём ссылку на HTMLElement контейнера
        document.getElementById('map'),
        // Передаём параметры инициализации карты
        {
            location: {
                // Координаты центра карты
                center: [position.coords.longitude, position.coords.latitude],

                // Уровень масштабирования
                zoom: 15
            }
        },
        [
            // Add a map scheme layer
            new YMapDefaultSchemeLayer({}),
            // Add a layer of geo objects to display the markers
            new YMapDefaultFeaturesLayer({})
        ]
    );

    // Добавляем слой для отображения схематической карты
    map.addChild(new YMapDefaultSchemeLayer());

    setMarker(position);

    // Обновляем координаты точки при изменении координат
    navigator.geolocation.watchPosition(
        (position) => {
            setMarker(position);
        },
        onError,
        { enableHighAccuracy: true }
    );
}

async function setMarker(position){
    const {YMapDefaultMarker} = await ymaps3.import('@yandex/ymaps3-markers@0.0.1');

    const markerElement = document.createElement('div');
    markerElement.className = 'marker-class';
    markerElement.innerText = "I'm marker!";

    myPlacemark = new YMapDefaultMarker(
        {
            coordinates: [position.coords.longitude, position.coords.latitude],
            draggable: false,
            mapFollowsOnDrag: true
        },
        markerElement
    );

    map.addChild(myPlacemark);
}

async function onError(error){
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
}*/

