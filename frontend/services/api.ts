// frontend/services/api.ts
import { title } from 'process';
import { 
  Board, BoardUser, List, Card, Usuario, 
  CreateListDTO, CreateCardDTO, MoveCardDTO, 
  RegisterUserDTO, LoginDTO, ChangePasswordDTO, UpdateProfileDTO 
} from '../lib/types';

// URL Base predeterminada apuntando al backend de Flask (sin '/api' o '/' al final para evitar peticiones //health)
const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
const API_BASE_URL = rawUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Función centralizada para peticiones HTTP
 */
async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${formattedEndpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config: RequestInit = {
    cache: 'no-store',
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        data.error || `Error HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`[trelloApi] Error en petición a ${url}:`, error);
    throw new Error(
      error instanceof Error ? error.message : 'No se pudo conectar con el servidor de Flask'
    );
  }
}

export const trelloApi = {
  /**
   * Verificar la conectividad con el backend Flask
   * GET /health
   */
  checkHealth: (): Promise<{ status: string; message: string }> => {
    return fetcher<{ status: string; message: string }>('/health');
  },

  /**
   * Registrar nuevo usuario
   * POST /api/auth/register
   */
  register: (data: RegisterUserDTO): Promise<Usuario> => {
    return fetcher<Usuario>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Iniciar sesión
   * POST /api/auth/login
   */
  login: (data: LoginDTO): Promise<{ message: string; user: Usuario }> => {
    return fetcher<{ message: string; user: Usuario }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Cambiar contraseña del usuario
   * PUT /api/users/<userId>/password
   */
  changePassword: (userId: number, data: ChangePasswordDTO): Promise<{ message: string }> => {
    return fetcher<{ message: string }>(`/api/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar información de perfil
   * PUT /api/users/<userId>
   */
  updateProfile: (userId: number, data: UpdateProfileDTO): Promise<Usuario> => {
    return fetcher<Usuario>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Obtener todos los usuarios registrados
   * GET /api/users
   */
  getUsers: (): Promise<Usuario[]> => {
    return fetcher<Usuario[]>('/api/users');
  },

  /**
   * Obtener perfil de un usuario por su ID
   * GET /api/users/<userId>
   */
  getUserProfile: (userId: number): Promise<Usuario> => {
    return fetcher<Usuario>(`/api/users/${userId}`);
  },

  /**
   * Obtener todos los tableros creados (opcionalmente filtrados por usuario)
   * GET /api/boards
   */
  getBoards: (userId?: number): Promise<Board[]> => {
    const endpoint = userId ? `/api/boards?user_id=${userId}` : '/api/boards';
    return fetcher<Board[]>(endpoint);
  },

  /**
   * Crear un nuevo tablero y vincularlo con el usuario creador
   * POST /api/boards
   */
  createBoard: (title: string, userId?: number): Promise<Board> => {
    return fetcher<Board>('/api/boards', {
      method: 'POST',
      body: JSON.stringify({ title, user_id: userId }),
    });
  },

  /**
   * Agregar un usuario a un tablero existente
   * POST /api/boards/<boardId>/users
   */
  addUserToBoard: (boardId: number, usuarioId: number): Promise<{ message: string }> => {
    return fetcher<{ message: string }>(`/api/boards/${boardId}/users`, {
      method: 'POST',
      body: JSON.stringify({ usuario_id: usuarioId }),
    });
  },

  createBoardUser: (boardId: number, usuarioId: number): Promise<{ message: string }> => {
    return fetcher<{ message: string }>(`/api/boards/${boardId}/users`, {
      method: 'POST',
      body: JSON.stringify({ usuario_id: usuarioId }),
    });
  },

  /**
   * Obtener los detalles completos de un tablero (listas y tarjetas)
   * GET /api/boards/<boardId>
   */
  getBoard: (boardId: number): Promise<Board> => {
    return fetcher<Board>(`/api/boards/${boardId}`);
  },

  /**
   * Crear una nueva lista en un tablero
   * POST /api/lists
   */
  createList: (data: CreateListDTO): Promise<List> => {
    return fetcher<List>('/api/lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Crear una nueva tarjeta dentro de una lista
   * POST /api/cards
   */
  createCard: (data: CreateCardDTO): Promise<Card> => {
    return fetcher<Card>('/api/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Mover una tarjeta a otra posición o lista (Drag & Drop)
   * PUT /api/cards/<cardId>/move
   */
  moveCard: (cardId: number, data: MoveCardDTO): Promise<Card> => {
    return fetcher<Card>(`/api/cards/${cardId}/move`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

export const api = trelloApi;
export default trelloApi;