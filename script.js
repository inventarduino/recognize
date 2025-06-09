const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwvLWnUvLyLLER923fi0GFSubPlsjl71nJIxOY3mtAcp28HXVzb81OC4gXuwkUk6uTR/exec';

// Función para manejar el inicio de sesión (admin o usuario)
async function login(event, isAdmin = false) {
    event.preventDefault();
    console.log('Formulario de inicio de sesión enviado, isAdmin:', isAdmin); // Depuración
    const form = event.target;
    const username = form.querySelector(isAdmin ? '#admin-username' : '#username').value;
    const password = form.querySelector(isAdmin ? '#admin-password' : '#password').value;
    const errorElement = form.querySelector('#login-error');

    if (!errorElement) {
        console.error('Elemento #login-error no encontrado en el formulario'); // Depuración
        return;
    }

    try {
        console.log('Enviando solicitud a:', `${SCRIPT_URL}?action=getUser&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`); // Depuración
        const response = await fetch(`${SCRIPT_URL}?action=getUser&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const result = await response.json();

        if (result.error) {
            errorElement.textContent = result.error;
            errorElement.classList.remove('hidden');
            console.log('Error del servidor:', result.error); // Depuración
            return;
        }

        errorElement.classList.add('hidden');
        const loginSection = form.closest('.container').querySelector('#login-section');
        const panel = form.closest('.container').querySelector(isAdmin ? '#admin-panel' : '#user-panel');
        if (!loginSection || !panel) {
            console.error('Sección de login o panel no encontrados'); // Depuración
            return;
        }
        loginSection.classList.add('hidden');
        panel.classList.remove('hidden');

        if (isAdmin) {
            if (username === 'admin') {
                await loadUsers();
            } else {
                errorElement.textContent = 'Acceso denegado: Solo el usuario "admin" puede acceder.';
                errorElement.classList.remove('hidden');
                panel.classList.add('hidden');
                loginSection.classList.remove('hidden');
                console.log('Acceso denegado para usuario no admin'); // Depuración
            }
        } else {
            document.getElementById('user-name').textContent = result.username;
            document.getElementById('user-balance').textContent = result.balance;
            document.getElementById('transaction-history').textContent = result.history || 'Sin transacciones';
            console.log('Usuario autenticado:', result.username); // Depuración
        }
    } catch (error) {
        errorElement.textContent = `Error al conectar con el servidor: ${error.message}`;
        errorElement.classList.remove('hidden');
        console.error('Error en login:', error); // Depuración
    }
}

// Función para cargar la lista de usuarios en admin.html
async function loadUsers() {
    try {
        console.log('Cargando usuarios desde:', `${SCRIPT_URL}?action=getUsers`); // Depuración
        const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const users = await response.json();
        const select = document.getElementById('target-username');
        if (!select) {
            console.error('Elemento #target-username no encontrado'); // Depuración
            return;
        }
        select.innerHTML = '<option value="">Selecciona un usuario</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            select.appendChild(option);
        });
        console.log('Usuarios cargados:', users); // Depuración
    } catch (error) {
        const resultElement = document.getElementById('assign-result');
        if (resultElement) {
            resultElement.textContent = `Error al cargar usuarios: ${error.message}`;
            resultElement.classList.remove('hidden');
        }
        console.error('Error en loadUsers:', error); // Depuración
    }
}

// Función para asignar monedas
async function assignCoins(event) {
    event.preventDefault();
    console.log('Formulario de asignación de monedas enviado'); // Depuración
    const form = event.target;
    const username = form.querySelector('#target-username').value;
    const amount = parseInt(form.querySelector('#amount').value);
    const resultElement = document.getElementById('assign-result');

    if (!resultElement) {
        console.error('Elemento #assign-result no encontrado'); // Depuración
        return;
    }

    if (!username || isNaN(amount) || amount <= 0) {
        resultElement.textContent = 'Por favor, selecciona un usuario y una cantidad válida';
        resultElement.classList.remove('hidden');
        console.log('Validación fallida: username o amount inválidos'); // Depuración
        return;
    }

    try {
        console.log('Enviando solicitud para asignar monedas:', `${SCRIPT_URL}?action=updateBalance&username=${encodeURIComponent(username)}&amount=${amount}`); // Depuración
        const response = await fetch(`${SCRIPT_URL}?action=updateBalance&username=${encodeURIComponent(username)}&amount=${amount}`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const result = await response.json();

        if (result.success) {
            resultElement.textContent = `Monedas asignadas. Nuevo saldo: ${result.newBalance}`;
            resultElement.classList.remove('hidden');
            // Actualizar historial
            const historyResponse = await fetch(`${SCRIPT_URL}?action=getUser&username=${encodeURIComponent(username)}&password=dummy`);
            const userData = await historyResponse.json();
            const historyElement = document.getElementById('transaction-history');
            if (historyElement) {
                historyElement.textContent = userData.history || 'Sin transacciones';
            }
            console.log('Monedas asignadas con éxito, nuevo saldo:', result.newBalance); // Depuración
        } else {
            resultElement.textContent = result.error || 'Error al asignar monedas';
            resultElement.classList.remove('hidden');
            console.log('Error del servidor al asignar monedas:', result.error); // Depuración
        }
    } catch (error) {
        resultElement.textContent = `Error al conectar con el servidor: ${error.message}`;
        resultElement.classList.remove('hidden');
        console.error('Error en assignCoins:', error); // Depuración
    }
}

// Función para cerrar sesión
function logout() {
    console.log('Cerrando sesión'); // Depuración
    const container = document.querySelector('.container');
    if (container) {
        const loginSection = container.querySelector('#login-section');
        const panels = container.querySelector('#admin-panel, #user-panel');
        if (loginSection && panels) {
            loginSection.classList.remove('hidden');
            panels.classList.add('hidden');
        }
        document.querySelectorAll('form').forEach(form => form.reset());
        document.querySelectorAll('.error').forEach(error => {
            error.textContent = '';
            error.classList.add('hidden');
        });
    } else {
        console.error('Contenedor .container no encontrado'); // Depuración
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Documento cargado, inicializando eventos'); // Depuración
    const adminLoginForm = document.getElementById('admin-login-form');
    const userLoginForm = document.getElementById('user-login-form');
    const assignCoinsForm = document.getElementById('assign-coins-form');
    const logoutButtons = document.querySelectorAll('#logout-button');

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            console.log('Evento de submit registrado para admin-login-form'); // Depuración
            login(e, true);
        });
    } else {
        console.warn('admin-login-form no encontrado'); // Depuración
    }

    if (userLoginForm) {
        userLoginForm.addEventListener('submit', (e) => {
            console.log('Evento de submit registrado para user-login-form'); // Depuración
            login(e, false);
        });
    } else {
        console.warn('user-login-form no encontrado'); // Depuración
    }

    if (assignCoinsForm) {
        assignCoinsForm.addEventListener('submit', assignCoins);
    } else {
        console.warn('assign-coins-form no encontrado'); // Depuración
    }

    logoutButtons.forEach(button => {
        button.addEventListener('click', logout);
    });
});
