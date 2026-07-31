import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import ENDPOINTS  from '../../../endpoint/endpoints';

const SignUpScreen = ({ navigation }) => {
    // --- Common Fields ---
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async () => {
        if (!username || !email || !password) {
            Alert.alert('Error', 'Username, Email, and Password are required.');
            return;
        }

        setIsLoading(true);
        console.log("\n========== STARTING SIGNUP REQUEST ==========");

        try {
            // STEP 1: Create JSON payload
            const payload = {
                username: username.trim(),
                email: email.trim(),
                password: password,
            };
            if (firstName.trim()) payload.first_name = firstName.trim();
            if (lastName.trim()) payload.last_name = lastName.trim();

            console.log(`Hitting URL: ${ENDPOINTS.REGISTER}`);
            console.log('Signup payload:', { ...payload, password: '***' });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const registerResponse = await fetch(ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            console.log('HTTP Status Code:', registerResponse.status);
            const registerRawText = await registerResponse.text();
            console.log("Raw Server Response:", registerRawText);

            let registerData;
            try {
                registerData = JSON.parse(registerRawText);
            } catch (jsonError) {
                Alert.alert('Server Error', 'Invalid response format received from server.');
                setIsLoading(false);
                return;
            }

            if (!registerResponse.ok) {
                let errorMsg = 'Registration failed';
                if (typeof registerData === 'object' && registerData !== null) {
                    if (registerData.error) {
                        errorMsg = registerData.error;
                    } else if (registerData.detail) {
                        errorMsg = registerData.detail;
                    } else {
                        errorMsg = Object.entries(registerData)
                            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                            .join('\n');
                    }
                } else if (typeof registerData === 'string') {
                    errorMsg = registerData;
                }
                Alert.alert('Registration Failed', errorMsg);
                setIsLoading(false);
                return;
            }

            console.log("✅ SUCCESS! Response Data:", registerData);
            Alert.alert('Success', 'Account created successfully!');
            navigation.navigate('Login');

        } catch (error) {
            console.error('========== NETWORK/FETCH ERROR ==========', {
                endpoint: ENDPOINTS.REGISTER,
                username,
                email,
                password: password ? '***' : '',
                firstName,
                lastName,
                name: error.name,
                message: error.message,
                stack: error.stack,
                fullError: error,
            });

            if (error.name === 'AbortError') {
                Alert.alert('Connection Timeout', 'The request timed out. Please check your internet connection.');
            } else {
                Alert.alert(
                    'Network Error',
                    'Network request failed. Please verify:\n1. Wi-Fi / Mobile Data is enabled on your device/emulator.\n2. Device date and time are accurate.\n3. The backend server is accessible.'
                );
            }
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us today!</Text>

            {/* COMMON FIELDS */}
            <TextInput
                style={styles.input}
                placeholder="Username *"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor="#949494"
            />
            <TextInput
                style={styles.input}
                placeholder="Email *"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#949494"
            />
            <View style={styles.row}>
                <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholderTextColor="#949494"
                />
                <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholderTextColor="#949494"
                />
            </View>
            <TextInput
                style={styles.input}
                placeholder="Password *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#949494"
            />

            {/* Submit Button */}
            <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.link}>Log In</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default SignUpScreen;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        paddingHorizontal: 25,
        paddingVertical: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        color: '#000'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    button: {
        backgroundColor: '#007BFF',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    footerText: {
        color: '#666',
        fontSize: 15,
    },
    link: {
        color: '#007BFF',
        fontSize: 15,
        fontWeight: 'bold',
    }
});