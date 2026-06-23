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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
