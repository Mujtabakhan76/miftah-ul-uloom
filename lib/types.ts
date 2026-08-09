export interface BookSummary {
  _id: string;
  title: string;
  arabicTitle?: string;
  urduTitle?: string;
  author?: string;
  language: "arabic" | "urdu" | "mixed";
  category: string;
  description?: string;
  coverUrl?: string;
  pdfUrl: string;
  fileType?: "pdf" | "docx";
  pageCount: number;
  isSearchable: boolean;
  createdAt?: string;
}
