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
      account_metrics: {
        Row: {
          id: string
          platform: string
          reddit_karma: number | null
          snapshot_date: string
          x_followers: number | null
        }
        Insert: {
          id?: string
          platform: string
          reddit_karma?: number | null
          snapshot_date?: string
          x_followers?: number | null
        }
        Update: {
          id?: string
          platform?: string
          reddit_karma?: number | null
          snapshot_date?: string
          x_followers?: number | null
        }
        Relationships: []
      }
      communities: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          keywords: string[] | null
          name: string
          platform: string
          rules_notes: string | null
          scan_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          keywords?: string[] | null
          name: string
          platform: string
          rules_notes?: string | null
          scan_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          keywords?: string[] | null
          name?: string
          platform?: string
          rules_notes?: string | null
          scan_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      content_queue: {
        Row: {
          community_id: string
          content_type: string
          created_at: string
          draft_text: string
          id: string
          product_id: string | null
          reviewed_at: string | null
          status: string
          thread_id: string | null
        }
        Insert: {
          community_id: string
          content_type: string
          created_at?: string
          draft_text: string
          id?: string
          product_id?: string | null
          reviewed_at?: string | null
          status?: string
          thread_id?: string | null
        }
        Update: {
          community_id?: string
          content_type?: string
          created_at?: string
          draft_text?: string
          id?: string
          product_id?: string | null
          reviewed_at?: string | null
          status?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_queue_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_queue_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "discovered_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      discovered_threads: {
        Row: {
          author: string | null
          body_preview: string | null
          community_id: string
          discovered_at: string
          external_id: string
          id: string
          platform: string
          status: string
          title: string | null
          url: string | null
        }
        Insert: {
          author?: string | null
          body_preview?: string | null
          community_id: string
          discovered_at?: string
          external_id: string
          id?: string
          platform: string
          status?: string
          title?: string | null
          url?: string | null
        }
        Update: {
          author?: string | null
          body_preview?: string | null
          community_id?: string
          discovered_at?: string
          external_id?: string
          id?: string
          platform?: string
          status?: string
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovered_threads_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_snapshots: {
        Row: {
          comments: number | null
          id: string
          impressions: number | null
          likes: number | null
          published_content_id: string
          retweets: number | null
          snapshot_at: string
          upvotes: number | null
        }
        Insert: {
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          published_content_id: string
          retweets?: number | null
          snapshot_at?: string
          upvotes?: number | null
        }
        Update: {
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          published_content_id?: string
          retweets?: number | null
          snapshot_at?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_snapshots_published_content_id_fkey"
            columns: ["published_content_id"]
            isOneToOne: false
            referencedRelation: "published_content"
            referencedColumns: ["id"]
          },
        ]
      }
      product_communities: {
        Row: {
          community_id: string
          id: string
          product_id: string
          relevance_notes: string | null
        }
        Insert: {
          community_id: string
          id?: string
          product_id: string
          relevance_notes?: string | null
        }
        Update: {
          community_id?: string
          id?: string
          product_id?: string
          relevance_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_communities_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_communities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      published_content: {
        Row: {
          community_id: string
          content_type: string
          external_id: string | null
          id: string
          platform: string
          product_id: string | null
          published_at: string
          queue_item_id: string | null
          text: string
          url: string | null
        }
        Insert: {
          community_id: string
          content_type: string
          external_id?: string | null
          id?: string
          platform: string
          product_id?: string | null
          published_at?: string
          queue_item_id?: string | null
          text: string
          url?: string | null
        }
        Update: {
          community_id?: string
          content_type?: string
          external_id?: string | null
          id?: string
          platform?: string
          product_id?: string | null
          published_at?: string
          queue_item_id?: string | null
          text?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "published_content_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_content_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "published_content_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "content_queue"
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
      [_ in never]: never
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
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
