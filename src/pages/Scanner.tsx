import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, CheckCircle2, XCircle, MessageCircle } from "lucide-react";

type ScanResult = {
  type: "entry" | "exit" | "error";
  message: string;
  alumnoName?: string;
  telefono?: string | null;
};

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerInstanceRef = useRef<any>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  const processQR = useCallback(async (qrData: string) => {
    if (processing) return;
    setProcessing(true);

    try {
      const { data: alumno, error: aErr } = await supabase
        .from("alumnos")
        .select("*")
        .eq("id", qrData)
        .maybeSingle();

      if (aErr || !alumno) {
        setResult({ type: "error", message: "Alumno no encontrado" });
        setProcessing(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const { data: registro } = await supabase
        .from("registros")
        .select("*")
        .eq("alumno_id", alumno.id)
        .eq("fecha", today)
        .maybeSingle();

      if (!registro) {
        const { error } = await supabase.from("registros").insert({
          alumno_id: alumno.id,
          fecha: today,
          hora_entrada: new Date().toISOString(),
        });
        if (error) throw error;
        setResult({
          type: "entry",
          message: `Entrada registrada a las ${new Date().toLocaleTimeString()}`,
          alumnoName: alumno.nombre,
          telefono: alumno.telefono_padre,
        });
      } else if (!registro.hora_salida) {
        const { error } = await supabase
          .from("registros")
          .update({ hora_salida: new Date().toISOString() })
          .eq("id", registro.id);
        if (error) throw error;
        setResult({
          type: "exit",
          message: `Salida registrada a las ${new Date().toLocaleTimeString()}`,
          alumnoName: alumno.nombre,
          telefono: alumno.telefono_padre,
        });
      } else {
        setResult({
          type: "error",
          message: "El alumno ya registró entrada y salida hoy",
          alumnoName: alumno.nombre,
        });
      }
    } catch (e: any) {
      setResult({ type: "error", message: e.message || "Error al procesar" });
    }

    setProcessing(false);
  }, [processing]);

  const stopScanner = useCallback(async () => {
    if (scannerInstanceRef.current) {
      try {
        const state = scannerInstanceRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerInstanceRef.current.stop();
        }
      } catch {}
      scannerInstanceRef.current.clear();
      scannerInstanceRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    // Clean up any previous instance
    await stopScanner();

    // Create a fresh div for the scanner to avoid React DOM conflicts
    if (scannerDivRef.current) {
      scannerDivRef.current.innerHTML = "";
      const readerDiv = document.createElement("div");
      readerDiv.id = "qr-reader-element";
      scannerDivRef.current.appendChild(readerDiv);
    }

    setResult(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader-element");
      scannerInstanceRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try {
            await scanner.stop();
          } catch {}
          scanner.clear();
          scannerInstanceRef.current = null;
          setScanning(false);
          processQR(decodedText);
        },
        () => {}
      );
    } catch {
      setScanning(false);
      setResult({ type: "error", message: "No se pudo acceder a la cámara. Verifica los permisos." });
    }
  }, [processQR, stopScanner]);

  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.stop();
        } catch {}
        try {
          scannerInstanceRef.current.clear();
        } catch {}
        scannerInstanceRef.current = null;
      }
    };
  }, []);

  const simulateWhatsApp = (telefono: string, nombre: string, tipo: string) => {
    const msg = encodeURIComponent(
      `Hola, le informamos que ${nombre} ha registrado su ${tipo} en el colegio a las ${new Date().toLocaleTimeString()}.`
    );
    window.open(`https://wa.me/${telefono.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ScanLine className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Escáner de Asistencia</h3>
          <p className="text-sm text-muted-foreground">Escanea el QR del alumno</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* This div is outside React's reconciliation — html5-qrcode owns it */}
          <div
            ref={scannerDivRef}
            className="w-full aspect-square rounded-xl overflow-hidden bg-muted flex items-center justify-center"
          >
            {!scanning && !result && (
              <span className="text-muted-foreground text-sm">La cámara aparecerá aquí</span>
            )}
          </div>

          {!scanning && (
            <Button className="w-full gap-2" size="lg" onClick={startScanner}>
              <ScanLine className="w-5 h-5" />
              {result ? "Escanear Otro" : "Iniciar Escáner"}
            </Button>
          )}

          {scanning && (
            <Button variant="outline" className="w-full" onClick={stopScanner}>
              Detener Escáner
            </Button>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className={
          result.type === "error"
            ? "border-destructive/50 bg-destructive/5"
            : "border-success/50 bg-success/5"
        }>
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            {result.type === "error" ? (
              <XCircle className="w-16 h-16 text-destructive" />
            ) : (
              <CheckCircle2 className="w-16 h-16 text-success animate-bounce" />
            )}
            {result.alumnoName && (
              <p className="font-semibold text-lg text-foreground">{result.alumnoName}</p>
            )}
            <p className={result.type === "error" ? "text-destructive" : "text-success"}>
              {result.message}
            </p>
            {result.telefono && result.type !== "error" && (
              <Button
                variant="outline"
                className="gap-2 mt-2"
                onClick={() =>
                  simulateWhatsApp(
                    result.telefono!,
                    result.alumnoName!,
                    result.type === "entry" ? "entrada" : "salida"
                  )
                }
              >
                <MessageCircle className="w-4 h-4" />
                Notificar por WhatsApp
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
