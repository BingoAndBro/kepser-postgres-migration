/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'user' | 'ppk' | 'bendahara' | 'arsiparis' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'Aktif' | 'Offline' | 'Suspended';
  avatar: string;
}

export interface Document {
  id: string;
  name: string;
  status: 'Approved' | 'Pending' | 'Revision' | 'Ready to Pay' | 'Archived';
  currentStep: string;
  dueDate: string;
  modified: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'dwg';
  size: string;
  owner: string;
  deptFunction: string;
  activityType: string;
  year: string;
  retentionPeriod?: string;
  department: string;
  activityName?: string;
  coa?: string;
  source?: string;
}

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'DOC-2024-00892',
    name: 'Q3_Financial_Audit_Report.pdf',
    status: 'Approved',
    currentStep: 'Final Review',
    dueDate: 'Oct 24, 2024',
    modified: '2h ago',
    type: 'pdf',
    size: '4.2 MB',
    owner: 'Sarah Jenkins',
    deptFunction: 'Audit Internal',
    activityType: 'Laporan Keuangan',
    year: '2024',
    retentionPeriod: '10 Tahun',
    department: 'Finance',
    activityName: 'Financial Audit 2024',
    coa: '521211',
    source: 'APBN 2024'
  },
  {
    id: 'DOC-2024-00893',
    name: 'Vendor_Agreement_Draft_v4.docx',
    status: 'Revision',
    currentStep: 'Legal Approval',
    dueDate: 'Today',
    modified: '15m ago',
    type: 'docx',
    size: '1.8 MB',
    owner: 'Michael Chen',
    deptFunction: 'Legal & Compliance',
    activityType: 'Kontrak Kerjasama',
    year: '2024',
    retentionPeriod: '5 Tahun',
    department: 'Legal'
  },
  {
    id: 'DOC-2024-00894',
    name: 'Employee_Onboarding_Checklist.xlsx',
    status: 'Pending',
    currentStep: 'HR Validation',
    dueDate: 'Oct 28, 2024',
    modified: '1d ago',
    type: 'xlsx',
    size: '0.5 MB',
    owner: 'Sarah Jenkins',
    deptFunction: 'Human Capital',
    activityType: 'Administrasi Pegawai',
    year: '2023',
    retentionPeriod: '3 Tahun',
    department: 'HR'
  },
  {
    id: 'DOC-2024-00895',
    name: 'Infrastructure_SLA_Agreement.pdf',
    status: 'Approved',
    currentStep: 'Archive Pending',
    dueDate: 'Nov 02, 2024',
    modified: '3d ago',
    type: 'pdf',
    size: '12.5 MB',
    owner: 'David Miller',
    deptFunction: 'IT Operations',
    activityType: 'Perjanjian Layanan',
    year: '2024',
    retentionPeriod: '7 Tahun',
    department: 'IT'
  },
  {
    id: 'DOC-2024-00896',
    name: 'SPP-LS Pengadaan Server IT 2024',
    status: 'Ready to Pay',
    currentStep: 'Pejabat Pembuat Komitmen',
    dueDate: 'Nov 05, 2024',
    modified: '2h ago',
    type: 'pdf',
    size: '4.2 MB',
    owner: 'Sarah Jenkins',
    deptFunction: 'IT Procurement',
    activityType: 'Pengadaan Barang',
    year: '2024',
    retentionPeriod: '10 Tahun',
    department: 'IT',
    activityName: 'Pengadaan Infrastruktur IT',
    coa: '521211',
    source: 'APBN 2024'
  }
];
