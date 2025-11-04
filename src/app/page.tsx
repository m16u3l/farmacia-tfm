"use client";

import {
  Container,
  Typography,
  Paper,
  Box,
  
  Card,
  CardContent,
  Button,
} from "@mui/material";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

const features = [
  {
    title: "Medicamentos de Calidad",
    description:
      "Ofrecemos una amplia variedad de medicamentos certificados y productos de salud.",
    icon: <LocalPharmacyIcon fontSize="large" color="primary" />,
  },
  {
    title: "Atención Personalizada",
    description:
      "Nuestro equipo está listo para asesorarte y cuidar de tu bienestar.",
    icon: <FavoriteIcon fontSize="large" color="primary" />,
  },
  {
    title: "Envíos Rápidos",
    description: "Recibe tus productos en casa de forma segura y eficiente.",
    icon: <LocalShippingIcon fontSize="large" color="primary" />,
  },
];

export default function Home() {
  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          p: { xs: 2, sm: 3, md: 5 },
          textAlign: "center",
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Box sx={{ mb: 6 }}>
          <LocalPharmacyIcon
            sx={{
              fontSize: { xs: 60, sm: 80, md: 100 },
              color: "primary.main",
              mb: 2,
            }}
          />
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "primary.main",
              fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4rem" },
            }}
          >
            BioFarm
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            color="textSecondary"
            sx={{
              maxWidth: "800px",
              mx: "auto",
              fontSize: { xs: "1.2rem", sm: "1.5rem" },
            }}
          >
            Tu farmacia de confianza. Cuidamos de ti y de tu familia con
            productos de calidad y atención profesional.
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
            gap: { xs: 2, md: 4 },
            mb: { xs: 4, md: 6 },
            justifyItems: "center",
          }}
        >
          {features.map((feature) => (
            <Card
              key={feature.title}
                elevation={2}
                sx={{
                  width: "100%",
                  maxWidth: 300,
                  height: { xs: 250, sm: 280 },
                  mx: "auto",
                  display: "flex",
                  flexDirection: "column",
                  transition:
                    "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: (theme) => theme.shadows[8],
                  },
                }}
              >
                <CardContent
                  sx={{
                    textAlign: "center",
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    p: 3,
                    justifyContent: "center",
                  }}
                >
                  <Box
                    sx={{
                      mb: 2,
                      "& .MuiSvgIcon-root": {
                        fontSize: "3rem",
                      },
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ fontWeight: "bold" }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    sx={{
                      lineHeight: 1.6,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
          ))}
        </Box>

        <Box
          sx={{
            mt: { xs: 4, md: 8 },
            p: { xs: 3, md: 4 },
            bgcolor: "primary.main",
            color: "white",
            borderRadius: 2,
            maxWidth: "1000px",
            mx: "auto",
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Sobre BioFarm
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: "800px",
              mx: "auto",
              lineHeight: 1.8,
              fontSize: { xs: "1rem", sm: "1.1rem" },
            }}
          >
            En BioFarm nos dedicamos a cuidar la salud de nuestra comunidad.
            Ofrecemos medicamentos, productos de cuidado personal y asesoría
            profesional para que tú y tu familia estén siempre protegidos.
            ¡Visítanos y descubre por qué somos tu farmacia de confianza!
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            sx={{ mt: 3, fontWeight: "bold", fontSize: "1.1rem" }}
            href="#"
          >
            Ver catálogo
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
