import prisma from '@/lib/prisma';
import { User } from '@/types/user';

export const createTodo = async (text: string, user: User) => {
  const { userId } = user;
  if (!text.trim()) {
    throw new Error('タスクの入力は必須です。');
  }
  const newTodo = await prisma.todo.create({
    data: {
      text: text,
      userId: userId,
    },
  });

  return newTodo;
};

export const updateTodoStatus = async (
  id: string,
  data: { text?: string; completed?: boolean },
) => {
  const updateTodo = await prisma.todo.update({
    where: {
      id: BigInt(id),
    },
    data: data,
  });
  return updateTodo;
};

export const deleteTodo = async (id: string) => {
  const deleteTodo = await prisma.todo.delete({
    where: {
      id: BigInt(id),
    },
  });
  return deleteTodo;
};
