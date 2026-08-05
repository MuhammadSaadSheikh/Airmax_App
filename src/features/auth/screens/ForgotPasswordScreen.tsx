import { AppText as Text } from '@/components/foundation/AppText';
import { useAuthNavigation } from '@/navigation';
import { useState } from 'react';
import { Button, Header, Input, Screen, ui } from '@/components';
export default function Forgot() {
  const navigation = useAuthNavigation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <Screen>
      <Header
        title="Reset password"
        subtitle="We’ll send a secure reset link"
      />
      {sent ? (
        <>
          <Text style={[ui.body, { marginBottom: 16 }]}>
            A reset link was sent to {email}. Check your inbox and spam folder.
          </Text>
          <Button title="Back to sign in" onPress={() => navigation.goBack()} />
        </>
      ) : (
        <>
          <Input
            label="Email address"
            icon="mail-outline"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
          />
          <Button
            title="Send reset link"
            onPress={() => setSent(true)}
            disabled={!email.includes('@')}
          />
        </>
      )}
    </Screen>
  );
}
