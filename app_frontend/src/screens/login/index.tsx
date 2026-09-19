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

import { Logo } from '@/components/logo';
import { useLogin } from '@/api/auth';
import { ApiError } from '@/lib/api';
import { colors, styles } from './style';

export default function LoginScreen() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !login.isPending;
  const errorMessage = login.error
    ? login.error instanceof ApiError
      ? login.error.status === 401
        ? 'E-mail ou senha incorretos.'
        : login.error.userMessage
      : 'Não foi possível conectar ao servidor.'
    : null;

  function handleSubmit() {
    if (!canSubmit) return;
    // O AuthGate redireciona para as tabs quando a sessão é criada
    login.mutate({ email: email.trim().toLowerCase(), password });
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
            <View style={styles.logoGlow}>
              <Logo size={64} />
            </View>
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>
              Insira suas credenciais para gerenciar sua experiência de precisão.
            </Text>
          </View>

          <View style={styles.card}>
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

            <View style={styles.labelRow}>
              <Text style={styles.label}>Senha</Text>
              <Pressable hitSlop={8}>
                <Text style={styles.link}>Esqueceu a senha?</Text>
              </Pressable>
            </View>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color={colors.muted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
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
              onPress={handleSubmit}
              disabled={!canSubmit && !login.isPending}
              loading={login.isPending}
            >
              Entrar
            </Button>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta?</Text>
              <Pressable hitSlop={8} onPress={() => router.push('/screens/register')}>
                <Text style={styles.footerLink}>Cadastre-se</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
