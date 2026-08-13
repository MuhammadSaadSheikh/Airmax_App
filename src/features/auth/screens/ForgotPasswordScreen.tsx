import { AppText as Text } from '@/components/foundation/AppText';
import { useAuthNavigation } from '@/navigation';
import { Button, Header, Screen, ui } from '@/components';

export default function ForgotPasswordScreen() {
  const navigation = useAuthNavigation();
  return (
    <Screen>
      <Header
        title="Password reset unavailable"
        subtitle="This service has not been enabled yet"
      />
      <Text style={[ui.body, { marginBottom: 16 }]}>
        Contact AIRMAX support to recover access. This app will not claim that a
        reset message was sent until the backend supports password recovery.
      </Text>
      <Button title="Back to sign in" onPress={() => navigation.goBack()} />
    </Screen>
  );
}
