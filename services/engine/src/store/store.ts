import type { Balance, closeOrder, openOrder, User } from "@ex/shared";


export const balance: Record<string, Balance> = {};
export const op: Record<string, openOrder[]> = {};
export const co: Record<string, closeOrder[]> = {};
export const user: Record<string, User> = {};
