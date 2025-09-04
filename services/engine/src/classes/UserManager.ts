import { balance } from "../store/store";

class UserManager{

    createUser(userId: string){
        balance[userId] = {
            balance: 5000,
            tokens: {}
        };
    }

    getBalance(userId: string){
        return balance[userId];
    }

    updateBalance(userId: string, amount: number){
        balance[userId].balance += amount;
    }
}

export const userManager = new UserManager();