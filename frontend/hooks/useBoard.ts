'use client';

import { useState, useEffect, useCallback } from 'react';
import { Board, Card } from '@/lib/types';
import { api } from '@/lib/api';

export function useBoard(boardId: number) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    if (!boardId || isNaN(boardId)) {
      setError('ID de tablero no válido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Obtener estrictamente el tablero especificado por ID sin fallbacks no deseados
      const data = await api.getBoard(boardId);
      setBoard(data);
    } catch (err) {
      console.error(`[useBoard] Error al cargar tablero con ID ${boardId}:`, err);
      setBoard(null);
      setError(err instanceof Error ? err.message : 'Tablero no encontrado');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const addList = async (title: string) => {
    if (!board) return;
    try {
      const newList = await api.createList({ title, board_id: board.id });
      setBoard((prev) => prev ? { ...prev, lists: [...prev.lists, newList] } : prev);
      return newList;
    } catch (err) {
      console.error('Error creando lista:', err);
      throw err;
    }
  };

  const addCard = async (title: string, listId: number, description?: string) => {
    if (!board) return;
    try {
      const newCard = await api.createCard({ title, list_id: listId, description });
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.map((list) =>
            list.id === listId ? { ...list, cards: [...list.cards, newCard] } : list
          ),
        };
      });
      return newCard;
    } catch (err) {
      console.error('Error creando tarjeta:', err);
      throw err;
    }
  };

  /**
   * Mover tarjeta optimistamente en el cliente y sincronizar con el backend Flask
   */
  const moveCard = async (cardId: number, targetListId: number, newPosition: number) => {
    if (!board) return;

    let targetCard: Card | null = null;
    board.lists.forEach((l) => {
      const found = l.cards.find((c) => c.id === cardId);
      if (found) targetCard = { ...found, list_id: targetListId, position: newPosition };
    });

    if (!targetCard) return;
    const cardToInsert = targetCard;

    // Actualizar UI optimistamente antes de la respuesta del servidor
    setBoard((prevBoard) => {
      if (!prevBoard) return prevBoard;

      const updatedLists = prevBoard.lists.map((list) => {
        const remainingCards = list.cards.filter((c) => c.id !== cardId);

        if (list.id === targetListId) {
          const newCards = [...remainingCards, cardToInsert].sort((a, b) => a.position - b.position);
          return { ...list, cards: newCards };
        }

        return { ...list, cards: remainingCards };
      });

      return { ...prevBoard, lists: updatedLists };
    });

    try {
      await api.moveCard(cardId, {
        target_list_id: targetListId,
        new_position: newPosition,
      });
    } catch (err) {
      console.error('Error moviendo tarjeta en backend, reintentando sincronización...', err);
      await fetchBoard();
    }
  };

  return {
    board,
    loading,
    error,
    refresh: fetchBoard,
    addList,
    addCard,
    moveCard,
  };
}
