import { Modal } from "@mantine/core";

import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export type AuthMode = "login" | "register";

interface AuthModalProps {
  mode: AuthMode | null;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}

export function AuthModal({ mode, onModeChange, onClose }: AuthModalProps) {
  return (
    <Modal
      opened={mode !== null}
      onClose={onClose}
      title={mode === "register" ? "Créer un compte" : "Connexion"}
    >
      {mode === "login" && (
        <LoginForm onSwitch={() => onModeChange("register")} />
      )}
      {mode === "register" && (
        <RegisterForm onSwitch={() => onModeChange("login")} />
      )}
    </Modal>
  );
}
