"use client";

import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  AppBar,
  Toolbar,
  Chip,
} from "@mui/material";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import EmergencyIcon from "@mui/icons-material/EmergencyOutlined";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeartOutlined";
import HeightIcon from "@mui/icons-material/Height";
import MedicationIcon from "@mui/icons-material/MedicationOutlined";
import PlaceIcon from "@mui/icons-material/PlaceOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTimeOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneIcon from "@mui/icons-material/Phone";

const WHATSAPP_NUMBER = "59174808111"; // +591 74808111
const PHONE_DISPLAY = "+591 74808111";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola BioFarm, quisiera hacer una consulta."
)}`;

const services = [
  {
    title: "Medicamentos y productos de salud",
    description:
      "Amplio surtido de medicamentos, suplementos y artículos de cuidado personal, siempre con asesoría profesional.",
    icon: <MedicationIcon fontSize="large" />,
  },
  {
    title: "Entrega a domicilio",
    description:
      "Pide tus medicamentos y los llevamos hasta la puerta de tu casa en la Zona Sur y alrededores.",
    icon: <DeliveryDiningIcon fontSize="large" />,
  },
  {
    title: "Atención de emergencias",
    description:
      "Fuera de horario, llámanos o escríbenos por WhatsApp y te atendemos para casos urgentes.",
    icon: <EmergencyIcon fontSize="large" />,
  },
  {
    title: "Control de presión arterial",
    description:
      "Medición de presión arterial en el momento, sin costo adicional, con orientación de nuestro personal.",
    icon: <MonitorHeartIcon fontSize="large" />,
  },
  {
    title: "Medición de talla y peso",
    description:
      "Control de talla y peso para el seguimiento de tu salud y la de tu familia.",
    icon: <HeightIcon fontSize="large" />,
  },
];

export default function Home() {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* NAVBAR */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          color: "text.primary",
          borderBottom: "1px solid rgba(14, 124, 102, 0.1)",
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}>
            <LocalPharmacyIcon sx={{ color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.dark" }}>
              BioFarm
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<WhatsAppIcon />}
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener"
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              WhatsApp
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* HERO */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #0A5C4C 0%, #0E7C66 55%, #3F9C8A 100%)",
          color: "white",
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              gap: 6,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Chip
                label="Zona Sur · Cochabamba"
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontWeight: 600,
                  mb: 2,
                }}
              />
              <Typography
                variant="h1"
                sx={{ fontSize: { xs: "2.25rem", sm: "3rem", md: "3.5rem" }, mb: 2 }}
              >
                Tu farmacia de confianza
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 400,
                  opacity: 0.92,
                  mb: 4,
                  fontSize: { xs: "1.1rem", sm: "1.35rem" },
                }}
              >
                Medicamentos, entrega a domicilio y atención de emergencias
                para ti y tu familia, todos los días de 8:00 a 21:00.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  color="secondary"
                  startIcon={<WhatsAppIcon />}
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener"
                  sx={{ fontSize: "1rem", py: 1.3 }}
                >
                  Escríbenos por WhatsApp
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PhoneIcon />}
                  href={`tel:+${WHATSAPP_NUMBER}`}
                  sx={{
                    fontSize: "1rem",
                    py: 1.3,
                    color: "white",
                    borderColor: "rgba(255,255,255,0.6)",
                    "&:hover": {
                      borderColor: "white",
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  Llamar ahora
                </Button>
              </Stack>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: { xs: 180, md: 240 },
                  height: { xs: 180, md: 240 },
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocalPharmacyIcon sx={{ fontSize: { xs: 90, md: 120 } }} />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* SERVICIOS */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700 }}>
            Nuestros servicios
          </Typography>
          <Typography variant="h2" sx={{ mt: 1 }}>
            Cuidamos tu salud de forma integral
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {services.map((service) => (
            <Card
              key={service.title}
              elevation={0}
              sx={{
                p: 1,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: (theme) => theme.shadows[4],
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    bgcolor: "rgba(14, 124, 102, 0.1)",
                    color: "primary.main",
                    mb: 2,
                  }}
                >
                  {service.icon}
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {service.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {service.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* UBICACIÓN Y HORARIOS */}
      <Box sx={{ bgcolor: "#EAF3F0", py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 4,
            }}
          >
            <Card elevation={0} sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <PlaceIcon sx={{ color: "primary.main", fontSize: 32 }} />
                <Typography variant="h5">Dónde encontrarnos</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                Zona Sur, Cochabamba
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Al frente del Centro de Salud Gloria. Fácil de identificar y
                de acceder para toda la comunidad de la Zona Sur.
              </Typography>
            </Card>
            <Card elevation={0} sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <AccessTimeIcon sx={{ color: "primary.main", fontSize: 32 }} />
                <Typography variant="h5">Horario de atención</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                Todos los días, de 8:00 a 21:00
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Fuera de este horario, atendemos emergencias llamando o
                escribiendo directamente al {PHONE_DISPLAY}.
              </Typography>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* CONTACTO */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "white",
            borderRadius: 4,
            p: { xs: 4, md: 6 },
            textAlign: "center",
          }}
        >
          <Typography variant="h3" sx={{ mb: 2 }}>
            ¿Necesitas ayuda ahora?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.92, maxWidth: 560, mx: "auto" }}>
            Escríbenos por WhatsApp o llámanos al {PHONE_DISPLAY}. Nuestro
            equipo está listo para asesorarte y cuidar de tu bienestar.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              color="secondary"
              startIcon={<WhatsAppIcon />}
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener"
            >
              Escribir por WhatsApp
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PhoneIcon />}
              href={`tel:+${WHATSAPP_NUMBER}`}
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.6)",
                "&:hover": {
                  borderColor: "white",
                  bgcolor: "rgba(255,255,255,0.08)",
                },
              }}
            >
              {PHONE_DISPLAY}
            </Button>
          </Stack>
        </Box>
      </Container>

      {/* FOOTER */}
      <Box sx={{ borderTop: "1px solid rgba(14, 124, 102, 0.1)", py: 4 }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocalPharmacyIcon sx={{ color: "primary.main" }} fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                BioFarm
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} BioFarm · Zona Sur, Cochabamba, Bolivia
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
