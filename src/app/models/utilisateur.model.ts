export interface Utilisateur {
  id: number;
  username: string;
  email: string;
  role: { id: number; nom: string; nomLogic: string };
  estBanned: boolean;
}
