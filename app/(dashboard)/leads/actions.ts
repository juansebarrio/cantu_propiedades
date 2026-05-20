"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth/current-user";

type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function crearLead(formData: FormData): Promise<ActionResult> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "Sesión expirada" };

  const nombre = formData.get("nombre")?.toString().trim();
  const telefono = formData.get("telefono")?.toString().trim() || null;
  const email = formData.get("email")?.toString().trim() || null;
  const propiedad_id = formData.get("propiedad_id")?.toString() || null;
  const canal_origen = formData.get("canal_origen")?.toString();
  const referido_por_dueno_id =
    formData.get("referido_por_dueno_id")?.toString() || null;
  const responsable_id = formData.get("responsable_id")?.toString() || null;
  const proxima_accion = formData.get("proxima_accion")?.toString() || null;
  const fecha_proxima_accion =
    formData.get("fecha_proxima_accion")?.toString() || null;
  const notas_internas = formData.get("notas_internas")?.toString() || null;

  const fieldErrors: Record<string, string> = {};
  if (!nombre) fieldErrors.nombre = "El nombre es obligatorio";
  if (!canal_origen) fieldErrors.canal_origen = "Indicá por dónde llegó el lead";
  if (canal_origen === "referido_zulma" && !referido_por_dueno_id) {
    fieldErrors.referido_por_dueno_id = "Elegí qué dueño lo refirió";
  }
  if (!telefono && !email) {
    fieldErrors.telefono = "Cargá al menos teléfono o email";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      nombre: nombre!,
      telefono,
      email,
      propiedad_id,
      canal_origen: canal_origen!,
      referido_por_dueno_id,
      responsable_id,
      proxima_accion,
      fecha_proxima_accion: fecha_proxima_accion || null,
      notas_internas,
      creado_por_id: usuario.id,
      estado: "nuevo",
    } as any)
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

export async function agregarConsultaALead(
  formData: FormData,
): Promise<ActionResult> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "Sesión expirada" };

  const lead_id = formData.get("lead_id")?.toString();
  const propiedad_id = formData.get("propiedad_id")?.toString();
  const canal_origen = formData.get("canal_origen")?.toString();
  const notas = formData.get("notas")?.toString() || null;

  const fieldErrors: Record<string, string> = {};
  if (!lead_id) fieldErrors.lead_id = "Lead no encontrado";
  if (!propiedad_id)
    fieldErrors.propiedad_id = "Elegí la propiedad de la consulta";
  if (!canal_origen) fieldErrors.canal_origen = "Elegí el canal";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase.from("consultas_lead").insert({
    lead_id: lead_id!,
    propiedad_id: propiedad_id!,
    canal_origen: canal_origen! as any,
    notas,
    creado_por_id: usuario.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${lead_id}`);
  redirect(`/leads/${lead_id}`);
}

export async function actualizarLead(
  leadId: string,
  formData: FormData,
): Promise<ActionResult> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "Sesión expirada" };

  const estado = formData.get("estado")?.toString();
  const responsable_id = formData.get("responsable_id")?.toString() || null;
  const proxima_accion = formData.get("proxima_accion")?.toString() || null;
  const fecha_proxima_accion =
    formData.get("fecha_proxima_accion")?.toString() || null;
  const notas_internas = formData.get("notas_internas")?.toString() || null;

  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      estado: estado as any,
      responsable_id,
      proxima_accion,
      fecha_proxima_accion: fecha_proxima_accion || null,
      notas_internas,
    })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}`);
}

export async function chequearDuplicado(telefono: string) {
  const { verificarTelefonoDuplicado } = await import(
    "@/lib/supabase/queries/leads"
  );
  return await verificarTelefonoDuplicado(telefono);
}
