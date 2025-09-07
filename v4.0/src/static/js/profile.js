// Aguardar carregamento da página
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const user = await window.authUtils.requireAuth();
    if (!user) return;
    
    // Carregar dados do perfil
    await loadProfile();
    await loadCompras();
    
    // Configurar eventos
    setupEventListeners();
});

// Carregar dados do perfil
async function loadProfile() {
    try {
        const response = await fetch(`${window.authUtils.API_BASE}/profile`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const user = await response.json();
            populateProfile(user);
        } else {
            console.error('Erro ao carregar perfil');
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

// Preencher formulário com dados do usuário
function populateProfile(user) {
    // Atualizar header
    document.getElementById('user-name').textContent = user.nome_completo;
    document.getElementById('user-email').textContent = user.email;
    
    // Preencher formulário
    document.getElementById('nome_completo').value = user.nome_completo || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('telefone').value = user.telefone || '';
    document.getElementById('data_nascimento').value = user.data_nascimento || '';
    
    // Marcar gêneros preferidos
    const generos = user.generos_preferidos || [];
    generos.forEach(genero => {
        const checkbox = document.querySelector(`input[name="generos"][value="${genero}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
}

// Carregar histórico de compras
async function loadCompras() {
    const container = document.getElementById('compras-container');
    
    try {
        const response = await fetch(`${window.authUtils.API_BASE}/compras`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const compras = await response.json();
            displayCompras(compras);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar histórico de compras</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar compras:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar histórico de compras</p>
            </div>
        `;
    }
}

// Exibir compras
function displayCompras(compras) {
    const container = document.getElementById('compras-container');
    
    if (compras.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-ticket-alt"></i>
                <p>Você ainda não fez nenhuma compra</p>
                <a href="index.html" class="btn-primary" style="margin-top: 1rem; display: inline-block; text-decoration: none;">
                    Ver Filmes em Cartaz
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = compras.map(compra => `
        <div class="compra-item">
            <div class="compra-header">
                <div class="compra-filme">${compra.filme_nome}</div>
                <div class="compra-status status-${compra.status}">${getStatusText(compra.status)}</div>
            </div>
            
            <div class="compra-details">
                <div class="compra-detail">
                    <i class="fas fa-door-open"></i>
                    <span>${compra.sala_nome}</span>
                </div>
                <div class="compra-detail">
                    <i class="fas fa-clock"></i>
                    <span>${compra.horario}</span>
                </div>
                <div class="compra-detail">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(compra.data_sessao)}</span>
                </div>
                <div class="compra-detail">
                    <i class="fas fa-ticket-alt"></i>
                    <span>${compra.quantidade_ingressos} ingresso(s)</span>
                </div>
                <div class="compra-detail">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>R$ ${compra.valor_total.toFixed(2)}</span>
                </div>
                <div class="compra-detail">
                    <i class="fas fa-calendar-plus"></i>
                    <span>Comprado em ${formatDateTime(compra.created_at)}</span>
                </div>
            </div>
            
            <div class="compra-poltronas">
                <strong>Poltronas:</strong>
                <div class="poltronas-list">
                    ${compra.poltronas.map(poltrona => `<span class="poltrona-badge">${poltrona}</span>`).join('')}
                </div>
            </div>
            
            ${compra.status === 'ativo' ? `
                <div style="margin-top: 1rem; text-align: right;">
                    <button class="btn-cancel" onclick="cancelarCompra(${compra.id})">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Configurar event listeners
function setupEventListeners() {
    // Formulário de perfil
    const profileForm = document.getElementById('profile-form');
    profileForm.addEventListener('submit', handleProfileUpdate);
    
    // Botão alterar senha
    const changePasswordBtn = document.getElementById('change-password-btn');
    changePasswordBtn.addEventListener('click', showPasswordModal);
    
    // Modal de senha
    const passwordForm = document.getElementById('password-form');
    passwordForm.addEventListener('submit', handlePasswordChange);
    
    const cancelPasswordBtn = document.getElementById('cancel-password-btn');
    cancelPasswordBtn.addEventListener('click', hidePasswordModal);
}

// Atualizar perfil
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const messageContainer = document.getElementById('profile-message-container');
    const updateBtn = document.getElementById('update-profile-btn');
    const loading = document.getElementById('profile-loading');
    
    // Coletar gêneros selecionados
    const generos = [];
    const generosCheckboxes = document.querySelectorAll('input[name="generos"]:checked');
    generosCheckboxes.forEach(checkbox => {
        generos.push(checkbox.value);
    });
    
    const data = {
        nome_completo: formData.get('nome_completo'),
        email: formData.get('email'),
        telefone: formData.get('telefone') || null,
        data_nascimento: formData.get('data_nascimento') || null,
        generos_preferidos: generos
    };
    
    window.authUtils.showLoading(updateBtn, loading);
    
    try {
        const response = await fetch(`${window.authUtils.API_BASE}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            window.authUtils.showSuccess(messageContainer, result.message);
            // Atualizar header
            document.getElementById('user-name').textContent = result.user.nome_completo;
            document.getElementById('user-email').textContent = result.user.email;
        } else {
            window.authUtils.showError(messageContainer, result.error);
        }
    } catch (error) {
        window.authUtils.showError(messageContainer, 'Erro de conexão. Tente novamente.');
    } finally {
        window.authUtils.hideLoading(updateBtn, loading);
    }
}

// Mostrar modal de alterar senha
function showPasswordModal() {
    const modal = document.getElementById('password-modal');
    modal.style.display = 'flex';
    
    // Limpar formulário
    document.getElementById('password-form').reset();
    document.getElementById('password-message-container').innerHTML = '';
}

// Esconder modal de alterar senha
function hidePasswordModal() {
    const modal = document.getElementById('password-modal');
    modal.style.display = 'none';
}

// Alterar senha
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const messageContainer = document.getElementById('password-message-container');
    const saveBtn = document.getElementById('save-password-btn');
    const loading = document.getElementById('password-loading');
    
    const currentPassword = formData.get('current_password');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_new_password');
    
    // Validar senhas
    if (newPassword !== confirmPassword) {
        window.authUtils.showError(messageContainer, 'As senhas não coincidem.');
        return;
    }
    
    if (newPassword.length < 6) {
        window.authUtils.showError(messageContainer, 'A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    const data = {
        current_password: currentPassword,
        new_password: newPassword
    };
    
    window.authUtils.showLoading(saveBtn, loading);
    
    try {
        const response = await fetch(`${window.authUtils.API_BASE}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            window.authUtils.showSuccess(messageContainer, result.message);
            setTimeout(() => {
                hidePasswordModal();
            }, 2000);
        } else {
            window.authUtils.showError(messageContainer, result.error);
        }
    } catch (error) {
        window.authUtils.showError(messageContainer, 'Erro de conexão. Tente novamente.');
    } finally {
        window.authUtils.hideLoading(saveBtn, loading);
    }
}

// Cancelar compra
async function cancelarCompra(compraId) {
    if (!confirm('Tem certeza que deseja cancelar esta compra?')) {
        return;
    }
    
    try {
        const response = await fetch(`${window.authUtils.API_BASE}/compras/${compraId}/cancelar`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Recarregar compras
            await loadCompras();
            
            // Mostrar mensagem de sucesso
            const messageContainer = document.getElementById('profile-message-container');
            window.authUtils.showSuccess(messageContainer, result.message);
        } else {
            alert(result.error);
        }
    } catch (error) {
        alert('Erro ao cancelar compra. Tente novamente.');
    }
}

// Utilitários
function getStatusText(status) {
    const statusMap = {
        'ativo': 'Ativo',
        'usado': 'Usado',
        'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

