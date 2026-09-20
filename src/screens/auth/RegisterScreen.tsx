import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {register} from '../../services/auth.service';
import {
  AuthStackParamList,
} from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'Register'
>;

const RegisterScreen = ({navigation}: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert(
        'Validation',
        'Email, password, and password confirmation are required.',
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Validation',
        'Password must be at least 6 characters.',
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Validation',
        'Passwords do not match.',
      );
      return;
    }

    try {
      setLoading(true);
      await register(email, password);
    } catch (error: any) {
      console.log('REGISTER ERROR:', error);

      Alert.alert(
        'Registration failed',
        error?.message ?? 'Unable to create account.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>
        Register to start using your board
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

      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={handleRegister}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Create account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>
          Already have an account? Sign in
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

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
    color: '#172b4d',
  },

  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: '#626f86',
  },

  input: {
    backgroundColor: '#ffffff',
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

  disabledButton: {
    opacity: 0.65,
  },

  buttonText: {
    color: '#ffffff',
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