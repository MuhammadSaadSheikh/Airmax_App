import { AppText as Text } from '@/components/foundation/AppText';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Header, Input, Screen, ui } from '@/components';
import { colors } from '@/theme';
import { useAuthStore } from '@/store/auth.store';
import { environment } from '@/config/environment';
export default function OTP() {
  const [phone, setPhone] = useState('+92 300 1234567');
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [developmentCode, setDevelopmentCode] = useState<string>();
  const [requestError, setRequestError] = useState<string>();
  const requestOtp = useAuthStore(s => s.requestOtp);
  const verifyOtp = useAuthStore(s => s.verifyOtp);
  const authError = useAuthStore(s => s.error);
  const authStatus = useAuthStore(s => s.status);

  const sendCode = async () => {
    setRequestError(undefined);
    try {
      const challenge = await requestOtp(phone);
      setDevelopmentCode(challenge.developmentCode);
      setSent(true);
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : 'Unable to send code',
      );
    }
  };

  const verify = async () => {
    try {
      await verifyOtp(phone, otp);
    } catch {
      // The store owns the user-facing authentication error.
    }
  };
  return (
    <Screen>
      <Header
        title="OTP sign in"
        subtitle={
          sent ? `Code sent to ${phone}` : 'Use your registered mobile number'
        }
      />
      {!sent ? (
        <>
          <Input
            label="Mobile number"
            icon="call-outline"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Button
            title="Send verification code"
            onPress={() => void sendCode()}
          />
          {requestError ? (
            <Text style={styles.error}>{requestError}</Text>
          ) : null}
        </>
      ) : (
        <>
          <Text style={ui.label}>6-digit code</Text>
          <View style={styles.code}>
            <Input
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
            />
          </View>
          {environment.useMockApi ? (
            <Text style={ui.small}>
              Demo code: {developmentCode ?? '123456'}
            </Text>
          ) : null}
          {authError ? <Text style={styles.error}>{authError}</Text> : null}
          <Button
            title="Verify & continue"
            disabled={otp.length !== 6}
            loading={authStatus === 'authenticating'}
            onPress={() => void verify()}
          />
          <Button
            title="Resend code"
            variant="ghost"
            onPress={() => setOtp('')}
          />
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  code: { marginTop: 8 },
  error: { color: colors.danger, fontSize: 13, marginVertical: 8 },
});
