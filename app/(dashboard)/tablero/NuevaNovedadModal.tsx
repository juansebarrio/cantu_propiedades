"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { crearNovedad } from "./actions";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NuevaNovedadModal({ open, onClose }: Props) {
  const router = useRouter();
  const [contenido, setContenido] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    setContenido("");
    setError(null);
    onClose();
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const r = await crearNovedad(contenido);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setContenido("");
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nueva novedad"
      subtitle="Mensaje visible para los 3 socios"
      maxWidth="md"
    >
      <div className="flex flex-col gap-3">
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value.slice(0, 280))}
          rows={4}
          placeholder="Ej: el dueño de Cabildo 2840 quiere subir el precio..."
          className="w-full rounded-sm border border-ink-200 bg-white px-3 py-2.5 font-sans text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-[3px] focus:ring-ink-900/8"
          autoFocus
        />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
            {contenido.length} / 280
          </span>
          {error && <span className="text-[11px] text-brick-700">{error}</span>}
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isPending || contenido.trim().length === 0}
          >
            {isPending && (
              <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
            )}
            Publicar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
