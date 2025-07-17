document.addEventListener('DOMContentLoaded', function() {
    // Configuración de la API
    const API_KEY = '$2a$10$vwab4aJRZ.4653xkFCQGjuz1T.CZfS4IPdJdMoJuahFvZeLjwoJOi';
    const STUDENTS_BIN_ID = '687456d30ff3784d46787889';
    
    // Elementos del DOM
    const loginContainer = document.getElementById('login-container');
    const studentContainer = document.getElementById('student-container');
    const rutInput = document.getElementById('rut');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const studentNameSpan = document.getElementById('student-name');
    const studentCourseSpan = document.getElementById('student-course');
    const balanceAmountDiv = document.getElementById('balance-amount');
    const transactionHistoryDiv = document.getElementById('transaction-history');
    const forgotPasswordLink = document.getElementById('forgot-password');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const closeModal = document.getElementById('close-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsContent = document.getElementById('settings-content');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordError = document.getElementById('password-error');
    
    // Variables de estado
    let currentStudent = null;
    let refreshInterval = null;
    
    // Inicialización
    loginBtn.addEventListener('click', handleLogin);
    rutInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    forgotPasswordLink.addEventListener('click', () => {
        forgotPasswordModal.style.display = 'block';
    });
    closeModal.addEventListener('click', () => {
        forgotPasswordModal.style.display = 'none';
    });
    settingsBtn.addEventListener('click', () => {
        settingsContent.style.display = settingsContent.style.display === 'none' ? 'block' : 'none';
    });
    changePasswordBtn.addEventListener('click', handlePasswordChange);
    
    // Manejar login
    async function handleLogin() {
        const rut = cleanRut(rutInput.value.trim());
        const password = passwordInput.value.trim();
        
        if (!rut || !password) {
            showError('Por favor ingrese RUT y clave', loginError);
            return;
        }
        
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${STUDENTS_BIN_ID}`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': API_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const students = data.record || [];
                
                // Buscar estudiante por RUT y clave
                const student = students.find(s => 
                    cleanRut(s.rut) === rut && s.clave === password
                );
                
                if (student) {
                    currentStudent = student;
                    loginContainer.style.display = 'none';
                    studentContainer.style.display = 'block';
                    updateStudentInfo();
                    
                    // Iniciar actualización automática cada 5 segundos
                    refreshInterval = setInterval(updateStudentInfo, 5000);
                } else {
                    showError('RUT o clave incorrectos', loginError);
                }
            } else {
                throw new Error('Error al cargar los datos');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al iniciar sesión. Intente nuevamente.', loginError);
        }
    }
    
    // Cambiar contraseña
    async function handlePasswordChange() {
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        
        if (!newPassword || !confirmPassword) {
            showError('Por favor ingrese y confirme la nueva contraseña', passwordError);
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError('Las contraseñas no coinciden', passwordError);
            return;
        }
        
        try {
            // Obtener datos actuales
            const response = await fetch(`https://api.jsonbin.io/v3/b/${STUDENTS_BIN_ID}`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': API_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const students = data.record || [];
                
                // Actualizar contraseña del estudiante actual
                const updatedStudents = students.map(s => {
                    if (cleanRut(s.rut) === cleanRut(currentStudent.rut)) {
                        return { ...s, clave: newPassword };
                    }
                    return s;
                });
                
                // Enviar datos actualizados a la API
                const updateResponse = await fetch(`https://api.jsonbin.io/v3/b/${STUDENTS_BIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': API_KEY
                    },
                    body: JSON.stringify(updatedStudents)
                });
                
                if (updateResponse.ok) {
                    currentStudent.clave = newPassword;
                    showError('Contraseña actualizada con éxito', passwordError);
                    newPasswordInput.value = '';
                    confirmPasswordInput.value = '';
                    passwordError.style.color = '#4cd137';
                    passwordError.style.backgroundColor = '#2a3d33';
                    setTimeout(() => {
                        passwordError.textContent = '';
                        passwordError.style.color = '#ff6b6b';
                        passwordError.style.backgroundColor = '#3d2e2e';
                    }, 3000);
                } else {
                    throw new Error('Error al actualizar la contraseña');
                }
            } else {
                throw new Error('Error al cargar los datos');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al actualizar la contraseña. Intente nuevamente.', passwordError);
        }
    }
    
    // Actualizar información del estudiante
    async function updateStudentInfo() {
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${STUDENTS_BIN_ID}`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': API_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const students = data.record || [];
                
                // Buscar estudiante actualizado
                const updatedStudent = students.find(s => 
                    cleanRut(s.rut) === cleanRut(currentStudent.rut)
                );
                
                if (updatedStudent) {
                    currentStudent = updatedStudent;
                    renderStudentData();
                }
            }
        } catch (error) {
            console.error('Error al actualizar datos:', error);
        }
    }
    
    // Renderizar datos del estudiante
    function renderStudentData() {
        studentNameSpan.textContent = `${currentStudent.nombre} ${currentStudent.apellido}`;
        studentCourseSpan.textContent = currentStudent.curso;
        
        // Animación de cambio de saldo
        const currentBalance = parseInt(balanceAmountDiv.textContent) || 0;
        const newBalance = currentStudent.saldo || 0;
        
        if (currentBalance !== newBalance) {
            balanceAmountDiv.classList.add('balance-animate');
            setTimeout(() => {
                balanceAmountDiv.textContent = newBalance;
                balanceAmountDiv.className = newBalance >= 0 ? 'balance positive' : 'balance negative';
                balanceAmountDiv.classList.remove('balance-animate');
            }, 1000); // Duración de la animación
        } else {
            balanceAmountDiv.textContent = newBalance;
            balanceAmountDiv.className = newBalance >= 0 ? 'balance positive' : 'balance negative';
        }
        
        // Renderizar historial
        renderTransactionHistory();
    }
    
    // Renderizar historial de transacciones
    function renderTransactionHistory() {
        if (!currentStudent.historial || currentStudent.historial.length === 0) {
            transactionHistoryDiv.innerHTML = '<p>No hay transacciones registradas</p>';
            return;
        }
        
        let html = '';
        currentStudent.historial.forEach(trans => {
            html += `
                <div class="transaction ${trans.tipo}">
                    <div class="transaction-header">
                        <span class="amount">${trans.tipo === 'credito' ? '+' : '-'}${trans.monto}</span>
                        <span class="date">${formatDate(trans.fecha)}</span>
                    </div>
                    <div class="description">${trans.descripcion}</div>
                    ${trans.administrador ? `<div class="admin">Por: ${trans.administrador}</div>` : ''}
                </div>
            `;
        });
        
        transactionHistoryDiv.innerHTML = html;
    }
    
    // Limpiar RUT (eliminar puntos y guión)
    function cleanRut(rut) {
        return rut ? rut.toString().replace(/\./g, '').replace(/-/g, '') : '';
    }
    
    // Formatear fecha
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-CL', options);
    }
    
    // Mostrar error
    function showError(message, element) {
        element.textContent = message;
        element.parentElement.style.animation = 'shake 0.5s';
        setTimeout(() => element.parentElement.style.animation = '', 500);
    }
    
    // Detener actualización al salir
    window.addEventListener('beforeunload', function() {
        if (refreshInterval) clearInterval(refreshInterval);
    });
});