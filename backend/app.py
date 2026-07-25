# app.py
import os
import sys

# Asegurar que el directorio de backend esté en sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import text
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Board, List, Card, Usuario, Label, BoardUsuario

# Cargar variables de entorno desde .env
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Permite peticiones de cualquier origen

# Configuración de base de datos
db_url = os.getenv('DATABASE_URL')
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if not db_url:
    print("⚠️ ADVERTENCIA: DATABASE_URL no encontrada en entorno, usando memoria temporal para no colapsar.")
    db_url = "sqlite:///:memory:"

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar SQLAlchemy con la App
db.init_app(app)

# Crear tablas en Supabase y aplicar migraciones/sincronización al arrancar
with app.app_context():
    try:
        db.create_all()
        # Añadir la columna password_hash a la tabla de usuarios si no existe
        db.session.execute(text("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);"))
        
        # Sincronizar secuencias de autoincremento para evitar errores UniqueViolation en PostgreSQL/Supabase
        for table in ['lists', 'cards', 'boards', 'usuarios', 'labels']:
            db.session.execute(text(f"""
                SELECT setval(
                    pg_get_serial_sequence('{table}', 'id'),
                    COALESCE((SELECT MAX(id) FROM {table}), 1),
                    (SELECT COUNT(*) > 0 FROM {table})
                );
            """))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Nota de migración/secuencia de base de datos:", e)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend Flask conectado a Supabase"}), 200

# ==========================================
# ENDPOINTS DE USUARIOS Y AUTENTICACIÓN
# ==========================================

