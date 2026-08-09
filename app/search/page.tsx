import SearchClient from "./SearchClient";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="urdu-text text-3xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
          تلاش
        </h1>
        <p className="text-sm text-gray-500">کتاب کے نام سے تلاش کریں یا مکمل لائبریری میں عبارت تلاش کریں</p>
      </div>
      <SearchClient initialQuery={q || ""} />
    </div>
  );
}
