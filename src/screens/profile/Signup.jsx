import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import ENDPOINTS from '../../endpoint/endpoints';

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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            // STEP 1: Create FormData payload matching Postman collection
            const formData = new FormData();
            formData.append('username', username.trim());
            formData.append('email', email.trim());
            formData.append('password', password);
            if (firstName.trim()) formData.append('first_name', firstName.trim());
            if (lastName.trim()) formData.append('last_name', lastName.trim());

            console.log(`Hitting URL: ${ENDPOINTS.REGISTER}`);
            console.log('Signup payload:', { username: username.trim(), email: email.trim(), password: '***' });

            const registerResponse = await fetch(ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.trim(),
                    email: email.trim(),
                    password,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                }),
            });

            console.log('HTTP Status Code:', registerResponse.status);
            const registerRawText = await registerResponse.text();
            console.log("Raw Server Response:", registerRawText);

            let registerData = {};
            try {
                registerData = registerRawText ? JSON.parse(registerRawText) : {};
            } catch (jsonError) {
                Alert.alert('Server Error', 'Invalid response format received from server.');
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
                name: error.name,
                message: error.message,
                stack: error.stack,
            });

            console.log("--- ADVANCED ERROR DEBUGGING ---");
            console.log("Error toString():", error.toString());
            console.log("Error JSON stringify:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            console.log("--------------------------------");

            if (error.name === 'AbortError') {
                Alert.alert('Connection Timeout', 'The request took too long. Please check your internet connection and try again.');
            } else if (error instanceof TypeError) {
                Alert.alert('Network Error', 'Unable to reach the server. Please check your internet connection and the API URL.');
            } else {
                Alert.alert(
                    'Network Error',
                    `Request failed: ${error.message}`
                );
            }
        } finally {
            clearTimeout(timeoutId);
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