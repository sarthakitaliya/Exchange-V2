import { balance } from "../store/store";

class UserManager{

    createUser(userId: string){
        balance[userId] = 5000;
    }

    getBalance(userId: string){
        return balance[userId];
    }

    updateBalance(userId: string, amount: number){
        balance[userId] = balance[userId] + amount;
    }
}

export const userManager = new UserManager();