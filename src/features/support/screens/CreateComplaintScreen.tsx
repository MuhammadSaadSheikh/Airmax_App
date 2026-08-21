import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  AppHeader,
  AppIcon,
  AppScreen,
  AppText,
  PrimaryButton,
  TextField,
  type AppIconName,
} from '@/components';
import { IssueCategoryCard } from '@/features/support/components';
import { useCustomerNavigation } from '@/navigation';
import { invalidateAdminMutation, queryKeys } from '@/services/query';
import {
  supportService,
  type AttachmentType,
  type ComplaintAttachment,
  type ComplaintCategory,
} from '@/services/support';
import { useAuthStore } from '@/store/auth.store';
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
  const queryClient = useQueryClient();
  const connectionId = useAuthStore(
    state => state.user?.connectionId ?? 'unknown',
  );
  const [category, setCategory] = useState<ComplaintCategory>('internet');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
  const selectedCategory = useMemo(
    () => categories.find(item => item.id === category),
    [category],
  );

  const mutation = useMutation({
    mutationFn: () =>
      supportService.createComplaint(connectionId, {
        category,
        title: title.trim(),
        description: description.trim(),
        attachments,
      }),
    onSuccess: complaint => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.supportComplaints(connectionId),
      });
      queryClient.setQueryData(
        queryKeys.supportComplaintDetail(connectionId, complaint.id),
        complaint,
      );
      void invalidateAdminMutation(queryClient, 'complaint');
      navigation.replace('ComplaintDetail', { id: complaint.id });
    },
    onError: () =>
      Alert.alert('Unable to submit', 'Please try again in a moment.'),
  });

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
              onPress={() => {
                if (type === 'voice') addVoiceNote();
                else void pickMedia(type);
              }}
              style={({ pressed }) => [
                styles.attachment,
                attached && styles.attachmentActive,
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
        Don’t include passwords or payment card information. Media remains
        attached only to this ticket.
      </AppText>
      <PrimaryButton
        title="SUBMIT COMPLAINT"
        icon="send-outline"
        loading={mutation.isPending}
        disabled={!valid}
        onPress={() => mutation.mutate()}
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
  attachmentLabel: {
    ...typography.small,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  privacy: { ...typography.small, color: colors.muted },
  pressed: { opacity: animation.opacity.pressed },
});