@app.route('/api/users', methods=['GET'])
def get_users():
    users = Usuario.query.all()
    return jsonify([u.to_dict() for u in users]), 200

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    user = db.session.get(Usuario, user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(user.to_dict()), 200

@app.route('/api/auth/register', methods=['POST'])
@app.route('/api/users', methods=['POST'])
def register_user():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibieron datos"}), 400

    username = data.get('username')
    mail = data.get('mail')
    password = data.get('password')
    nombre = data.get('nombre')
    apellido = data.get('apellido')

    # Validar campos obligatorios
    if not username or not mail or not password or not nombre or not apellido:
        return jsonify({"error": "Faltan campos obligatorios (nombre, apellido, username, mail, password)"}), 400

    # Verificar si el usuario o correo ya existen
    existing_username = Usuario.query.filter_by(username=username).first()
    if existing_username:
        return jsonify({"error": "El nombre de usuario ya está registrado"}), 400

    existing_mail = Usuario.query.filter_by(mail=mail).first()
    if existing_mail:
        return jsonify({"error": "El correo electrónico ya está registrado"}), 400

    # Encriptación segura de contraseña mediante PBKDF2/scrypt de Werkzeug
    password_hash = generate_password_hash(password)

    new_user = Usuario(
        nombre=nombre,
        apellido=apellido,
        mail=mail,
        username=username,
        password_hash=password_hash,
        avatar_url=data.get('avatar_url', ''),
        rol=data.get('rol', 'user')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se recibieron datos"}), 400

    username_or_mail = data.get('username') or data.get('mail')
    password = data.get('password')

    if not username_or_mail or not password:
        return jsonify({"error": "Nombre de usuario/correo y contraseña son obligatorios"}), 400

    # Buscar por username o correo
    user = Usuario.query.filter(
        (Usuario.username == username_or_mail) | (Usuario.mail == username_or_mail)
    ).first()

    if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Nombre de usuario o contraseña incorrectos"}), 401

    return jsonify({
        "message": "Inicio de sesión exitoso",
        "user": user.to_dict()
    }), 200

@app.route('/api/users/<int:user_id>/password', methods=['PUT'])
def change_password(user_id):
    data = request.get_json()
    user = db.session.get(Usuario, user_id)

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({"error": "Se requieren la contraseña actual y la nueva contraseña"}), 400

    # Verificar contraseña actual
    if not user.password_hash or not check_password_hash(user.password_hash, current_password):
        return jsonify({"error": "La contraseña actual es incorrecta"}), 400

    # Actualizar hash de la nueva contraseña
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({"message": "Contraseña actualizada exitosamente"}), 200

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_profile(user_id):
    data = request.get_json()
    user = db.session.get(Usuario, user_id)

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    if 'nombre' in data:
        user.nombre = data['nombre']
    if 'apellido' in data:
        user.apellido = data['apellido']
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']

    db.session.commit()
    return jsonify(user.to_dict()), 200

@app.route('/api/boards', methods=['GET'])
def get_boards():
    user_id = request.args.get('user_id', type=int)
    if user_id:
        boards = Board.query.join(BoardUsuario).filter(BoardUsuario.usuario_id == user_id).all()
    else:
        boards = Board.query.all()
    return jsonify([board.to_dict() for board in boards]), 200

@app.route('/api/boards', methods=['POST'])
def create_board():
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({"error": "Falta el título del tablero"}), 400

    new_board = Board(title=data['title'])

    try:
        db.session.add(new_board)
        db.session.flush()
    except Exception:
        db.session.rollback()
        db.session.execute(text("SELECT setval(pg_get_serial_sequence('boards', 'id'), COALESCE((SELECT MAX(id) FROM boards), 1), (SELECT COUNT(*) > 0 FROM boards));"))
        new_board = Board(title=data['title'])
        db.session.add(new_board)
        db.session.flush()

    user_id = data.get('user_id') or data.get('usuario_id')
    if user_id:
        usuario = db.session.get(Usuario, user_id)
        if usuario:
            board_usuario = BoardUsuario(board_id=new_board.id, usuario_id=usuario.id)
            db.session.add(board_usuario)

    db.session.commit()
    return jsonify(new_board.to_dict()), 201

@app.route('/api/boards/<int:board_id>/users', methods=['POST'])
def add_user_to_board(board_id):
    data = request.get_json()
    if not data or not data.get('usuario_id'):
        return jsonify({"error": "Falta usuario_id"}), 400

    usuario_id = data['usuario_id']
    board = db.session.get(Board, board_id)
    usuario = db.session.get(Usuario, usuario_id)

    if not board or not usuario:
        return jsonify({"error": "Tablero o usuario no encontrado"}), 404

    existing = BoardUsuario.query.filter_by(board_id=board_id, usuario_id=usuario_id).first()
    if existing:
        return jsonify({"message": "El usuario ya es miembro de este tablero"}), 200

    new_rel = BoardUsuario(board_id=board_id, usuario_id=usuario_id)
    db.session.add(new_rel)
    db.session.commit()

    return jsonify({"message": "Usuario agregado al tablero con éxito"}), 201

@app.route('/api/boards/<int:board_id>', methods=['GET'])
def get_board_details(board_id):
    board = db.session.get(Board, board_id)
    if not board:
        return jsonify({"error": "Tablero no encontrado"}), 404
    return jsonify(board.to_dict()), 200

@app.route('/api/lists', methods=['POST'])
def create_list():
    data = request.get_json()

    if not data or not data.get('title') or not data.get('board_id'):
        return jsonify({"error": "Faltan campos requeridos (title, board_id)"}), 400

    last_list = List.query.filter_by(board_id = data['board_id'])\
                            .order_by(List.position.desc()).first()
    new_position = (last_list.position + 1000.0) if last_list else 1000.0

    new_list = List(
        title=data['title'],
        board_id=data['board_id'],
        position=data.get('position', new_position)
    )

    try:
        db.session.add(new_list)
        db.session.commit()
    except Exception:
        db.session.rollback()
        # En caso de desajuste de secuencia en PostgreSQL, resincronizar e reintentar
        db.session.execute(text("SELECT setval(pg_get_serial_sequence('lists', 'id'), COALESCE((SELECT MAX(id) FROM lists), 1), (SELECT COUNT(*) > 0 FROM lists));"))
        db.session.add(new_list)
        db.session.commit()

    return jsonify(new_list.to_dict()), 201

@app.route('/api/cards', methods=['POST'])
def create_card():
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('list_id'):
        return jsonify({"error": "Faltan campos requeridos (title, list_id)"}), 400

    # Posición por defecto al final de la columna
    last_card = Card.query.filter_by(list_id=data['list_id'])\
                          .order_by(Card.position.desc()).first()
    new_position = (last_card.position + 1000.0) if last_card else 1000.0

    new_card = Card(
        title=data['title'],
        description=data.get('description', ''),
        list_id=data['list_id'],
        position=data.get('position', new_position)
    )
    
    try:
        db.session.add(new_card)
        db.session.commit()
    except Exception:
        db.session.rollback()
        # En caso de desajuste de secuencia en PostgreSQL, resincronizar e reintentar
        db.session.execute(text("SELECT setval(pg_get_serial_sequence('cards', 'id'), COALESCE((SELECT MAX(id) FROM cards), 1), (SELECT COUNT(*) > 0 FROM cards));"))
        db.session.add(new_card)
        db.session.commit()
    
    return jsonify(new_card.to_dict()), 201

@app.route('/api/cards/<int:card_id>/move', methods=['PUT'])
def move_card(card_id):
    """
    Recibe un JSON con:
    - 'target_list_id': ID de la lista destino (puede ser la misma u otra columna)
    - 'new_position': Nuevo valor float de la posición de la tarjeta
    """
    data = request.get_json()
    card = db.session.get(Card, card_id)
    
    if not card:
        return jsonify({"error": "Tarjeta no encontrada"}), 404

    target_list_id = data.get('target_list_id', card.list_id)
    new_position = data.get('new_position')

    if new_position is None:
        return jsonify({"error": "Se requiere 'new_position'"}), 400

    # Actualizamos lista y posición
    card.list_id = target_list_id
    card.position = new_position
    
    db.session.commit()
    
    return jsonify(card.to_dict()), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)



