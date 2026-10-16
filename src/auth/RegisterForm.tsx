import {
  Alert,
  Anchor,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { hasLength, isEmail, matchesField, useForm } from "@mantine/form";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router";

import { errorMessage } from "../api/errors";
import { MAX_DISPLAY_NAME_LENGTH } from "./account";
import { register } from "./actions";

type RegisterValues = {
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm({ onSwitch }: { onSwitch?: () => void }) {
  const form = useForm<RegisterValues>({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      email: isEmail("Email invalide"),
      displayName: (value) =>
        [...value.trim()].length > MAX_DISPLAY_NAME_LENGTH
          ? `${MAX_DISPLAY_NAME_LENGTH} caractères maximum`
          : null,
      password: hasLength({ min: 8 }, "8 caractères minimum"),
      confirmPassword: matchesField(
        "password",
        "Les mots de passe ne correspondent pas",
      ),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      register(values.email, values.password, values.displayName),
  });

  return (
    <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
      <Stack>
        {mutation.error && (
          <Alert color="red">
            {errorMessage(mutation.error, {
              409: "Un compte existe déjà avec cet email.",
            })}
          </Alert>
        )}

        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <TextInput
          label="Pseudo"
          description="Facultatif, affiché à la place de ton email. Modifiable plus tard."
          autoComplete="nickname"
          key={form.key("displayName")}
          {...form.getInputProps("displayName")}
        />
        <PasswordInput
          label="Mot de passe"
          description="8 caractères minimum"
          autoComplete="new-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <PasswordInput
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          key={form.key("confirmPassword")}
          {...form.getInputProps("confirmPassword")}
        />

        <Button type="submit" loading={mutation.isPending} fullWidth>
          Créer mon compte
        </Button>

        <Text size="sm" ta="center">
          Déjà un compte ?{" "}
          {onSwitch ? (
            <Anchor component="button" type="button" onClick={onSwitch}>
              Se connecter
            </Anchor>
          ) : (
            <Anchor component={Link} to="/login">
              Se connecter
            </Anchor>
          )}
        </Text>
      </Stack>
    </form>
  );
}
