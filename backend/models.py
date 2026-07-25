from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class BoardUsuario(db.Model):
    __tablename__ = 'board_usuarios'

    id = db.Column(db.Integer, primary_key=True)
    board_id = db.Column(db.Integer, db.ForeignKey('boards.id', ondelete='CASCADE'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)

class CardUsuario(db.Model):
    __tablename__ = 'card_usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id', ondelete='CASCADE'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)

class CardLabel(db.Model):
    __tablename__ = 'card_labels'
    
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id', ondelete='CASCADE'), nullable=False)
    label_id = db.Column(db.Integer, db.ForeignKey('labels.id', ondelete='CASCADE'), nullable=False)

# -------------------------------------------------------------------
# Modelos Principales
# -------------------------------------------------------------------

class Usuario(db.Model):
    __tablename__ = 'usuarios'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    apellido = db.Column(db.String(50), nullable=False)
    mail = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    avatar_url = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    rol = db.Column(db.String(20), default='user', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    boards = db.relationship('Board', secondary='board_usuarios', back_populates='usuarios')
    cards = db.relationship('Card', secondary='card_usuarios', back_populates='usuarios')

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "nombre": self.nombre,
            "apellido": self.apellido,
            "mail": self.mail,
            "avatar_url": self.avatar_url,
            "rol": self.rol,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Board(db.Model):
    __tablename__ = 'boards'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    usuarios = db.relationship('Usuario', secondary='board_usuarios', back_populates='boards')
    lists = db.relationship('List', backref='board', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            # Asegura que las listas se retornen ordenadas por posición
            "lists": [l.to_dict() for l in sorted(self.lists, key=lambda l: l.position)]
        }

class List(db.Model):
    __tablename__ = 'lists'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    position = db.Column(db.Float, nullable=False)  # FLOAT para facilitar el reordenamiento con dnd-kit
    board_id = db.Column(db.Integer, db.ForeignKey('boards.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    cards = db.relationship('Card', backref='list', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "position": self.position,
            "board_id": self.board_id,
            # Asegura que las tarjetas se retornen ordenadas por posición
            "cards": [card.to_dict() for card in sorted(self.cards, key=lambda c: c.position)]
        }

class Card(db.Model):
    __tablename__ = 'cards'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    position = db.Column(db.Float, nullable=False)  # FLOAT para drag & drop
    list_id = db.Column(db.Integer, db.ForeignKey('lists.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    usuarios = db.relationship('Usuario', secondary='card_usuarios', back_populates='cards')
    labels = db.relationship('Label', secondary='card_labels', back_populates='cards')

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "position": self.position,
            "list_id": self.list_id,
            "labels": [label.to_dict() for label in self.labels],
            "usuarios": [u.to_dict() for u in self.usuarios]
        }

class Label(db.Model):
    __tablename__ = 'labels'

    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(20), default='#6B7280') # Campo útil para Tailwind / CSS
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    cards = db.relationship('Card', secondary='card_labels', back_populates='labels')

    def to_dict(self):
        return {
            "id": self.id,
            "description": self.description,
            "color": self.color
        }