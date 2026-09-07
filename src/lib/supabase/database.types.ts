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
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
      appels: {
        Row: {
          appelant_id: string
          appele_id: string
          created_at: string
          demarre_le: string | null
          duree_secondes: number | null
          id: string
          statut: string
          termine_le: string | null
          type: string
        }
        Insert: {
          appelant_id: string
          appele_id: string
          created_at?: string
          demarre_le?: string | null
          duree_secondes?: number | null
          id?: string
          statut?: string
          termine_le?: string | null
          type: string
        }
        Update: {
          appelant_id?: string
          appele_id?: string
          created_at?: string
          demarre_le?: string | null
          duree_secondes?: number | null
          id?: string
          statut?: string
          termine_le?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "appels_appelant_id_fkey"
            columns: ["appelant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appels_appele_id_fkey"
            columns: ["appele_id"]
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
      auth_rate_limits: {
        Row: {
          created_at: string
          id: string
          identifiant: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifiant: string
        }
        Update: {
          created_at?: string
          id?: string
          identifiant?: string
        }
        Relationships: []
      }
      codes_invitation: {
        Row: {
          actif: boolean
          code_hash: string
          created_at: string
          created_by: string | null
          expire_le: string
          id: string
          libelle: string
          role_attribue: Database["public"]["Enums"]["role_utilisateur"]
          statut_initial: Database["public"]["Enums"]["statut_compte"]
          usages: number
          usages_max: number
        }
        Insert: {
          actif?: boolean
          code_hash: string
          created_at?: string
          created_by?: string | null
          expire_le: string
          id?: string
          libelle: string
          role_attribue: Database["public"]["Enums"]["role_utilisateur"]
          statut_initial?: Database["public"]["Enums"]["statut_compte"]
          usages?: number
          usages_max?: number
        }
        Update: {
          actif?: boolean
          code_hash?: string
          created_at?: string
          created_by?: string | null
          expire_le?: string
          id?: string
          libelle?: string
          role_attribue?: Database["public"]["Enums"]["role_utilisateur"]
          statut_initial?: Database["public"]["Enums"]["statut_compte"]
          usages?: number
          usages_max?: number
        }
        Relationships: [
          {
            foreignKeyName: "codes_invitation_created_by_fkey"
            columns: ["created_by"]
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
          date_limite_reponse: string | null
          debut: string
          deleted_at: string | null
          description: string | null
          fin: string
          id: string
          lien_visio: string | null
          lieu: string | null
          organisateur_id: string | null
          reponse_attendue: boolean
          titre: string
          visibilite: Database["public"]["Enums"]["visibilite_evenement"]
          visio_fournisseur: string | null
        }
        Insert: {
          categorie: Database["public"]["Enums"]["categorie_evenement"]
          couleur?: string | null
          created_at?: string
          created_by: string
          date_limite_reponse?: string | null
          debut: string
          deleted_at?: string | null
          description?: string | null
          fin: string
          id?: string
          lien_visio?: string | null
          lieu?: string | null
          organisateur_id?: string | null
          reponse_attendue?: boolean
          titre: string
          visibilite?: Database["public"]["Enums"]["visibilite_evenement"]
          visio_fournisseur?: string | null
        }
        Update: {
          categorie?: Database["public"]["Enums"]["categorie_evenement"]
          couleur?: string | null
          created_at?: string
          created_by?: string
          date_limite_reponse?: string | null
          debut?: string
          deleted_at?: string | null
          description?: string | null
          fin?: string
          id?: string
          lien_visio?: string | null
          lieu?: string | null
          organisateur_id?: string | null
          reponse_attendue?: boolean
          titre?: string
          visibilite?: Database["public"]["Enums"]["visibilite_evenement"]
          visio_fournisseur?: string | null
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
      participations: {
        Row: {
          commentaire: string | null
          event_id: string
          id: string
          repondu_le: string
          reponse: string
          user_id: string
        }
        Insert: {
          commentaire?: string | null
          event_id: string
          id?: string
          repondu_le?: string
          reponse: string
          user_id: string
        }
        Update: {
          commentaire?: string | null
          event_id?: string
          id?: string
          repondu_le?: string
          reponse?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          appels_desactives: boolean
          bio: string | null
          commune: string | null
          consentement_traitement_le: string | null
          created_at: string
          deleted_at: string | null
          fonction_rn: string | null
          id: string
          last_seen_at: string | null
          ne_pas_deranger: boolean
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
          appels_desactives?: boolean
          bio?: string | null
          commune?: string | null
          consentement_traitement_le?: string | null
          created_at?: string
          deleted_at?: string | null
          fonction_rn?: string | null
          id: string
          last_seen_at?: string | null
          ne_pas_deranger?: boolean
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
          appels_desactives?: boolean
          bio?: string | null
          commune?: string | null
          consentement_traitement_le?: string | null
          created_at?: string
          deleted_at?: string | null
          fonction_rn?: string | null
          id?: string
          last_seen_at?: string | null
          ne_pas_deranger?: boolean
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
      signup_attempts: {
        Row: {
          created_at: string
          id: string
          ip: string
          succes: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          ip: string
          succes: boolean
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
          succes?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_creer_code: {
        Args: {
          p_code_hash: string
          p_expire_le: string
          p_libelle: string
          p_role_attribue: Database["public"]["Enums"]["role_utilisateur"]
          p_statut_initial: Database["public"]["Enums"]["statut_compte"]
          p_usages_max: number
        }
        Returns: {
          created_at: string
          expire_le: string
          id: string
          libelle: string
          role_attribue: Database["public"]["Enums"]["role_utilisateur"]
          statut_initial: Database["public"]["Enums"]["statut_compte"]
          usages_max: number
        }[]
      }
      admin_liste_codes: {
        Args: never
        Returns: {
          actif: boolean
          created_at: string
          expire_le: string
          id: string
          libelle: string
          role_attribue: Database["public"]["Enums"]["role_utilisateur"]
          statut_initial: Database["public"]["Enums"]["statut_compte"]
          usages: number
          usages_max: number
        }[]
      }
      admin_revoquer_code: { Args: { p_id: string }; Returns: undefined }
      check_and_record_rate_limit: {
        Args: {
          p_fenetre_minutes?: number
          p_identifiant: string
          p_limite?: number
        }
        Returns: boolean
      }
      compteurs_participation: {
        Args: { p_event: string }
        Returns: {
          absent_count: number
          peut_etre_count: number
          present_count: number
          sans_reponse_count: number
        }[]
      }
      journaliser_tentative: {
        Args: { p_ip: string; p_succes: boolean }
        Returns: undefined
      }
      liberer_code: { Args: { p_id: string }; Returns: undefined }
      quota_creation_depasse: { Args: { p_ip: string }; Returns: boolean }
      reserver_code: {
        Args: { p_code_hash: string }
        Returns: {
          id: string
          role_attribue: Database["public"]["Enums"]["role_utilisateur"]
          statut_initial: Database["public"]["Enums"]["statut_compte"]
        }[]
      }
      stats_evenements_par_categorie: {
        Args: never
        Returns: {
          categorie: Database["public"]["Enums"]["categorie_evenement"]
          total: number
        }[]
      }
      stats_repartition_prochain_evenement: {
        Args: never
        Returns: {
          absent_count: number
          debut: string
          event_id: string
          peut_etre_count: number
          present_count: number
          sans_reponse_count: number
          titre: string
        }[]
      }
      stats_taux_participation_evenements: {
        Args: never
        Returns: {
          debut: string
          event_id: string
          taux_presence: number
          titre: string
        }[]
      }
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
      statut_compte: "actif" | "suspendu" | "archive" | "en_attente"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
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
      statut_compte: ["actif", "suspendu", "archive", "en_attente"],
      visibilite_evenement: ["tous", "bureau", "role"],
    },
  },
} as const
