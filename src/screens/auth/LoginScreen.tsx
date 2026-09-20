import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {login} from '../../services/auth.service';
import {
  AuthStackParamList,
} from '../../navigation/AuthNavigator';
import {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
>;

const LoginScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Validation',
        'Email and password are required.',
      );
      return;
    }

    try {
      setLoading(true);

      await login(email, password);
    } catch (error: any) {
      console.log('LOGIN ERROR:', error);

      Alert.alert(
        'Login failed',
        error?.message ?? 'Unable to login.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Kanban Board
      </Text>

      <Text style={styles.subtitle}>
        Sign in to continue
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}>

        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>
            Login
          </Text>
        )}

      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>
          New here? Create an account
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f4f5f7',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },

  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 8,
    marginBottom: 16,
  },

  button: {
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c66e4',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },

  linkText: {
    color: '#0c66e4',
    fontWeight: '600',
  },
});