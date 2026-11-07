// Tipos do banco. Escritos à mão a partir de supabase/migrations; para regenerar
// a partir do projeto real:
//   npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Platform = "tiktok" | "youtube" | "instagram";
type VideoStatus = "gerado" | "aprovado" | "agendado" | "publicado";
type VideoSource = "upload" | "gerado";

type AccountRow = {
  id: string;
  user_id: string;
  platform: Platform;
  username: string;
  display_name: string;
  description: string | null;
  niche: string | null;
  created_at: string;
};

type VideoRow = {
  id: string;
  user_id: string;
  account_id: string;
  title: string;
  caption: string | null;
  hashtags: string[];
  file_key: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  file_mime: string | null;
  file_deleted_at: string | null;
  status: VideoStatus;
  scheduled_at: string | null;
  published_url: string | null;
  published_at: string | null;
  notes: string | null;
  source: VideoSource;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: AccountRow;
        Insert: Omit<AccountRow, "id" | "user_id" | "created_at" | "description" | "niche"> &
          Partial<Pick<AccountRow, "id" | "user_id" | "created_at" | "description" | "niche">>;
        Update: Partial<AccountRow>;
        Relationships: [];
      };
      videos: {
        Row: VideoRow;
        Insert: Pick<VideoRow, "account_id" | "title"> & Partial<Omit<VideoRow, "account_id" | "title">>;
        Update: Partial<VideoRow>;
        Relationships: [
          {
            foreignKeyName: "videos_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      account_overview: {
        Row: AccountRow & { pending_count: number; video_count: number };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      platform: Platform;
      video_status: VideoStatus;
      video_source: VideoSource;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Account = AccountRow;
export type AccountOverview = Database["public"]["Views"]["account_overview"]["Row"];
export type Video = VideoRow;
