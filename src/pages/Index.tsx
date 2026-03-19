import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, UserCheck, UserX, Clock } from "lucide-react";

export default function Index() {
  const today = new Date().toISOString().split("T")[0];

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ["registros", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registros")
        .select("*, alumnos(nombre, alumno_id)")
        .eq("fecha", today)
        .order("hora_entrada", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Real-time polling
  });

  const { data: totalAlumnos = 0 } = useQuery({
    queryKey: ["alumnos-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("alumnos").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const presentes = registros.filter((r) => r.hora_entrada && !r.hora_salida).length;
  const salieron = registros.filter((r) => r.hora_salida).length;

  const stats = [
    { label: "Total Alumnos", value: totalAlumnos, icon: ClipboardList, color: "text-primary" },
    { label: "Presentes", value: presentes, icon: UserCheck, color: "text-success" },
    { label: "Salieron", value: salieron, icon: UserX, color: "text-accent" },
    { label: "Registros Hoy", value: registros.length, icon: Clock, color: "text-primary" },
  ];

  const formatTime = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's attendance table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Asistencia de Hoy — {new Date().toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</TableCell>
                </TableRow>
              ) : registros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay registros hoy</TableCell>
                </TableRow>
              ) : (
                registros.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.alumnos?.nombre}</TableCell>
                    <TableCell className="font-mono text-sm">{r.alumnos?.alumno_id}</TableCell>
                    <TableCell>{formatTime(r.hora_entrada)}</TableCell>
                    <TableCell>{formatTime(r.hora_salida)}</TableCell>
                    <TableCell>
                      {r.hora_salida ? (
                        <Badge variant="secondary">Salió</Badge>
                      ) : (
                        <Badge className="bg-success text-success-foreground">Presente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
