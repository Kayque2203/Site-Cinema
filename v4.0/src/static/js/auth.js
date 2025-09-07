// Configuração da API
const API_BASE = '/api';

// Utilitários para mensagens
function showMessage(container, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showError(container, message) {
    showMessage(container, message, 'error');
}

function showSuccess(container, message) {
    showMessage(container, message, 'success');
}

function showLoading(button, loadingElement) {
    button.disabled = true;
    loadingElement.classList.add('show');
}

function hideLoading(button, loadingElement) {
    button.disabled = false;
    loadingElement.classList.remove('show');
}

// Verificar autenticação
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/check-auth`, {
            credentials: 'include'
        });
        const data = await response.json();
        return data.authenticated ? data.user : null;
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return null;
    }
}

// Atualizar navegação baseada no status de autenticação
async function updateNavigation() {
    const user = await checkAuth();
    const nav = document.querySelector('.nav ul');
    
    if (user) {
        // Usuário logado - mostrar menu do usuário
        const userMenuItem = nav.querySelector('li:last-child');
        if (userMenuItem) {
            userMenuItem.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <a href="#" id="user-dropdown" style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-user"></i>
                        ${user.username}
                        <i class="fas fa-chevron-down" style="font-size: 0.8rem;"></i>
                    </a>
                    <div id="dropdown-menu" style="display: none; position: absolute; top: 100%; right: 0; background: white; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); min-width: 200px; z-index: 1000;">
                        <a href="perfil.html" style="display: block; padding: 1rem; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">
                            <i class="fas fa-user"></i> Meu Perfil
                        </a>
                        <a href="#" id="logout-btn" style="display: block; padding: 1rem; color: #e74c3c; text-decoration: none;">
                            <i class="fas fa-sign-out-alt"></i> Sair
                        </a>
                    </div>
                </div>
            `;
            
            // Adicionar eventos do dropdown
            const dropdown = document.getElementById('user-dropdown');
            const menu = document.getElementById('dropdown-menu');
            const logoutBtn = document.getElementById('logout-btn');
            
            dropdown.addEventListener('click', (e) => {
                e.preventDefault();
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            });
            
            // Fechar dropdown ao clicar fora
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    menu.style.display = 'none';
                }
            });
            
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await logout();
            });
        }
    } else {
        // Usuário não logado - mostrar links de login/cadastro
        const lastItem = nav.querySelector('li:last-child');
        if (lastItem && !lastItem.innerHTML.includes('Entrar')) {
            lastItem.innerHTML = '<a href="login.html">Entrar</a>';
            
            // Adicionar link de cadastro se não existir
            const cadastroItem = document.createElement('li');
            cadastroItem.innerHTML = '<a href="cadastro.html">Cadastrar</a>';
            nav.appendChild(cadastroItem);
        }
    }
}

// Logout
async function logout() {
    try {
        const response = await fetch(`${API_BASE}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Formulário de login
if (document.getElementById('login-form')) {
    const form = document.getElementById('login-form');
    const messageContainer = document.getElementById('message-container');
    const loginBtn = document.getElementById('login-btn');
    const loading = document.getElementById('loading');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        showLoading(loginBtn, loading);
        
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showSuccess(messageContainer, result.message);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showError(messageContainer, result.error);
            }
        } catch (error) {
            showError(messageContainer, 'Erro de conexão. Tente novamente.');
        } finally {
            hideLoading(loginBtn, loading);
        }
    });
}

// Formulário de cadastro
if (document.getElementById('register-form')) {
    const form = document.getElementById('register-form');
    const messageContainer = document.getElementById('message-container');
    const registerBtn = document.getElementById('register-btn');
    const loading = document.getElementById('loading');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        
        // Validar senhas
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        
        if (password !== confirmPassword) {
            showError(messageContainer, 'As senhas não coincidem.');
            return;
        }
        
        // Coletar gêneros selecionados
        const generos = [];
        const generosCheckboxes = document.querySelectorAll('input[name="generos"]:checked');
        generosCheckboxes.forEach(checkbox => {
            generos.push(checkbox.value);
        });
        
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: password,
            nome_completo: formData.get('nome_completo'),
            telefone: formData.get('telefone') || null,
            data_nascimento: formData.get('data_nascimento') || null,
            generos_preferidos: generos
        };
        
        showLoading(registerBtn, loading);
        
        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showSuccess(messageContainer, result.message);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showError(messageContainer, result.error);
            }
        } catch (error) {
            showError(messageContainer, 'Erro de conexão. Tente novamente.');
        } finally {
            hideLoading(registerBtn, loading);
        }
    });
}

// Proteger páginas que requerem autenticação
async function requireAuth() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    return user;
}

// Inicializar navegação quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
});

// Exportar funções para uso em outros scripts
window.authUtils = {
    checkAuth,
    requireAuth,
    showError,
    showSuccess,
    showLoading,
    hideLoading,
    API_BASE
};

