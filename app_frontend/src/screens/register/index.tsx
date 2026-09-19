import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useRegister } from '@/api/auth';
import { ApiError } from '@/lib/api';
import { colors, styles } from './style';

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterScreen() {
  const router = useRouter();
  const register = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const strength = Math.min(password.length / MIN_PASSWORD_LENGTH, 1);
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    acceptedTerms &&
    !register.isPending;
  const errorMessage = register.error
    ? register.error instanceof ApiError
      ? register.error.userMessage
      : 'Não foi possível conectar ao servidor.'
    : null;

  function handleSubmit() {
    if (!canSubmit) return;
    // O AuthGate redireciona para as tabs quando a sessão é criada
    register.mutate({ name: name.trim(), email: email.trim().toLowerCase(), password });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Preencha seus dados para começar a sua experiência exclusiva.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nome completo</Text>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={18} color={colors.muted} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome completo"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color={colors.muted} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="exemplo@email.com"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color={colors.muted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="done"
              />
              <Pressable
                style={styles.iconButton}
                hitSlop={8}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.strengthRow}>
              <View style={styles.strengthTrack}>
                <View style={[styles.strengthFill, { width: `${strength * 100}%` }]} />
              </View>
              <Text style={styles.strengthHint}>Mínimo {MIN_PASSWORD_LENGTH} caracteres</Text>
            </View>

            <Pressable
              style={styles.termsRow}
              onPress={() => setAcceptedTerms((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Feather name="check" size={14} color={colors.buttonText} />}
              </View>
              <Text style={styles.termsText}>
                Concordo com os <Text style={styles.termsLink}>Termos de Uso</Text> e a{' '}
                <Text style={styles.termsLink}>Política de Privacidade</Text> da Aura.
              </Text>
            </Pressable>

            <Button
              mode="contained"
              buttonColor={colors.text}
              textColor={colors.buttonText}
              icon={({ size }) => (
                <Feather name="arrow-right" size={size} color={colors.buttonText} />
              )}
              // Desabilitado continua branco (translúcido) em vez do cinza escuro do Paper
              theme={{ colors: { surfaceDisabled: 'rgba(255, 255, 255, 0.35)', onSurfaceDisabled: colors.buttonText } }}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              disabled={!canSubmit && !register.isPending}
              loading={register.isPending}
              onPress={handleSubmit}
            >
              Criar Conta
            </Button>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já possui uma conta?</Text>
              <Pressable hitSlop={8} onPress={() => router.replace('/screens/login')}>
                <Text style={styles.footerLink}>Faça login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
