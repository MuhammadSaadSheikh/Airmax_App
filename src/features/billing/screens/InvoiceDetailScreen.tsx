import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet } from 'react-native';
import { AppHeader, AppScreen, ErrorState, PrimaryButton, SkeletonCard } from '@/components';
import { ReceiptPreview } from '@/features/billing/components';
import type { CustomerStackParamList } from '@/navigation';
import { billingCenterService } from '@/services/billing';
import { queryKeys } from '@/services/query';
import { spacing } from '@/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'InvoiceDetail'>;
export default function InvoiceDetailScreen({ route }: Props) {
  const query = useQuery({ queryKey: queryKeys.invoiceDetail(route.params.id), queryFn: () => billingCenterService.getInvoice(route.params.id), staleTime: 30_000 });
  if (query.isPending) return <AppScreen><AppHeader title="Invoice details" showBack /><SkeletonCard lines={7} /></AppScreen>;
  if (query.isError || !query.data) return <AppScreen><AppHeader title="Invoice details" showBack /><ErrorState title="Invoice unavailable" message="This invoice could not be found." retry={() => void query.refetch()} /></AppScreen>;
  return <AppScreen contentContainerStyle={styles.content}><AppHeader title="Invoice details" subtitle={query.data.id} showBack /><ReceiptPreview invoice={query.data} /><PrimaryButton title="DOWNLOAD RECEIPT" icon="download-outline" onPress={() => Alert.alert('Receipt ready', 'Receipt download will be enabled with the billing backend.')} /></AppScreen>;
}
const styles = StyleSheet.create({ content: { paddingBottom: spacing.huge, gap: spacing.lg } });
