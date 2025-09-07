from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    nome_completo = db.Column(db.String(200), nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    data_nascimento = db.Column(db.Date, nullable=True)
    generos_preferidos = db.Column(db.Text, nullable=True)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento com compras
    compras = db.relationship('Compra', backref='usuario', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def set_generos_preferidos(self, generos_list):
        self.generos_preferidos = json.dumps(generos_list)

    def get_generos_preferidos(self):
        if self.generos_preferidos:
            return json.loads(self.generos_preferidos)
        return []

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'nome_completo': self.nome_completo,
            'telefone': self.telefone,
            'data_nascimento': self.data_nascimento.isoformat() if self.data_nascimento else None,
            'generos_preferidos': self.get_generos_preferidos(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Compra(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filme_id = db.Column(db.Integer, nullable=False)
    filme_nome = db.Column(db.String(200), nullable=False)
    sala_id = db.Column(db.Integer, nullable=False)
    sala_nome = db.Column(db.String(100), nullable=False)
    horario = db.Column(db.String(10), nullable=False)
    data_sessao = db.Column(db.Date, nullable=False)
    poltronas = db.Column(db.Text, nullable=False)  # JSON string
    quantidade_ingressos = db.Column(db.Integer, nullable=False)
    valor_total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='ativo')  # ativo, usado, cancelado
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_poltronas(self, poltronas_list):
        self.poltronas = json.dumps(poltronas_list)

    def get_poltronas(self):
        if self.poltronas:
            return json.loads(self.poltronas)
        return []

    def to_dict(self):
        return {
            'id': self.id,
            'filme_nome': self.filme_nome,
            'sala_nome': self.sala_nome,
            'horario': self.horario,
            'data_sessao': self.data_sessao.isoformat(),
            'poltronas': self.get_poltronas(),
            'quantidade_ingressos': self.quantidade_ingressos,
            'valor_total': self.valor_total,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }
