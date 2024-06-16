let key = 'userData';

function saveUserData(data) {
    console.log('Пробую сохранить данные');
    localStorage.removeItem(key);
    localStorage.setItem(key,JSON.stringify(data));
    console.log('сохранил',JSON.parse(localStorage.getItem(key)));
}

function loadUserData(){
    return JSON.parse(localStorage.getItem(key));
}

function removeData(){
    localStorage.removeItem(key);
}

function loadJWT() {
    console.log('запрашиваю локальные пользовательские данные');
    var data = loadUserData();
    console.log(data);
    if(data){
        console.log('нашлись: ', data.accessToken);
        return data.accessToken;
    }else{
        console.log('данные отсутствуют');
        return null;
    }
}

function doLogout(){
    removeData();
    page('/profile');
}

function sendAuth() {
    // Скрываем предыдущие сообщения об ошибках
    document.getElementById('username').classList.remove('is-invalid');
    document.getElementById('password').classList.remove('is-invalid');
    document.getElementById('usernameError').hidden = true;
    document.getElementById('passwordError').hidden = true;

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const data = {
        username: username,
        password: password
    };

    fetch('https://api.beartrack.ru/v1/auth/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.message);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);

            // Сохранение токена доступа в локальное хранилище
            saveUserData(data);

            // Перенаправление пользователя на страницу /profile
            page('/profile');
        })
        .catch((error) => {
            console.error('Error:', error.message);

            // Обработка ошибок
            if (error.message === 'User Not found.') {
                document.getElementById('username').classList.add('is-invalid');
                document.getElementById('usernameError').hidden = false;
                document.getElementById('password').classList.add('is-invalid');
                document.getElementById('passwordError').hidden = false;
            }
        });
}

function userRegistration(){
    // Скрываем предыдущие сообщения об ошибках
    document.getElementById('regUsername').classList.remove('is-invalid');
    document.getElementById('regUsernameError').hidden = true;
    document.getElementById('regMail').classList.remove('is-invalid');
    document.getElementById('regMailError').hidden = true;

    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regMail').value;
    const password = document.getElementById('regPassword').value;

    console.log(username,email,password);

    const data = {
        username: username,
        email: email,
        password: password
    };

    fetch('https://api.beartrack.ru/v1/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.message);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            // Перенаправление пользователя на страницу /profile
            page('/profile');
        })
        .catch((error) => {
            console.error('Error:', error.message);

            // Обработка ошибок
            if (error.message === 'Failed! Username is already in use!') {
                document.getElementById('regUsername').classList.add('is-invalid');
                document.getElementById('regUsernameError').hidden = false;
            }
            if(error.message === 'Failed! Email is already in use!') {
                document.getElementById('regMail').classList.add('is-invalid');
                document.getElementById('regMailError').hidden = false;
            }
        });
}

function addPerson(){
    $('#add-person').append('' +
        '               <div class="row py-2 pt-3 border-bottom border-2">\n' +
        '                    <div class="col">\n' +
        '                        <div class="form-floating mb-3">\n' +
        '                            <input type="text" class="form-control" id="lastname" placeholder="lastname">\n' +
        '                            <label for="lastname">Фамилия</label>\n' +
        '                        </div>\n' +
        '                        <div class="form-floating mb-3">\n' +
        '                            <input type="text" class="form-control" id="name" placeholder="name">\n' +
        '                            <label for="name">Имя</label>\n' +
        '                        </div>\n' +
        '                        <div class="form-floating mb-3">\n' +
        '                            <input type="text" class="form-control" id="middleName" placeholder="middleName">\n' +
        '                            <label for="middleName">Отчество</label>\n' +
        '                        </div>\n' +
        '                        <div class="form-floating mb-3">\n' +
        '                            <input type="date" class="form-control" id="date" placeholder="date">\n' +
        '                            <label for="date">Дата рождения</label>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                </div>'
    );
}