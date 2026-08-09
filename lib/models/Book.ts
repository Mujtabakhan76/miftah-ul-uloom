import mongoose, { Schema, models, model } from "mongoose";

export interface IBookPage {
  pageNumber: number;
  text: string; // original text, A'raab preserved as extracted
  normalizedText: string; // diacritic-insensitive, normalized for search
}

export interface IBook {
  _id?: string;
  title: string; // transliterated / display title
  arabicTitle?: string;
  urduTitle?: string;
  author?: string;
  language: "arabic" | "urdu" | "mixed";
  category: string;
  description?: string;
  keywords: string[];
  tags: string[];
  coverUrl?: string;
  pdfUrl: string;
  fileType: "pdf" | "docx";
  pageCount: number;
  isSearchable: boolean; // false => no extractable text layer, needs OCR
  pages: IBookPage[]; // page-wise extracted + normalized text
  createdAt?: Date;
  updatedAt?: Date;
}

const BookPageSchema = new Schema<IBookPage>(
  {
    pageNumber: { type: Number, required: true },
    text: { type: String, default: "" },
    normalizedText: { type: String, default: "" },
  },
  { _id: false }
);

const BookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, trim: true },
    arabicTitle: { type: String, trim: true },
    urduTitle: { type: String, trim: true },
    author: { type: String, trim: true },
    language: { type: String, enum: ["arabic", "urdu", "mixed"], required: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
    keywords: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    coverUrl: { type: String },
    pdfUrl: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "docx"], default: "pdf" },
    pageCount: { type: Number, default: 0 },
    isSearchable: { type: Boolean, default: false },
    pages: { type: [BookPageSchema], default: [] },
  },
  { timestamps: true }
);

// Full-text index across metadata + normalized page text for "search all books"
BookSchema.index(
  {
    title: "text",
    arabicTitle: "text",
    urduTitle: "text",
    author: "text",
    keywords: "text",
    tags: "text",
    "pages.normalizedText": "text",
  },
  {
    name: "book_fulltext_index",
    weights: {
      title: 10,
      arabicTitle: 10,
      urduTitle: 10,
      author: 6,
      keywords: 5,
      tags: 4,
      "pages.normalizedText": 1,
    },
  }
);

export default models.Book || model<IBook>("Book", BookSchema);
