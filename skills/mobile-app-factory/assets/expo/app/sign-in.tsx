import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { Button } from '../src/components/Button';
import { useAuth } from '../src/auth';
import { useColors } from '../src/useColors';

export default function SignIn() {
  const { colors } = useColors();
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await auth.signIn(email, password);
      router.replace('/');
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not sign in.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text, fontSize: 22 }}>Sign in</Text>
      <TextInput
        accessibilityLabel="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        style={{ borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12, color: colors.text }}
      />
      <TextInput
        accessibilityLabel="Password"
        secureTextEntry
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
        style={{ borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12, color: colors.text }}
      />
      {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
      <Button label="Sign in" colors={colors} onPress={submit} />
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
        The token is stored in the OS keychain (expo-secure-store), not in plain storage.
      </Text>
    </View>
  );
}
