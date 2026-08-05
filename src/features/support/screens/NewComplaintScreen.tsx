import { AppText as Text } from '@/components/foundation/AppText';
import { launchImageLibrary } from 'react-native-image-picker';
import { useCustomerNavigation } from '@/navigation';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button, Header, Input, Screen, ui } from '@/components';
import { colors } from '@/theme';
import { useAppStore } from '@/store/app.store';
const cats = [
  'Slow Speed',
  'No Internet',
  'Connection Dropping',
  'Router Problem',
  'Wrong Bill',
  'Payment Not Updated',
  'Package Change',
  'Installation Request',
];
export default function NewComplaint() {
  const navigation = useCustomerNavigation();
  const [cat, setCat] = useState('Slow Speed');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState<string>();
  const add = useAppStore(s => s.addComplaint);
  const pick = async () => {
    const r = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
      selectionLimit: 1,
    });
    if (!r.didCancel) setImage(r.assets?.[0]?.uri);
  };
  const submit = () => {
    const item = add(cat, desc);
    Alert.alert('Complaint submitted', `Your tracking ID is ${item.id}`, [
      {
        text: 'Track complaint',
        onPress: () =>
          navigation.navigate('CustomerTabs', { screen: 'Support' }),
      },
    ]);
  };
  return (
    <Screen>
      <Header title="Create complaint" subtitle="Tell us what went wrong" />
      <Text style={ui.label}>Category</Text>
      <View style={styles.chips}>
        {cats.map(c => (
          <Pressable
            key={c}
            onPress={() => setCat(c)}
            style={[styles.chip, cat === c && styles.active]}
          >
            <Text
              style={[styles.chipText, cat === c && { color: colors.primary }]}
            >
              {c}
            </Text>
          </Pressable>
        ))}
      </View>
      <Input
        label="Description"
        placeholder="Describe the issue and when it started…"
        multiline
        numberOfLines={5}
        value={desc}
        onChangeText={setDesc}
        style={{ height: 110, textAlignVertical: 'top', paddingTop: 14 }}
      />
      <Button
        title={image ? 'Image attached' : 'Attach an image'}
        icon={image ? 'checkmark' : 'camera-outline'}
        variant="secondary"
        onPress={pick}
      />
      <Text style={[ui.small, { marginTop: 12 }]}>
        Please don’t include passwords or payment card information.
      </Text>
      <Button
        title="Submit complaint"
        onPress={submit}
        disabled={desc.trim().length < 10}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: colors.surface,
  },
  active: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAccent,
  },
  chipText: { color: colors.muted, fontWeight: '600', fontSize: 12 },
});
