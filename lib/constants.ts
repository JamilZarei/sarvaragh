export const SITE_NAME = "کتاب‌گرد";
export const SITE_NAME_EN = "KetabGard";
export const SITE_TAGLINE = "کتاب بعدی‌ات را کشف کن.";
export const SITE_DESCRIPTION =
  "کتابخانه دیجیتال کتاب‌گرد؛ جستجو، کشف و ذخیره کتاب‌ها با داده‌های باز Open Library.";

export const OPEN_LIBRARY_URL = "https://openlibrary.org";
export const OPEN_LIBRARY_DOCS_URL = "https://openlibrary.org/developers/api";

export const PAGE_SIZE = 24;
/** Open Library gets slow and unreliable for very deep offsets. */
export const MAX_PAGE = 100;
export const MAX_QUERY_LENGTH = 120;

export const MIN_YEAR = 1450;
export const MAX_YEAR = new Date().getFullYear();

export type SubjectKey =
  | "literature"
  | "philosophy"
  | "psychology"
  | "history"
  | "science"
  | "business"
  | "fiction"
  | "programming"
  | "poetry"
  | "biography"
  | "children"
  | "fantasy"
  | "scifi"
  | "mystery"
  | "selfhelp"
  | "economics";

export type Subject = {
  key: SubjectKey;
  label: string;
  /**
   * Open Library `subject_key` (exact, normalized subject). Exact keys avoid
   * phrase matches such as "science" also matching "science fiction".
   */
  olSubject: string;
  description: string;
};

export const SUBJECTS: readonly Subject[] = [
  { key: "literature", label: "ادبیات", olSubject: "literature", description: "شعر، نقد و آثار ادبی" },
  { key: "fiction", label: "داستان و رمان", olSubject: "fiction", description: "رمان، داستان کوتاه و روایت" },
  { key: "philosophy", label: "فلسفه", olSubject: "philosophy", description: "اندیشه، اخلاق و هستی" },
  { key: "psychology", label: "روان‌شناسی", olSubject: "psychology", description: "ذهن، رفتار و احساسات" },
  { key: "history", label: "تاریخ", olSubject: "history", description: "رویدادها، تمدن‌ها و مردم" },
  { key: "science", label: "علوم", olSubject: "science", description: "طبیعت، کیهان و کشف" },
  { key: "business", label: "کسب‌وکار", olSubject: "business", description: "مدیریت، اقتصاد و کارآفرینی" },
  { key: "programming", label: "برنامه‌نویسی و فناوری", olSubject: "programming", description: "کد، نرم‌افزار و رایانه" },
  { key: "poetry", label: "شعر", olSubject: "poetry", description: "شعر کلاسیک و معاصر" },
  { key: "biography", label: "زندگی‌نامه و خاطرات", olSubject: "biography", description: "زندگی آدم‌های واقعی" },
  { key: "children", label: "کودک و نوجوان", olSubject: "juvenile_fiction", description: "قصه‌ها و رمان‌های نوجوانان" },
  { key: "fantasy", label: "فانتزی", olSubject: "fantasy", description: "جادو، اژدها و جهان‌های خیالی" },
  { key: "scifi", label: "علمی‌تخیلی", olSubject: "science_fiction", description: "آینده، فضا و فناوری" },
  { key: "mystery", label: "معمایی و جنایی", olSubject: "detective_and_mystery_stories", description: "کارآگاه‌ها و رازهای حل‌نشده" },
  { key: "selfhelp", label: "رشد فردی", olSubject: "self-help_techniques", description: "عادت، انگیزه و موفقیت" },
  { key: "economics", label: "اقتصاد", olSubject: "economics", description: "پول، بازار و جامعه" },
] as const;

export const SUBJECT_KEYS = SUBJECTS.map((s) => s.key);

export function getSubject(key: string): Subject | undefined {
  return SUBJECTS.find((s) => s.key === key);
}

export type LanguageOption = { code: string; label: string };

/** MARC language codes used by Open Library. */
export const LANGUAGES: readonly LanguageOption[] = [
  { code: "per", label: "فارسی" },
  { code: "eng", label: "انگلیسی" },
  { code: "ara", label: "عربی" },
  { code: "fre", label: "فرانسوی" },
  { code: "ger", label: "آلمانی" },
  { code: "spa", label: "اسپانیایی" },
  { code: "ita", label: "ایتالیایی" },
  { code: "rus", label: "روسی" },
  { code: "tur", label: "ترکی" },
  { code: "jpn", label: "ژاپنی" },
] as const;

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function getLanguageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export type SortKey = "relevance" | "popular" | "rating" | "new" | "old" | "editions" | "title-asc" | "title-desc";

export type SortOption = {
  key: SortKey;
  label: string;
  /** Value sent to Open Library; `null` means default relevance ranking. */
  olSort: "new" | "old" | "editions" | "readinglog" | "rating" | null;
  /** Short explanation shown under the results for metric-based sorts. */
  note?: string;
  /** True when sorting happens on the loaded page only (API has no equivalent). */
  clientSide: boolean;
};

export const SORT_OPTIONS: readonly SortOption[] = [
  { key: "relevance", label: "مرتبط‌ترین", olSort: null, clientSide: false },
  {
    key: "popular",
    label: "محبوب‌ترین",
    olSort: "readinglog",
    clientSide: false,
    note: "محبوبیت بر اساس تعداد کاربران Open Library است که کتاب را در فهرست مطالعه خود گذاشته‌اند.",
  },
  {
    key: "rating",
    label: "بالاترین امتیاز",
    olSort: "rating",
    clientSide: false,
    note: "امتیاز میانگین کاربران Open Library؛ فقط کتاب‌هایی با دست‌کم ۲۰ رأی در این ترتیب می‌آیند.",
  },
  { key: "new", label: "جدیدترین انتشار", olSort: "new", clientSide: false },
  { key: "old", label: "قدیمی‌ترین انتشار", olSort: "old", clientSide: false },
  {
    key: "editions",
    label: "بیشترین ویرایش",
    olSort: "editions",
    clientSide: false,
    note: "تعداد ویرایش‌ها شاخصی تقریبی از ماندگاری یک اثر است، نه آمار فروش.",
  },
  { key: "title-asc", label: "عنوان (الف تا ی)", olSort: null, clientSide: true },
  { key: "title-desc", label: "عنوان (ی تا الف)", olSort: null, clientSide: true },
] as const;

export const SORT_KEYS = SORT_OPTIONS.map((s) => s.key);

export function getSortOption(key: SortKey): SortOption {
  return SORT_OPTIONS.find((s) => s.key === key) ?? SORT_OPTIONS[0];
}

/** Minimum ratings for the "rating" sort, so one 5-star vote does not top the list. */
export const MIN_RATINGS_FOR_SORT = 20;

/** Popularity filter: minimum number of Open Library reading-log entries. */
export type PopularityLevel = 0 | 100 | 1000;

export const POPULARITY_LEVELS: readonly { value: PopularityLevel; label: string; hint: string }[] = [
  { value: 0, label: "همه", hint: "بدون محدودیت" },
  { value: 100, label: "محبوب", hint: "۱۰۰+ خواننده" },
  { value: 1000, label: "پرطرفدار", hint: "۱٬۰۰۰+ خواننده" },
] as const;

export type ViewMode = "grid" | "list";

export type SearchField = "all" | "title" | "author";

export const SEARCH_FIELDS: readonly { key: SearchField; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "title", label: "عنوان" },
  { key: "author", label: "نویسنده" },
] as const;
