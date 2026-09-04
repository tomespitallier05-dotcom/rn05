// Généré depuis le schéma Supabase (projet rn05). Ne pas éditer à la main :
// régénérer via l'outil MCP generate_typescript_types après chaque migration.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          auteur_id: string
          categorie: Database["public"]["Enums"]["categorie_annonce"]
          corps: string
          epingle: boolean
          id: string
          publie_le: string
          titre: string
        }
        Insert: {
          auteur_id: string
          categorie: Database["public"]["Enums"]["categorie_annonce"]
          corps: string
          epingle?: boolean
          id?: string
          publie_le?: string
          titre: string
        }
        Update: {
          auteur_id?: string
          categorie?: Database["public"]["Enums"]["categorie_annonce"]
          corps?: string
          epingle?: boolean
          id?: string
          publie_le?: string
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          id_cible: string | null
          ip: unknown
          table_cible: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          id_cible?: string | null
          ip?: unknown
          table_cible: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          id_cible?: string | null
          ip?: unknown
          table_cible?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          created_at: string
          created_by: string
          id: string
          nom: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          nom: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          nom?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          dossier_id: string | null
          id: string
          mime: string
          nom: string
          role_minimum: Database["public"]["Enums"]["role_utilisateur"]
          storage_path: string
          taille: number
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          dossier_id?: string | null
          id?: string
          mime: string
          nom: string
          role_minimum?: Database["public"]["Enums"]["role_utilisateur"]
          storage_path: string
          taille: number
          uploaded_by: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          dossier_id?: string | null
          id?: string
          mime?: string
          nom?: string
          role_minimum?: Database["public"]["Enums"]["role_utilisateur"]
          storage_path?: string
          taille?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          categorie: Database["public"]["Enums"]["categorie_evenement"]
          couleur: string | null
          created_at: string
          created_by: string
          debut: string
          deleted_at: string | null
          description: string | null
          fin: string
          id: string
          lieu: string | null
          organisateur_id: string | null
          titre: string
          visibilite: Database["public"]["Enums"]["visibilite_evenement"]
        }
        Insert: {
          categorie: Database["public"]["Enums"]["categorie_evenement"]
          couleur?: string | null
          created_at?: string
          created_by: string
          debut: string
          deleted_at?: string | null
          description?: string | null
          fin: string
          id?: string
          lieu?: string | null
          organisateur_id?: string | null
          titre: string
          visibilite?: Database["public"]["Enums"]["visibilite_evenement"]
        }
        Update: {
          categorie?: Database["public"]["Enums"]["categorie_evenement"]
          couleur?: string | null
          created_at?: string
          created_by?: string
          debut?: string
          deleted_at?: string | null
          description?: string | null
          fin?: string
          id?: string
          lieu?: string | null
          organisateur_id?: string | null
          titre?: string
          visibilite?: Database["public"]["Enums"]["visibilite_evenement"]
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organisateur_id_fkey"
            columns: ["organisateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          commune: string | null
          consentement_traitement_le: string | null
          created_at: string
          deleted_at: string | null
          fonction_rn: string | null
          id: string
          last_seen_at: string | null
          nom: string | null
          onboarding_complete: boolean
          photo_url: string | null
          prenom: string | null
          profession: string | null
          role: Database["public"]["Enums"]["role_utilisateur"]
          secteur: string | null
          statut: Database["public"]["Enums"]["statut_compte"]
        }
        Insert: {
          bio?: string | null
          commune?: string | null
          consentement_traitement_le?: string | null
          created_at?: string
          deleted_at?: string | null
          fonction_rn?: string | null
          id: string
          last_seen_at?: string | null
          nom?: string | null
          onboarding_complete?: boolean
          photo_url?: string | null
          prenom?: string | null
          profession?: string | null
          role?: Database["public"]["Enums"]["role_utilisateur"]
          secteur?: string | null
          statut?: Database["public"]["Enums"]["statut_compte"]
        }
        Update: {
          bio?: string | null
          commune?: string | null
          consentement_traitement_le?: string | null
          created_at?: string
          deleted_at?: string | null
          fonction_rn?: string | null
          id?: string
          last_seen_at?: string | null
          nom?: string | null
          onboarding_complete?: boolean
          photo_url?: string | null
          prenom?: string | null
          profession?: string | null
          role?: Database["public"]["Enums"]["role_utilisateur"]
          secteur?: string | null
          statut?: Database["public"]["Enums"]["statut_compte"]
        }
        Relationships: []
      }
      profiles_contact: {
        Row: {
          profile_id: string
          telephone: string | null
        }
        Insert: {
          profile_id: string
          telephone?: string | null
        }
        Update: {
          profile_id?: string
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_contact_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categorie_annonce:
        | "organisation"
        | "evenement"
        | "communication"
        | "urgent"
      categorie_evenement:
        | "reunion"
        | "evenement"
        | "deplacement"
        | "permanence"
      role_utilisateur: "admin" | "bureau" | "responsable" | "membre"
      statut_compte: "actif" | "suspendu" | "archive"
      visibilite_evenement: "tous" | "bureau" | "role"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categorie_annonce: [
        "organisation",
        "evenement",
        "communication",
        "urgent",
      ],
      categorie_evenement: [
        "reunion",
        "evenement",
        "deplacement",
        "permanence",
      ],
      role_utilisateur: ["admin", "bureau", "responsable", "membre"],
      statut_compte: ["actif", "suspendu", "archive"],
      visibilite_evenement: ["tous", "bureau", "role"],
    },
  },
} as const
