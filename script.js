const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwvLWnUvLyLLER923fi0GFSubPlsjl71nJIxOY3mtAcp28HXVzb81OC4gXuwkUk6uTR/exec';

// Función para manejar el inicio de sesión (admin o usuario)
async function login(event, isAdmin = false) {
    event.preventDefault();
    const form = event.target;
    const username = form.querySelector(isAdmin ? '#admin-username' : '#username').value;
    const password = form.querySelector(isAdmin ? '#admin-password' : '#password').value;
    const errorElement = form.querySelector('#login-error');

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getUser&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
        const result = await response.json();

        if (result.error) {
            errorElement.textContent = result.error;
            errorElement.classList.remove('hidden');
            return;
        }

        errorElement.classList.add('hidden');
        form.closest('.container').querySelector('#login-section').classList.add('hidden');
        const panel = form.closest('.container').querySelector(isAdmin ? '#admin-panel' : '#user-panel');
        panel.classList.remove('hidden');

        if (isAdmin) {
            if (username === 'admin') {
                await loadUsers();
            } else {
                errorElement.textContent = 'Acceso denegado: Solo el usuario "admin" puede acceder.';
                errorElement.classList.remove('hidden');
                panel.classList.add('hidden');
                form.closest('.container').querySelector('#login-section').classList.remove('hidden');
            }
        } else {
            document.getElementById('user-name').textContent = result.username;
            document.getElementById('user-balance').textContent = result.balance;
            document.getElementById('transaction-history').textContent = result.history || 'Sin transacciones';
        }
    } catch (error) {
        errorElement.textContent = 'Error al conectar con el servidor';
        errorElement.classList.remove('hidden');
    }
}

// Función para cargar la lista de usuarios en admin.html
async function loadUsers() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getUsers`);
        const users = await response.json();
        const select = document.getElementById('target-username');
        select.innerHTML = '<option value="">Selecciona un usuario</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = user;
            select.appendChild(option);
        });
    } catch (error) {
        document.getElementById('assign-result').textContent = 'Error al cargar usuarios';
        document.getElementById('assign-result').classList.remove('hidden');
    }
}

// Función para asignar monedas
async function assignCoins(event) {
    event.preventDefault();
    const form = event.target;
    const username = form.querySelector('#target-username').value;
    const amount = parseInt(form.querySelector('#amount').value);
    const resultElement = document.getElementById('assign-result');

    if (!username || isNaN(amount) || amount <= 0) {
        resultElement.textContent = 'Por favor, selecciona un usuario y una cantidad válida';
        resultElement.classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch(`${SCRIPT_URL}?action=updateBalance&username=${encodeURIComponent(username)}&amount=${amount}`);
        const result = await response.json();

        if (result.success) {
            resultElement.textContent = `Monedas asignadas. Nuevo saldo: ${result.newBalance}`;
            resultElement.classList.remove('hidden');
            // Actualizar historial
            const historyResponse = await fetch(`${SCRIPT_URL}?action=getUser&username=${encodeURIComponent(username)}&password=dummy`);
            const userData = await historyResponse.json();
            document.getElementById('transaction-history').textContent = userData.history || 'Sin transacciones';
        } else {
            resultElement.textContent = result.error || 'Error al asignar monedas';
            resultElement.classList.remove('hidden');
        }
    } catch (error) {
        resultElement.textContent = 'Error al conectar con el servidor';
        resultElement.classList.remove('hidden');
    }
}

// Función para cerrar sesión
function logout() {
    const container = document.querySelector('.container');
    container.querySelector('#login-section').classList.remove('hidden');
    container.querySelector('#admin-panel, #user-panel').classList.add('hidden');
    document.querySelectorAll('form').forEach(form => form.reset());
    document.querySelectorAll('.error').forEach(error => {
        error.textContent = '';
        error.classList.add('hidden');
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('admin-login-form');
    const userLoginForm = document.getElementById('user-login-form');
    const assignCoinsForm = document.getElementById('assign-coins-form');
    const logoutButtons = document.querySelectorAll('#logout-button');

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => login(e, true));
    }
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', (e) => login(e, false));
    }
    if (assignCoinsForm) {
        assignCoinsForm.addEventListener('submit', assignCoins);
    }
    logoutButtons.forEach(button => {
        button.addEventListener('click', logout);
    });
});