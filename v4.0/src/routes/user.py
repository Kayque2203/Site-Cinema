from flask import Blueprint, jsonify, request, session
from src.models.user import User, Compra, db
from datetime import datetime, date
import re

user_bp = Blueprint('user', __name__)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    return len(password) >= 6

@user_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        
        # Validações
        if not data.get('username') or len(data['username']) < 3:
            return jsonify({'error': 'Nome de usuário deve ter pelo menos 3 caracteres'}), 400
        
        if not data.get('email') or not validate_email(data['email']):
            return jsonify({'error': 'Email inválido'}), 400
        
        if not data.get('password') or not validate_password(data['password']):
            return jsonify({'error': 'Senha deve ter pelo menos 6 caracteres'}), 400
        
        if not data.get('nome_completo') or len(data['nome_completo']) < 2:
            return jsonify({'error': 'Nome completo é obrigatório'}), 400
        
        # Verificar se usuário já existe
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Nome de usuário já existe'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Criar usuário
        user = User(
            username=data['username'],
            email=data['email'],
            nome_completo=data['nome_completo'],
            telefone=data.get('telefone'),
        )
        user.set_password(data['password'])
        
        # Processar data de nascimento se fornecida
        if data.get('data_nascimento'):
            try:
                user.data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Data de nascimento inválida (use YYYY-MM-DD)'}), 400
        
        # Processar gêneros preferidos
        if data.get('generos_preferidos'):
            user.set_generos_preferidos(data['generos_preferidos'])
        
        db.session.add(user)
        db.session.commit()
        
        # Fazer login automático
        session['user_id'] = user.id
        session['username'] = user.username
        
        return jsonify({
            'message': 'Usuário cadastrado com sucesso',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username e senha são obrigatórios'}), 400
        
        # Buscar usuário por username ou email
        user = User.query.filter(
            (User.username == data['username']) | (User.email == data['username'])
        ).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Criar sessão
        session['user_id'] = user.id
        session['username'] = user.username
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@user_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logout realizado com sucesso'}), 200

@user_bp.route('/profile', methods=['GET'])
def get_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    return jsonify(user.to_dict()), 200

@user_bp.route('/profile', methods=['PUT'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        data = request.json
        
        # Atualizar campos permitidos
        if 'nome_completo' in data and len(data['nome_completo']) >= 2:
            user.nome_completo = data['nome_completo']
        
        if 'telefone' in data:
            user.telefone = data['telefone']
        
        if 'data_nascimento' in data and data['data_nascimento']:
            try:
                user.data_nascimento = datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Data de nascimento inválida (use YYYY-MM-DD)'}), 400
        
        if 'generos_preferidos' in data:
            user.set_generos_preferidos(data['generos_preferidos'])
        
        # Atualizar email se fornecido e válido
        if 'email' in data:
            if not validate_email(data['email']):
                return jsonify({'error': 'Email inválido'}), 400
            
            # Verificar se email já existe para outro usuário
            existing_user = User.query.filter(User.email == data['email'], User.id != user.id).first()
            if existing_user:
                return jsonify({'error': 'Email já cadastrado para outro usuário'}), 400
            
            user.email = data['email']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@user_bp.route('/change-password', methods=['POST'])
def change_password():
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        data = request.json
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Senha atual incorreta'}), 400
        
        if not validate_password(data['new_password']):
            return jsonify({'error': 'Nova senha deve ter pelo menos 6 caracteres'}), 400
        
        user.set_password(data['new_password'])
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Senha alterada com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@user_bp.route('/compras', methods=['GET'])
def get_compras():
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    compras = Compra.query.filter_by(user_id=session['user_id']).order_by(Compra.created_at.desc()).all()
    return jsonify([compra.to_dict() for compra in compras]), 200

@user_bp.route('/compras', methods=['POST'])
def create_compra():
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    try:
        data = request.json
        
        # Validações
        required_fields = ['filme_id', 'filme_nome', 'sala_id', 'sala_nome', 'horario', 'data_sessao', 'poltronas', 'valor_total']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Criar compra
        compra = Compra(
            user_id=session['user_id'],
            filme_id=data['filme_id'],
            filme_nome=data['filme_nome'],
            sala_id=data['sala_id'],
            sala_nome=data['sala_nome'],
            horario=data['horario'],
            data_sessao=datetime.strptime(data['data_sessao'], '%Y-%m-%d').date(),
            quantidade_ingressos=len(data['poltronas']),
            valor_total=data['valor_total']
        )
        compra.set_poltronas(data['poltronas'])
        
        db.session.add(compra)
        db.session.commit()
        
        return jsonify({
            'message': 'Compra registrada com sucesso',
            'compra': compra.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@user_bp.route('/compras/<int:compra_id>/cancelar', methods=['POST'])
def cancelar_compra(compra_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Usuário não autenticado'}), 401
    
    try:
        compra = Compra.query.filter_by(id=compra_id, user_id=session['user_id']).first()
        if not compra:
            return jsonify({'error': 'Compra não encontrada'}), 404
        
        if compra.status != 'ativo':
            return jsonify({'error': 'Compra não pode ser cancelada'}), 400
        
        compra.status = 'cancelado'
        db.session.commit()
        
        return jsonify({
            'message': 'Compra cancelada com sucesso',
            'compra': compra.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@user_bp.route('/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                'authenticated': True,
                'user': user.to_dict()
            }), 200
    
    return jsonify({'authenticated': False}), 200

# Rotas administrativas (manter as existentes para compatibilidade)
@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())
