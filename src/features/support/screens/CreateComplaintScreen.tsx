import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  AppText,
  ErrorState,
  PrimaryButton,
  SkeletonCard,
  TextField,
  type AppIconName,
} from '@/components';
import { IssueCategoryCard } from '@/features/support/components';
import { useCustomerNavigation } from '@/navigation';
import { environment } from '@/config/environment';
import { useCustomerProfile } from '@/services/customer';
import {
  useCreateComplaint,
  type AttachmentType,
  type ComplaintAttachment,
  type ComplaintCategory,
} from '@/services/support';
import { animation, colors, radius, spacing, typography } from '@/theme';

const categories: { id: ComplaintCategory; name: string; icon: AppIconName }[] =
  [
    { id: 'internet', name: 'Internet issue', icon: 'cloud-offline-outline' },
    { id: 'speed', name: 'Speed issue', icon: 'speedometer-outline' },
    { id: 'router', name: 'Router issue', icon: 'hardware-chip-outline' },
    { id: 'billing', name: 'Billing issue', icon: 'receipt-outline' },
  ];

const attachmentIcons: Record<AttachmentType, AppIconName> = {
  image: 'image-outline',
  video: 'videocam-outline',
  voice: 'mic-outline',
};

export default function CreateComplaintScreen() {
  const navigation = useCustomerNavigation();
  const customerQuery = useCustomerProfile();
  const attachmentsEnabled = environment.useMockApi;
  const [category, setCategory] = useState<ComplaintCategory>('internet');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
  const selectedCategory = useMemo(
    () => categories.find(item => item.id === category),
    [category],
  );
  const mutation = useCreateComplaint(
    customerQuery.data?.id,
    customerQuery.data?.connectionId,
  );

  const pickMedia = async (type: 'image' | 'video') => {
    const result = await launchImageLibrary({
      mediaType: type === 'image' ? 'photo' : 'video',
      quality: 0.7,
      selectionLimit: 1,
    });
    const asset = result.assets?.[0];
    if (!result.didCancel && asset?.uri) {
      setAttachments(current => [
        ...current,
        {
          id: `${type}-${Date.now()}`,
          type,
          uri: asset.uri!,
          name: asset.fileName,
        },
      ]);
    }
  };

  const addVoiceNote = () => {
    const existing = attachments.some(item => item.type === 'voice');
    if (existing) {
      setAttachments(current => current.filter(item => item.type !== 'voice'));
      return;
    }
    setAttachments(current => [
      ...current,
      {
        id: `voice-${Date.now()}`,
        type: 'voice',
        uri: 'mock://voice-note',
        name: 'Voice note',
      },
    ]);
  };

  const valid = title.trim().length >= 4 && description.trim().length >= 10;

  if (customerQuery.isPending) {
    return (
      <AppScreen contentContainerStyle={styles.content}>
        <AppHeader title="Create complaint" showBack />
        <SkeletonCard lines={6} />
      </AppScreen>
    );
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <AppScreen contentContainerStyle={styles.content}>
        <AppHeader title="Create complaint" showBack />
        <ErrorState
          title="Customer profile unavailable"
          message="We couldn't verify your complaint ownership."
          retry={() => void customerQuery.refetch()}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
    >
      <AppHeader
        title="Create complaint"
        subtitle="Tell us what happened"
        showBack
      />
      <AppText style={styles.sectionTitle}>Select category</AppText>
      <View accessibilityRole="radiogroup" style={styles.categories}>
        {categories.map(item => (
          <IssueCategoryCard
            key={item.id}
            icon={item.icon}
            name={item.name}
            selected={category === item.id}
            onPress={() => setCategory(item.id)}
          />
        ))}
      </View>
      <AppText style={styles.sectionTitle}>Add details</AppText>
      <TextField
        label="Issue title"
        placeholder={`Briefly describe your ${selectedCategory?.name.toLowerCase() ?? 'issue'}`}
        value={title}
        onChangeText={setTitle}
        maxLength={80}
      />
      <TextField
        label="Description"
        placeholder="When did it start and how is it affecting your service?"
        multiline
        numberOfLines={5}
        value={description}
        onChangeText={setDescription}
        style={styles.description}
        maxLength={800}
      />
      <View style={styles.attachments}>
        {(['image', 'video', 'voice'] as const).map(type => {
          const attached = attachments.some(item => item.type === type);
          return (
            <Pressable
              key={type}
              accessibilityRole="button"
              accessibilityLabel={`${attached ? 'Remove' : 'Add'} ${type} attachment`}
              disabled={!attachmentsEnabled}
              onPress={() => {
                if (!attachmentsEnabled) return;
                if (type === 'voice') addVoiceNote();
                else void pickMedia(type);
              }}
              style={({ pressed }) => [
                styles.attachment,
                attached && styles.attachmentActive,
                !attachmentsEnabled && styles.attachmentDisabled,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon
                name={attached ? 'checkmark-circle' : attachmentIcons[type]}
                color={attached ? colors.success : colors.primary}
              />
              <AppText style={styles.attachmentLabel}>{type}</AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText style={styles.privacy}>
        {attachmentsEnabled
          ? 'Don’t include passwords or payment card information. Media remains attached only to this ticket.'
          : 'Attachments are unavailable in live mode until secure upload is supported. Your complaint text will still be submitted.'}
      </AppText>
      <PrimaryButton
        title="SUBMIT COMPLAINT"
        icon="send-outline"
        loading={mutation.isPending}
        disabled={!valid || mutation.isPending}
        onPress={() =>
          mutation.mutate(
            {
              category,
              title: title.trim(),
              description: description.trim(),
              attachments: attachmentsEnabled ? attachments : undefined,
            },
            {
              onSuccess: complaint =>
                navigation.replace('ComplaintDetail', { id: complaint.id }),
              onError: () =>
                Alert.alert(
                  'Unable to submit',
                  'Please try again in a moment.',
                ),
            },
          )
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.huge, gap: spacing.lg },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  description: {
    minHeight: 122,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  attachments: { flexDirection: 'row', gap: spacing.sm },
  attachment: {
    flex: 1,
    minHeight: 74,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  attachmentActive: {
    borderColor: colors.success,
    backgroundColor: colors.surfaceAccent,
  },
  attachmentDisabled: { opacity: 0.45 },
  attachmentLabel: {
    ...typography.small,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  privacy: { ...typography.small, color: colors.muted },
  pressed: { opacity: animation.opacity.pressed },
});
