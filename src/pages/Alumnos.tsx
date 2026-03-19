import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Users } from "lucide-react";

export default function Alumnos() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [alumnoId, setAlumnoId] = useState("");
  const [telefono, setTelefono] = useState("");

  const { data: alumnos = [], isLoading } = useQuery({
    queryKey: ["alumnos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alumnos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("alumnos").insert({
        nombre: nombre.trim(),
        alumno_id: alumnoId.trim(),
        telefono_padre: telefono.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumnos"] });
      setOpen(false);
      setNombre("");
      setAlumnoId("");
      setTelefono("");
      toast({ title: "Alumno registrado", description: "El alumno fue agregado exitosamente." });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alumnos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumnos"] });
      toast({ title: "Alumno eliminado" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Gestión de Alumnos</h3>
            <p className="text-sm text-muted-foreground">{alumnos.length} alumnos registrados</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Nuevo Alumno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Nombre Completo</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" />
              </div>
              <div>
                <Label>ID Único del Alumno</Label>
                <Input value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)} placeholder="ALU-001" />
              </div>
              <div>
                <Label>Teléfono del Padre/Tutor</Label>
                <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+52 555 123 4567" />
              </div>
              <Button
                className="w-full"
                onClick={() => addMutation.mutate()}
                disabled={!nombre.trim() || !alumnoId.trim() || addMutation.isPending}
              >
                {addMutation.isPending ? "Registrando..." : "Registrar Alumno"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Teléfono Padre</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Cargando...</TableCell>
                </TableRow>
              ) : alumnos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay alumnos registrados</TableCell>
                </TableRow>
              ) : (
                alumnos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nombre}</TableCell>
                    <TableCell className="font-mono text-sm">{a.alumno_id}</TableCell>
                    <TableCell>{a.telefono_padre || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
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
