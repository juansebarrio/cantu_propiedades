export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      comunicaciones: {
        Row: {
          contenido: string
          dueno_id: string | null
          fecha: string
          id: string
          lead_id: string | null
          registrada_por_id: string | null
          tipo: Database["public"]["Enums"]["tipo_comunicacion"]
        }
        Insert: {
          contenido: string
          dueno_id?: string | null
          fecha?: string
          id?: string
          lead_id?: string | null
          registrada_por_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_comunicacion"]
        }
        Update: {
          contenido?: string
          dueno_id?: string | null
          fecha?: string
          id?: string
          lead_id?: string | null
          registrada_por_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_comunicacion"]
        }
        Relationships: [
          {
            foreignKeyName: "comunicaciones_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: false
            referencedRelation: "duenos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicaciones_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicaciones_registrada_por_id_fkey"
            columns: ["registrada_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      consultas_lead: {
        Row: {
          canal_origen: Database["public"]["Enums"]["canal_origen_lead"]
          creado_en: string
          creado_por_id: string | null
          fecha: string
          id: string
          lead_id: string
          notas: string | null
          propiedad_id: string
        }
        Insert: {
          canal_origen: Database["public"]["Enums"]["canal_origen_lead"]
          creado_en?: string
          creado_por_id?: string | null
          fecha?: string
          id?: string
          lead_id: string
          notas?: string | null
          propiedad_id: string
        }
        Update: {
          canal_origen?: Database["public"]["Enums"]["canal_origen_lead"]
          creado_en?: string
          creado_por_id?: string | null
          fecha?: string
          id?: string
          lead_id?: string
          notas?: string | null
          propiedad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_lead_creado_por_id_fkey"
            columns: ["creado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_lead_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_lead_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
        ]
      }
      duenos: {
        Row: {
          actualizado_en: string
          acuerdo_especial: string | null
          canal_preferido: Database["public"]["Enums"]["canal_contacto_dueno"]
          confidencial: boolean
          creado_en: string
          creado_por_id: string | null
          email: string | null
          en_grupo_whatsapp: boolean
          frecuencia_reporte: Database["public"]["Enums"]["frecuencia_reporte"]
          id: string
          nombre: string
          notas_internas: string | null
          telefono: string | null
        }
        Insert: {
          actualizado_en?: string
          acuerdo_especial?: string | null
          canal_preferido?: Database["public"]["Enums"]["canal_contacto_dueno"]
          confidencial?: boolean
          creado_en?: string
          creado_por_id?: string | null
          email?: string | null
          en_grupo_whatsapp?: boolean
          frecuencia_reporte?: Database["public"]["Enums"]["frecuencia_reporte"]
          id?: string
          nombre: string
          notas_internas?: string | null
          telefono?: string | null
        }
        Update: {
          actualizado_en?: string
          acuerdo_especial?: string | null
          canal_preferido?: Database["public"]["Enums"]["canal_contacto_dueno"]
          confidencial?: boolean
          creado_en?: string
          creado_por_id?: string | null
          email?: string | null
          en_grupo_whatsapp?: boolean
          frecuencia_reporte?: Database["public"]["Enums"]["frecuencia_reporte"]
          id?: string
          nombre?: string
          notas_internas?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duenos_creado_por_id_fkey"
            columns: ["creado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          actualizado_en: string
          canal_origen: Database["public"]["Enums"]["canal_origen_lead"]
          creado_en: string
          creado_por_id: string | null
          criterio_busqueda: Json | null
          email: string | null
          estado: Database["public"]["Enums"]["estado_lead"]
          fecha_proxima_accion: string | null
          id: string
          nombre: string
          notas_internas: string | null
          propiedad_id: string | null
          proxima_accion: string | null
          referido_por_dueno_id: string | null
          responsable_id: string | null
          telefono: string | null
        }
        Insert: {
          actualizado_en?: string
          canal_origen: Database["public"]["Enums"]["canal_origen_lead"]
          creado_en?: string
          creado_por_id?: string | null
          criterio_busqueda?: Json | null
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_lead"]
          fecha_proxima_accion?: string | null
          id?: string
          nombre: string
          notas_internas?: string | null
          propiedad_id?: string | null
          proxima_accion?: string | null
          referido_por_dueno_id?: string | null
          responsable_id?: string | null
          telefono?: string | null
        }
        Update: {
          actualizado_en?: string
          canal_origen?: Database["public"]["Enums"]["canal_origen_lead"]
          creado_en?: string
          creado_por_id?: string | null
          criterio_busqueda?: Json | null
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_lead"]
          fecha_proxima_accion?: string | null
          id?: string
          nombre?: string
          notas_internas?: string | null
          propiedad_id?: string | null
          proxima_accion?: string | null
          referido_por_dueno_id?: string | null
          responsable_id?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_creado_por_id_fkey"
            columns: ["creado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_referido_por_dueno_id_fkey"
            columns: ["referido_por_dueno_id"]
            isOneToOne: false
            referencedRelation: "duenos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      portales_propiedad: {
        Row: {
          actualizado_en: string
          estado_en_portal: Database["public"]["Enums"]["estado_en_portal"]
          fecha_publicacion: string | null
          id: string
          notas: string | null
          portal: Database["public"]["Enums"]["portal"]
          propiedad_id: string
          url_publicacion: string | null
        }
        Insert: {
          actualizado_en?: string
          estado_en_portal?: Database["public"]["Enums"]["estado_en_portal"]
          fecha_publicacion?: string | null
          id?: string
          notas?: string | null
          portal: Database["public"]["Enums"]["portal"]
          propiedad_id: string
          url_publicacion?: string | null
        }
        Update: {
          actualizado_en?: string
          estado_en_portal?: Database["public"]["Enums"]["estado_en_portal"]
          fecha_publicacion?: string | null
          id?: string
          notas?: string | null
          portal?: Database["public"]["Enums"]["portal"]
          propiedad_id?: string
          url_publicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portales_propiedad_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
        ]
      }
      propiedades: {
        Row: {
          actualizado_en: string
          confidencial: boolean
          creado_en: string
          creado_por_id: string | null
          descripcion_comercial: string | null
          direccion: string
          dueno_id: string
          estado: Database["public"]["Enums"]["estado_propiedad"]
          fecha_captacion: string
          fotos: Json
          id: string
          moneda: Database["public"]["Enums"]["moneda"]
          notas_internas: string | null
          operacion: Database["public"]["Enums"]["operacion"]
          precio_actual: number | null
          tipo: Database["public"]["Enums"]["tipo_propiedad"]
        }
        Insert: {
          actualizado_en?: string
          confidencial?: boolean
          creado_en?: string
          creado_por_id?: string | null
          descripcion_comercial?: string | null
          direccion: string
          dueno_id: string
          estado?: Database["public"]["Enums"]["estado_propiedad"]
          fecha_captacion?: string
          fotos?: Json
          id?: string
          moneda?: Database["public"]["Enums"]["moneda"]
          notas_internas?: string | null
          operacion: Database["public"]["Enums"]["operacion"]
          precio_actual?: number | null
          tipo: Database["public"]["Enums"]["tipo_propiedad"]
        }
        Update: {
          actualizado_en?: string
          confidencial?: boolean
          creado_en?: string
          creado_por_id?: string | null
          descripcion_comercial?: string | null
          direccion?: string
          dueno_id?: string
          estado?: Database["public"]["Enums"]["estado_propiedad"]
          fecha_captacion?: string
          fotos?: Json
          id?: string
          moneda?: Database["public"]["Enums"]["moneda"]
          notas_internas?: string | null
          operacion?: Database["public"]["Enums"]["operacion"]
          precio_actual?: number | null
          tipo?: Database["public"]["Enums"]["tipo_propiedad"]
        }
        Relationships: [
          {
            foreignKeyName: "propiedades_creado_por_id_fkey"
            columns: ["creado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propiedades_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: false
            referencedRelation: "duenos"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes_mensuales: {
        Row: {
          actualizado_en: string
          canal_envio:
            | Database["public"]["Enums"]["canal_contacto_dueno"]
            | null
          creado_en: string
          dueno_id: string
          enviado_a: string | null
          enviado_en: string | null
          error_envio: string | null
          estado: Database["public"]["Enums"]["estado_reporte"]
          id: string
          nota_personalizada: string | null
          pdf_url: string | null
          periodo: string
          propiedad_id: string
        }
        Insert: {
          actualizado_en?: string
          canal_envio?:
            | Database["public"]["Enums"]["canal_contacto_dueno"]
            | null
          creado_en?: string
          dueno_id: string
          enviado_a?: string | null
          enviado_en?: string | null
          error_envio?: string | null
          estado?: Database["public"]["Enums"]["estado_reporte"]
          id?: string
          nota_personalizada?: string | null
          pdf_url?: string | null
          periodo: string
          propiedad_id: string
        }
        Update: {
          actualizado_en?: string
          canal_envio?:
            | Database["public"]["Enums"]["canal_contacto_dueno"]
            | null
          creado_en?: string
          dueno_id?: string
          enviado_a?: string | null
          enviado_en?: string | null
          error_envio?: string | null
          estado?: Database["public"]["Enums"]["estado_reporte"]
          id?: string
          nota_personalizada?: string | null
          pdf_url?: string | null
          periodo?: string
          propiedad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_mensuales_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: false
            referencedRelation: "duenos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_mensuales_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean
          creado_en: string
          email: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          email: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          creado_en?: string
          email?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
        }
        Relationships: []
      }
      visitas: {
        Row: {
          actualizado_en: string
          confirmacion_enviada_en: string | null
          confirmacion_respondida_en: string | null
          creado_en: string
          devolucion_audio_url: string | null
          devolucion_cargada_por_id: string | null
          devolucion_prospecto: string | null
          estado: Database["public"]["Enums"]["estado_visita"]
          fecha_agendada: string
          id: string
          lead_id: string
          notas: string | null
          propiedad_id: string
          responsable_id: string | null
        }
        Insert: {
          actualizado_en?: string
          confirmacion_enviada_en?: string | null
          confirmacion_respondida_en?: string | null
          creado_en?: string
          devolucion_audio_url?: string | null
          devolucion_cargada_por_id?: string | null
          devolucion_prospecto?: string | null
          estado?: Database["public"]["Enums"]["estado_visita"]
          fecha_agendada: string
          id?: string
          lead_id: string
          notas?: string | null
          propiedad_id: string
          responsable_id?: string | null
        }
        Update: {
          actualizado_en?: string
          confirmacion_enviada_en?: string | null
          confirmacion_respondida_en?: string | null
          creado_en?: string
          devolucion_audio_url?: string | null
          devolucion_cargada_por_id?: string | null
          devolucion_prospecto?: string | null
          estado?: Database["public"]["Enums"]["estado_visita"]
          fecha_agendada?: string
          id?: string
          lead_id?: string
          notas?: string | null
          propiedad_id?: string
          responsable_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitas_devolucion_cargada_por_id_fkey"
            columns: ["devolucion_cargada_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_propiedad_id_fkey"
            columns: ["propiedad_id"]
            isOneToOne: false
            referencedRelation: "propiedades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_socia_titular: { Args: never; Returns: boolean }
      es_socio: { Args: never; Returns: boolean }
      es_usuario_activo: { Args: never; Returns: boolean }
      rol_actual: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
    }
    Enums: {
      canal_contacto_dueno: "mail" | "whatsapp_pdf" | "llamada" | "no_contactar"
      canal_origen_lead:
        | "whatsapp_oficina"
        | "whatsapp_zulma"
        | "whatsapp_martin"
        | "mail"
        | "formulario_web"
        | "zonaprop"
        | "argenprop"
        | "mercadolibre"
        | "soloduenos"
        | "fb_marketplace"
        | "referido_zulma"
        | "wsp_inmobiliarias_coghlan"
        | "otro"
      estado_en_portal: "publicada" | "pausada" | "vencida" | "no_publicada"
      estado_lead:
        | "nuevo"
        | "contactado"
        | "con_visita"
        | "con_oferta"
        | "sin_interes"
        | "cerrado_exitoso"
        | "archivado"
      estado_propiedad:
        | "captada"
        | "publicada"
        | "con_visitas"
        | "con_oferta"
        | "reservada"
        | "cerrada"
        | "pausada"
        | "archivada"
      estado_reporte:
        | "borrador"
        | "listo_para_enviar"
        | "enviado"
        | "no_enviar"
        | "fallido"
      estado_visita:
        | "agendada"
        | "confirmada"
        | "realizada"
        | "cancelada"
        | "no_asistio"
      frecuencia_reporte: "mensual" | "trimestral" | "on_demand" | "ninguna"
      moneda: "ars" | "usd"
      operacion: "alquiler" | "venta" | "temporada"
      portal:
        | "zonaprop"
        | "argenprop"
        | "mercadolibre"
        | "soloduenos"
        | "fb_marketplace"
        | "wsp_inmobiliarias_coghlan"
      rol_usuario: "socia_titular" | "socio_operativo" | "administrativa"
      tipo_comunicacion:
        | "whatsapp_entrante"
        | "whatsapp_saliente"
        | "mail_entrante"
        | "mail_saliente"
        | "llamada"
        | "nota_interna"
      tipo_propiedad:
        | "depto"
        | "casa"
        | "ph"
        | "local"
        | "oficina"
        | "cochera"
        | "terreno"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      canal_contacto_dueno: ["mail", "whatsapp_pdf", "llamada", "no_contactar"],
      canal_origen_lead: [
        "whatsapp_oficina",
        "whatsapp_zulma",
        "whatsapp_martin",
        "mail",
        "formulario_web",
        "zonaprop",
        "argenprop",
        "mercadolibre",
        "soloduenos",
        "fb_marketplace",
        "referido_zulma",
        "wsp_inmobiliarias_coghlan",
        "otro",
      ],
      estado_en_portal: ["publicada", "pausada", "vencida", "no_publicada"],
      estado_lead: [
        "nuevo",
        "contactado",
        "con_visita",
        "con_oferta",
        "sin_interes",
        "cerrado_exitoso",
        "archivado",
      ],
      estado_propiedad: [
        "captada",
        "publicada",
        "con_visitas",
        "con_oferta",
        "reservada",
        "cerrada",
        "pausada",
        "archivada",
      ],
      estado_reporte: [
        "borrador",
        "listo_para_enviar",
        "enviado",
        "no_enviar",
        "fallido",
      ],
      estado_visita: [
        "agendada",
        "confirmada",
        "realizada",
        "cancelada",
        "no_asistio",
      ],
      frecuencia_reporte: ["mensual", "trimestral", "on_demand", "ninguna"],
      moneda: ["ars", "usd"],
      operacion: ["alquiler", "venta", "temporada"],
      portal: [
        "zonaprop",
        "argenprop",
        "mercadolibre",
        "soloduenos",
        "fb_marketplace",
        "wsp_inmobiliarias_coghlan",
      ],
      rol_usuario: ["socia_titular", "socio_operativo", "administrativa"],
      tipo_comunicacion: [
        "whatsapp_entrante",
        "whatsapp_saliente",
        "mail_entrante",
        "mail_saliente",
        "llamada",
        "nota_interna",
      ],
      tipo_propiedad: [
        "depto",
        "casa",
        "ph",
        "local",
        "oficina",
        "cochera",
        "terreno",
      ],
    },
  },
} as const

