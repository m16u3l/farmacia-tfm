"use client";
import { formatDate } from "@/utils/dateUtils";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  ChipProps,
  CircularProgress,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import BuildIcon from "@mui/icons-material/Build";
import { AreaCoverage, AreaCoverageStatus, InventoryArea, ValidationCoverage } from "@/types";
import { useValidations } from "@/hooks/useValidations";
import { buildAreaOptions } from "@/utils/areaTree";

const COVERAGE_STATUS_LABELS: Record<AreaCoverageStatus, { label: string; color: ChipProps["color"] }> = {
  validated: { label: "Validada", color: "success" },
  due_soon: { label: "Por vencer", color: "warning" },
  overdue: { label: "Vencida", color: "error" },
  never: { label: "Nunca validada", color: "error" },
  no_stock: { label: "Sin stock", color: "default" },
};

// Orden de urgencia para "Validar siguiente" y para el listado: primero las
// nunca validadas, luego las vencidas (más antigua primero), luego las por
// vencer (menos días restantes primero); las vigentes y sin stock al final.
function urgencyKey(area: AreaCoverage): number {
  switch (area.status) {
    case "never":
      return 0;
    case "overdue":
      return 1 + (area.days_remaining ?? 0) / 10000;
    case "due_soon":
      return 2 + (area.days_remaining ?? 0) / 10000;
    case "validated":
      return 3 + (area.days_remaining ?? 0) / 10000;
    default:
      return 4;
  }
}

interface CoverageTabProps {
  areas: InventoryArea[];
  verificationMode: boolean;
  onStartValidation: (areaId: number) => void;
}

export function CoverageTab({ areas, verificationMode, onStartValidation }: CoverageTabProps) {
  const { getCoverage, error } = useValidations();
  const [coverage, setCoverage] = useState<ValidationCoverage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setCoverage(await getCoverage());
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Etiquetas breadcrumb ("Padre › Hijo") para mostrar cada área con su ruta.
  const areaLabels = useMemo(() => {
    const labels = new Map<number, string>();
    for (const { area, label } of buildAreaOptions(areas)) {
      labels.set(area.area_id, label);
    }
    return labels;
  }, [areas]);

  const sortedAreas = useMemo(
    () => (coverage ? [...coverage.areas].sort((a, b) => urgencyKey(a) - urgencyKey(b)) : []),
    [coverage]
  );

  const nextPending = sortedAreas.find(
    (a) => a.status === "never" || a.status === "overdue" || a.status === "due_soon"
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!coverage) {
    return <Alert severity="error">{error || "Error al cargar el estado de validación"}</Alert>;
  }

  return (
    <Box>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 1 }}>
            <Typography variant="h3" component="span">
              {coverage.coverage_percent}%
            </Typography>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {coverage.validated_areas} de {coverage.total_areas} áreas con stock validadas en los
                últimos {coverage.validation_period_days} días
              </Typography>
              <LinearProgress
                variant="determinate"
                value={coverage.coverage_percent}
                color={coverage.fully_validated ? "success" : coverage.coverage_percent >= 50 ? "warning" : "error"}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </Box>

          {coverage.fully_validated ? (
            <Chip
              icon={<VerifiedIcon />}
              label="Inventario 100% conciliado con la farmacia física"
              color="success"
              sx={{ fontWeight: "bold" }}
            />
          ) : (
            nextPending && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PlayArrowIcon />}
                disabled={verificationMode}
                onClick={() => onStartValidation(nextPending.area_id)}
              >
                Validar siguiente: {areaLabels.get(nextPending.area_id) || nextPending.name}
              </Button>
            )
          )}
          {verificationMode && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Hay una validación activa en la pestaña Validar; finalízala o cancélala para iniciar otra.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {sortedAreas.map((area) => {
          const statusInfo = COVERAGE_STATUS_LABELS[area.status];
          return (
            <Grid item xs={12} sm={6} md={4} key={area.area_id}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {areaLabels.get(area.area_id) || area.name}
                    </Typography>
                    <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {area.active_lots} lote(s) con stock
                  </Typography>

                  {area.last_validated_at ? (
                    <Typography variant="body2" color="text.secondary">
                      Última validación: {formatDate(area.last_validated_at)} (
                      {area.days_since_validated === 0
                        ? "hoy"
                        : `hace ${area.days_since_validated} día(s)`}
                      )
                      {area.validated_by_name ? ` — ${area.validated_by_name}` : ""}
                    </Typography>
                  ) : (
                    area.status !== "no_stock" && (
                      <Typography variant="body2" color="text.secondary">
                        Sin validaciones conciliadas registradas
                      </Typography>
                    )
                  )}

                  {(area.status === "validated" || area.status === "due_soon") && (
                    <Typography
                      variant="body2"
                      color={area.status === "due_soon" ? "warning.main" : "text.secondary"}
                    >
                      Vigente por {area.days_remaining} día(s) más
                    </Typography>
                  )}

                  {area.has_pending_adjustments && (
                    <Chip
                      icon={<BuildIcon />}
                      label="Ajustes sin aplicar"
                      color="warning"
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  )}

                  {area.status !== "no_stock" && (
                    <Box sx={{ mt: 1.5 }}>
                      <Button
                        size="small"
                        variant={area.status === "validated" ? "outlined" : "contained"}
                        startIcon={<VerifiedIcon />}
                        disabled={verificationMode}
                        onClick={() => onStartValidation(area.area_id)}
                      >
                        Validar
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
