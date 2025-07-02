export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      call_tags: {
        Row: {
          call_id: string
          confidence_score: number | null
          created_at: string | null
          id: string
          tag: string
        }
        Insert: {
          call_id: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          tag: string
        }
        Update: {
          call_id?: string
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_tags_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          agent_name: string | null
          call_source: string | null
          call_type: string | null
          created_at: string | null
          customer_phone: string | null
          department: string | null
          duration_seconds: number | null
          file_name: string | null
          file_url: string | null
          id: string
          status: Database["public"]["Enums"]["call_status"] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_name?: string | null
          call_source?: string | null
          call_type?: string | null
          created_at?: string | null
          customer_phone?: string | null
          department?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          status?: Database["public"]["Enums"]["call_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string | null
          call_source?: string | null
          call_type?: string | null
          created_at?: string | null
          customer_phone?: string | null
          department?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          status?: Database["public"]["Enums"]["call_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      quality_scores: {
        Row: {
          ai_feedback: string | null
          ai_score: number | null
          call_id: string
          communication_score: number | null
          created_at: string | null
          empathy_score: number | null
          flags: Json | null
          follow_up_score: number | null
          human_feedback: string | null
          human_score: number | null
          id: string
          improvement_areas: string[] | null
          manual_review_notes: string | null
          manual_review_required: boolean | null
          manual_review_status: string | null
          overall_satisfaction_score: number | null
          problem_resolution_score: number | null
          professionalism_score: number | null
          quality_checklist: Json | null
          requires_review: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          updated_at: string | null
        }
        Insert: {
          ai_feedback?: string | null
          ai_score?: number | null
          call_id: string
          communication_score?: number | null
          created_at?: string | null
          empathy_score?: number | null
          flags?: Json | null
          follow_up_score?: number | null
          human_feedback?: string | null
          human_score?: number | null
          id?: string
          improvement_areas?: string[] | null
          manual_review_notes?: string | null
          manual_review_required?: boolean | null
          manual_review_status?: string | null
          overall_satisfaction_score?: number | null
          problem_resolution_score?: number | null
          professionalism_score?: number | null
          quality_checklist?: Json | null
          requires_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          updated_at?: string | null
        }
        Update: {
          ai_feedback?: string | null
          ai_score?: number | null
          call_id?: string
          communication_score?: number | null
          created_at?: string | null
          empathy_score?: number | null
          flags?: Json | null
          follow_up_score?: number | null
          human_feedback?: string | null
          human_score?: number | null
          id?: string
          improvement_areas?: string[] | null
          manual_review_notes?: string | null
          manual_review_required?: boolean | null
          manual_review_status?: string | null
          overall_satisfaction_score?: number | null
          problem_resolution_score?: number | null
          professionalism_score?: number | null
          quality_checklist?: Json | null
          requires_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_scores_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      review_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          call_id: string
          completed_at: string | null
          id: string
          reviewer_id: string
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          call_id: string
          completed_at?: string | null
          id?: string
          reviewer_id: string
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          call_id?: string
          completed_at?: string | null
          id?: string
          reviewer_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_assignments_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      transcription_segments: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          end_time: number
          id: string
          start_time: number
          text: string
          transcription_id: string
          word_count: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          end_time: number
          id?: string
          start_time: number
          text: string
          transcription_id: string
          word_count?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          end_time?: number
          id?: string
          start_time?: number
          text?: string
          transcription_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transcription_segments_transcription_id"
            columns: ["transcription_id"]
            isOneToOne: false
            referencedRelation: "transcriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      transcriptions: {
        Row: {
          call_id: string
          confidence_score: number | null
          content: string
          created_at: string | null
          id: string
        }
        Insert: {
          call_id: string
          confidence_score?: number | null
          content: string
          created_at?: string | null
          id?: string
        }
        Update: {
          call_id?: string
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_overall_score: {
        Args: {
          communication: number
          problem_resolution: number
          professionalism: number
          empathy: number
          follow_up: number
        }
        Returns: number
      }
      extract_audio_duration: {
        Args: { file_path: string }
        Returns: number
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "reviewer" | "user"
      call_status:
        | "uploaded"
        | "transcribing"
        | "transcribed"
        | "analyzing"
        | "analyzed"
        | "reviewed"
      sentiment_type: "positive" | "negative" | "neutral"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "reviewer", "user"],
      call_status: [
        "uploaded",
        "transcribing",
        "transcribed",
        "analyzing",
        "analyzed",
        "reviewed",
      ],
      sentiment_type: ["positive", "negative", "neutral"],
    },
  },
} as const
