import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Surface, TextField } from '@/components';
import { spacing } from '@/theme';

export function ComplaintReplyForm({
  currentReply,
  disabled,
  loading,
  onSubmit,
}: {
  currentReply: string | null;
  disabled: boolean;
  loading: boolean;
  onSubmit: (reply: string) => void;
}) {
  const [reply, setReply] = useState(currentReply ?? '');

  const normalized = reply.trim();
  return (
    <Surface disabled={disabled} style={styles.card}>
      <TextField
        label="Current admin reply"
        placeholder="Write the current customer update"
        value={reply}
        onChangeText={setReply}
        editable={!disabled && !loading}
        multiline
        maxLength={1000}
      />
      <Button
        title="Save admin reply"
        icon="send-outline"
        variant="secondary"
        loading={loading}
        disabled={
          disabled || !normalized || normalized === (currentReply ?? '').trim()
        }
        onPress={() => onSubmit(normalized)}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({ card: { paddingBottom: spacing.lg } });
