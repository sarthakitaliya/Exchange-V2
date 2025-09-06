import { balance } from "../store/store";

class UserManager {
  createUser(userId: string) {
    balance[userId] = {
      balance: 5000,
      tokens: {},
    };
  }

  getBalance(userId: string) {
    if(!userId) throw new Error("Invalid userId");
    return balance[userId];
  }

  updateBalance(userId: string, amount: number) {
    balance[userId].balance += amount;
  }

  getBalanceData() {
    return { balance: { ...balance } };
  }

  restore(obj: any) {
    if (!obj) return;
    for (const k of Object.keys(balance)) delete balance[k];
    if (obj.balance) Object.assign(balance, obj.balance);
  }
}

export const userManager = new UserManager();
