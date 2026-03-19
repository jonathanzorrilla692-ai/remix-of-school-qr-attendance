import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Printer, QrCode } from "lucide-react";

export default function QRGenerator() {
  const [selectedId, setSelectedId] = useState<string>("");
  const qrRef = useRef<HTMLDivElement>(null);

  const { data: alumnos = [] } = useQuery({
    queryKey: ["alumnos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alumnos").select("*").order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const selected = alumnos.find((a) => a.id === selectedId);

  const handleDownload = () => {
    if (!qrRef.current || !selected) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement("a");
      a.download = `QR-${selected.alumno_id}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    if (!qrRef.current || !selected) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const svg = qrRef.current.querySelector("svg");
    printWindow.document.write(`
      <html><head><title>QR - ${selected.nombre}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;}
      h2{margin-bottom:8px} p{color:#666;margin-top:0}</style></head>
      <body><h2>${selected.nombre}</h2><p>ID: ${selected.alumno_id}</p>${svg?.outerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <QrCode className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Generador de Códigos QR</h3>
          <p className="text-sm text-muted-foreground">Selecciona un alumno para generar su QR</p>
        </div>
      </div>

      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar alumno..." />
        </SelectTrigger>
        <SelectContent>
          {alumnos.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.nombre} ({a.alumno_id})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center py-10 space-y-6">
            <div ref={qrRef} className="p-6 bg-card rounded-2xl border border-border">
              <QRCodeSVG value={selected.id} size={220} level="H" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg text-foreground">{selected.nombre}</p>
              <p className="text-sm text-muted-foreground font-mono">{selected.alumno_id}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" /> Descargar
              </Button>
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" /> Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
