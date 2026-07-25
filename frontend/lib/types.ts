export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  apellido?: string;
  mail?: string;
  avatar_url?: string | null;
  rol?: string;
  created_at?: string;
}

export interface RegisterUserDTO {
  nombre: string;
  apellido: string;
  username: string;
  mail: string;
  password: string;
  avatar_url?: string;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface ChangePasswordDTO {
  current_password: string;
  new_password: string;
}

export interface UpdateProfileDTO {
  nombre?: string;
  apellido?: string;
  avatar_url?: string;
}

export interface Label {
  id: number;
  description: string;
  color: string;
}

export interface Card {
  id: number;
  title: string;
  description?: string;
  position: number;
  list_id: number;
  labels?: Label[];
  usuarios?: Usuario[];
}

export interface List {
  id: number;
  title: string;
  position: number;
  board_id: number;
  cards: Card[];
}

export interface Board {
  id: number;
  title: string;
  lists: List[];
  usuarios?: Usuario[];
}

export interface BoardUser {
  id: number;
  board_id: number;
  user_id: number;
}

export interface CardUser {
  id: number;
  card_id: number;
  user_id: number;
}

export interface CreateListDTO {
  title: string;
  board_id: number;
  position?: number;
}

export interface CreateCardDTO {
  title: string;
  list_id: number;
  description?: string;
  position?: number;
}

export interface MoveCardDTO {
  target_list_id?: number;
  new_position: number;
}

export interface ApiError {
  error: string;
}
