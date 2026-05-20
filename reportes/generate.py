"""
Cantú Propiedades · Generador de reportes mensuales en PDF.
Por implementar en la fase de Automatizaciones (Fase 5).

Workflow previsto:
  1. Recibir IDs de propiedad y rango de fechas
  2. Consultar Supabase: visitas, leads, devoluciones, estado en portales
  3. Renderizar HTML con datos
  4. WeasyPrint → PDF
  5. Devolver bytes del PDF para que el caller lo envíe por Resend

Reutilizamos el patrón del sistema de propuestas JS80.
"""

# from weasyprint import HTML
# from pathlib import Path
# from datetime import date
# ...
