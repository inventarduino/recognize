// Simulamos una base de datos simple
const users = [
    { username: "usuario1", password: "clave123", balance: 100 },
    { username: "usuario2", password: "abc456", balance: 50 },
    { username: "admin", password: "admin123", balance: 1000 }
];

// Función para guardar datos en localStorage
function saveData() {
    localStorage.setItem('virtualCoinUsers', JSON.stringify(users));
}

// Función para cargar datos desde localStorage
function loadData() {
    const savedData = localStorage.getItem('virtualCoinUsers');
    if (savedData) {
        users = JSON.parse(savedData);
    }
}

// Cargamos datos al iniciar
loadData();