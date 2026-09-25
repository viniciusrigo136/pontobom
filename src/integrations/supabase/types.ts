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
      bot_nonces: {
        Row: {
          created_at: string
          nonce: string
        }
        Insert: {
          created_at?: string
          nonce: string
        }
        Update: {
          created_at?: string
          nonce?: string
        }
        Relationships: []
      }
      bot_rate_limit: {
        Row: {
          chave: string
          contador: number
          janela: string
        }
        Insert: {
          chave: string
          contador?: number
          janela: string
        }
        Update: {
          chave?: string
          contador?: number
          janela?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      contas_receber: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_vencimento: string | null
          descricao: string | null
          id: string
          origem_id: string | null
          origem_numero: number | null
          origem_tipo: string
          parcela_numero: number | null
          parcela_total: number | null
          status: string
          valor_pago: number
          valor_restante: number
          valor_total: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          origem_id?: string | null
          origem_numero?: number | null
          origem_tipo?: string
          parcela_numero?: number | null
          parcela_total?: number | null
          status?: string
          valor_pago?: number
          valor_restante?: number
          valor_total?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          id?: string
          origem_id?: string | null
          origem_numero?: number | null
          origem_tipo?: string
          parcela_numero?: number | null
          parcela_total?: number | null
          status?: string
          valor_pago?: number
          valor_restante?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa: {
        Row: {
          app_logo_url: string | null
          app_subtitulo: string | null
          app_titulo: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string | null
          pix_chave: string | null
          pix_tipo: string | null
          responsavel: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          app_logo_url?: string | null
          app_subtitulo?: string | null
          app_titulo?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string | null
          pix_chave?: string | null
          pix_tipo?: string | null
          responsavel?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          app_logo_url?: string | null
          app_subtitulo?: string | null
          app_titulo?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string | null
          pix_chave?: string | null
          pix_tipo?: string | null
          responsavel?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      estoque: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco_custo: number
          preco_venda: number
          quantidade: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco_custo?: number
          preco_venda?: number
          quantidade?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco_custo?: number
          preco_venda?: number
          quantidade?: number
        }
        Relationships: []
      }
      garantia_regras: {
        Row: {
          aprovado_bot: boolean
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          prazo_dias: number | null
          tipo_servico: string
          updated_at: string
        }
        Insert: {
          aprovado_bot?: boolean
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          prazo_dias?: number | null
          tipo_servico: string
          updated_at?: string
        }
        Update: {
          aprovado_bot?: boolean
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          prazo_dias?: number | null
          tipo_servico?: string
          updated_at?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          cliente_id: string | null
          created_at: string
          descricao_problema: string | null
          id: string
          itens: Json
          modelo_aparelho: string | null
          numero: number
          observacoes: string | null
          status: string
          validade: string | null
          valor_total: number
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          descricao_problema?: string | null
          id?: string
          itens?: Json
          modelo_aparelho?: string | null
          numero?: number
          observacoes?: string | null
          status?: string
          validade?: string | null
          valor_total?: number
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          descricao_problema?: string | null
          id?: string
          itens?: Json
          modelo_aparelho?: string | null
          numero?: number
          observacoes?: string | null
          status?: string
          validade?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          assinatura_cliente_imagem: string | null
          assinatura_cliente_nome: string | null
          checklist: Json
          cliente_id: string | null
          created_at: string
          data_entrada: string
          data_saida_prevista: string | null
          fotos: Json
          garantia_texto: string | null
          id: string
          itens: Json
          modelo_aparelho: string | null
          numero: number
          orcamento_origem_id: string | null
          orcamento_origem_numero: number | null
          problema_relatado: string | null
          senha_tipo: string | null
          senha_valor: string | null
          status: string
          tecnico: string | null
          tipo_dispositivo: string
          valor_total: number
        }
        Insert: {
          assinatura_cliente_imagem?: string | null
          assinatura_cliente_nome?: string | null
          checklist?: Json
          cliente_id?: string | null
          created_at?: string
          data_entrada?: string
          data_saida_prevista?: string | null
          fotos?: Json
          garantia_texto?: string | null
          id?: string
          itens?: Json
          modelo_aparelho?: string | null
          numero?: number
          orcamento_origem_id?: string | null
          orcamento_origem_numero?: number | null
          problema_relatado?: string | null
          senha_tipo?: string | null
          senha_valor?: string | null
          status?: string
          tecnico?: string | null
          tipo_dispositivo?: string
          valor_total?: number
        }
        Update: {
          assinatura_cliente_imagem?: string | null
          assinatura_cliente_nome?: string | null
          checklist?: Json
          cliente_id?: string | null
          created_at?: string
          data_entrada?: string
          data_saida_prevista?: string | null
          fotos?: Json
          garantia_texto?: string | null
          id?: string
          itens?: Json
          modelo_aparelho?: string | null
          numero?: number
          orcamento_origem_id?: string | null
          orcamento_origem_numero?: number | null
          problema_relatado?: string | null
          senha_tipo?: string | null
          senha_valor?: string | null
          status?: string
          tecnico?: string | null
          tipo_dispositivo?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_receber: {
        Row: {
          conta_id: string
          created_at: string
          data_pagamento: string
          id: string
          observacao: string | null
          valor: number
        }
        Insert: {
          conta_id: string
          created_at?: string
          data_pagamento?: string
          id?: string
          observacao?: string | null
          valor?: number
        }
        Update: {
          conta_id?: string
          created_at?: string
          data_pagamento?: string
          id?: string
          observacao?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_receber_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      print_jobs: {
        Row: {
          claimed_at: string | null
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          os_id: string
          printed_at: string | null
          printer_id: string
          status: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          os_id: string
          printed_at?: string | null
          printer_id?: string
          status?: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          os_id?: string
          printed_at?: string | null
          printer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          aparelho_produto: string | null
          cliente_id: string | null
          created_at: string
          data_venda: string
          garantia_meses: number
          id: string
          itens: Json
          numero: number
          valor_total: number
        }
        Insert: {
          aparelho_produto?: string | null
          cliente_id?: string | null
          created_at?: string
          data_venda?: string
          garantia_meses?: number
          id?: string
          itens?: Json
          numero?: number
          valor_total?: number
        }
        Update: {
          aparelho_produto?: string | null
          cliente_id?: string | null
          created_at?: string
          data_venda?: string
          garantia_meses?: number
          id?: string
          itens?: Json
          numero?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bot_buscar_estoque: {
        Args: { _termo: string }
        Returns: {
          disponivel: boolean
          nome: string
          preco_venda: number
        }[]
      }
      bot_buscar_garantia: {
        Args: { _termo: string }
        Returns: {
          descricao: string
          prazo_dias: number
          tipo_servico: string
        }[]
      }
      bot_consume_nonce: { Args: { _nonce: string }; Returns: boolean }
      bot_norm: { Args: { _t: string }; Returns: string }
      bot_palavras: { Args: { _termo: string }; Returns: string[] }
      bot_rate_hit: {
        Args: { _chave: string; _limite: number }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "staff"
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
      app_role: ["owner", "staff"],
    },
  },
} as const
