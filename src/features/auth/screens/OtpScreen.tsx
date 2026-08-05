import { AppText as Text } from '@/components/foundation/AppText';
import { navigationActions } from '@/navigation';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Header, Input, Screen, ui } from '@/components';
import { colors } from '@/theme';
import { useAuthStore } from '@/store/auth.store';
export default function OTP() {
  const [phone, setPhone] = useState('+92 300 1234567');
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState('');
  const signIn = useAuthStore(s => s.signIn);
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
            onPress={() => setSent(true)}
          />
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
          <Text style={ui.small}>Demo code: enter any 6 digits</Text>
          <Button
            title="Verify & continue"
            disabled={otp.length !== 6}
            onPress={() => {
              signIn('customer', phone);
              navigationActions.showPortal('customer');
            }}
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
  hint: { color: colors.muted },
});
