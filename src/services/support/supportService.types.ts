import type {
  Complaint,
  ComplaintDetail,
  CreateComplaintInput,
  SupportCategory,
} from './models';

export interface SupportService {
  getComplaints(customerReference: string): Promise<Complaint[]>;
  createComplaint(
    customerReference: string,
    complaint: CreateComplaintInput,
  ): Promise<ComplaintDetail>;
  getComplaintDetail(
    customerReference: string,
    id: string,
  ): Promise<ComplaintDetail | undefined>;
  getCategories(): Promise<SupportCategory[]>;
}
