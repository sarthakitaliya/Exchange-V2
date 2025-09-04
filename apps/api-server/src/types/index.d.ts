interface userData {
  id: string;
  email: string;
} 

declare namespace Express {
  interface Request {
    user: userData;
  }
}
