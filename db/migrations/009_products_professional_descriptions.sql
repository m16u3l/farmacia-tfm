-- =============================================================================
-- Migración 009 — Descripciones profesionales del catálogo de productos
-- =============================================================================
-- 1) Agrega dos columnas nuevas a products:
--    - possible_uses:   usos/indicaciones posibles del producto
--    - additional_info: precauciones, contraindicaciones u otra información
--                       relevante (conservación, advertencias, dato práctico)
-- 2) Reescribe description con una descripción corta profesional (tipo
--    vademécum) y puebla possible_uses / additional_info para cada uno de los
--    403 productos del catálogo actual, reemplazando las notas informales
--    previas del farmacéutico (ej. "dolor de garganta" -> descripción,
--    usos e info adicional completos).
--
--    Contenido redactado con conocimiento farmacológico general y, para
--    marcas comerciales bolivianas, verificado contra vademécums/farmacias
--    en línea (medicamentos.bo, ivademecum.com, farmacorp.com, saebolivia.com,
--    grupoalcos.com, breskotpharma.com, entre otros). Cuando no se encontró
--    información confiable de un producto puntual, se usó una descripción
--    conservadora basada en nombre/categoría/forma farmacéutica, sin inventar
--    principio activo o composición no verificada.
--
-- Additiva/segura de ejecutar en cualquier momento (no borra datos existentes,
-- solo agrega columnas y actualiza contenido de texto de products).
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/009_products_professional_descriptions.sql
-- =============================================================================

BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS possible_uses   TEXT,
  ADD COLUMN IF NOT EXISTS additional_info TEXT;

UPDATE products SET
  description = $desc$Pastilla para chupar a base de miel y propóleo (línea "Mi Abejita"/"La Abejita"), de uso tradicional para el alivio de la garganta.$desc$,
  possible_uses = $uses$Irritación de garganta, tos leve, molestias respiratorias.$uses$,
  additional_info = $info$Producto de origen natural (miel, propóleo, eucalipto); no reemplaza tratamiento antibiótico en infecciones bacterianas.$info$
WHERE product_id = 1;

UPDATE products SET
  description = $desc$Aceite mineral o vegetal suave para el cuidado de la piel del bebé.$desc$,
  possible_uses = $uses$Hidratación y masaje de la piel del bebé, cuidado del cuero cabelludo (costra láctea).$uses$,
  additional_info = $info$Uso externo únicamente; evitar contacto con ojos y mucosas.$info$
WHERE product_id = 2;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol (100mg/ml), en presentación de gotas pediátricas.$desc$,
  possible_uses = $uses$Fiebre y dolor leve en lactantes y niños pequeños.$uses$,
  additional_info = $info$Dosificar según peso y edad con el gotero incluido; no combinar con otros productos que contengan paracetamol.$info$
WHERE product_id = 3;

UPDATE products SET
  description = $desc$Antiviral análogo de nucleósido, activo frente al virus del herpes simple.$desc$,
  possible_uses = $uses$Herpes labial (boqueras/llagas en la boca), herpes genital, herpes zóster, bajo indicación médica.$uses$,
  additional_info = $info$Requiere receta médica; iniciar el tratamiento lo antes posible tras la aparición de los primeros síntomas para mayor eficacia.$info$
WHERE product_id = 4;

UPDATE products SET
  description = $desc$Suplemento vitamínico de ácido fólico (vitamina B9), esencial en la formación de tejidos y el desarrollo fetal.$desc$,
  possible_uses = $uses$Suplementación durante el embarazo, prevención de defectos del tubo neural, anemia por déficit de folato.$uses$,
  additional_info = $info$Se recomienda iniciar antes de la concepción cuando sea posible; no sustituye el control prenatal.$info$
WHERE product_id = 5;

UPDATE products SET
  description = $desc$Analgésico combinado (paracetamol 325mg + ibuprofeno 200mg + cafeína 30mg) de doble acción, formulado específicamente para el dolor menstrual.$desc$,
  possible_uses = $uses$Dismenorrea (cólicos menstruales), dolor e inflamación asociados al ciclo menstrual.$uses$,
  additional_info = $info$Se recomienda iniciar 2-3 días antes de la menstruación. No exceder la dosis diaria indicada por el fabricante.$info$
WHERE product_id = 6;

UPDATE products SET
  description = $desc$Suplemento nutricional en jarabe, de uso frecuente en la alimentación complementaria infantil.$desc$,
  possible_uses = $uses$Apoyo nutricional y complemento en la dieta de niños.$uses$,
  additional_info = $info$Verificar composición y modo de dosificación según edad en el empaque del producto.$info$
WHERE product_id = 7;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de ibuprofeno 400mg, marca comercial de uso frecuente en Bolivia.$desc$,
  possible_uses = $uses$Dolor leve a moderado, fiebre, procesos inflamatorios.$uses$,
  additional_info = $info$Tomar con alimentos para reducir irritación gástrica; evitar en úlcera péptica activa o insuficiencia renal severa.$info$
WHERE product_id = 8;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de ibuprofeno 600mg, en cápsulas.$desc$,
  possible_uses = $uses$Dolor leve a moderado, fiebre, procesos inflamatorios de mayor intensidad.$uses$,
  additional_info = $info$Tomar con alimentos para reducir irritación gástrica; evitar en úlcera péptica activa o insuficiencia renal severa.$info$
WHERE product_id = 9;

UPDATE products SET
  description = $desc$Solución antiséptica de peróxido de hidrógeno (agua oxigenada) de uso tópico.$desc$,
  possible_uses = $uses$Limpieza y desinfección de heridas superficiales.$uses$,
  additional_info = $info$Uso externo; evitar en heridas profundas o el contacto prolongado con la piel por su efecto irritante.$info$
WHERE product_id = 10;

UPDATE products SET
  description = $desc$Aguja hipodérmica de calibre fino para uso pediátrico.$desc$,
  possible_uses = $uses$Administración de inyecciones intramusculares o subcutáneas en niños.$uses$,
  additional_info = $info$Uso de un solo uso; desechar en contenedor de punzocortantes tras su aplicación.$info$
WHERE product_id = 11;

UPDATE products SET
  description = $desc$Antitusivo a base de codeína (camsilato de codeína), guayacolsulfonato de potasio y extracto de grindelia, marca del Grupo Alcos.$desc$,
  possible_uses = $uses$Tos seca, irritativa o espasmódica, laringitis, traqueítis.$uses$,
  additional_info = $info$No administrar a menores de 15 años ni durante el embarazo o lactancia; contiene codeína (leve efecto sedante).$info$
WHERE product_id = 12;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol 500mg, marca boliviana del Grupo Alcos.$desc$,
  possible_uses = $uses$Dolor leve a moderado, fiebre, malestar general.$uses$,
  additional_info = $info$Composición equivalente a paracetamol genérico; no combinar con otros productos con paracetamol.$info$
WHERE product_id = 13;

UPDATE products SET
  description = $desc$Alcohol etílico o isopropílico de uso externo, en envase pequeño.$desc$,
  possible_uses = $uses$Desinfección de la piel antes de inyecciones, limpieza de instrumental menor.$uses$,
  additional_info = $info$Uso externo únicamente; mantener alejado del fuego por ser inflamable.$info$
WHERE product_id = 14;

UPDATE products SET
  description = $desc$Antihistamínico antialérgico (levocetirizina), presentación en tabletas.$desc$,
  possible_uses = $uses$Alergias respiratorias, urticaria, rinitis alérgica.$uses$,
  additional_info = $info$Antihistamínico de segunda generación, baja somnolencia.$info$
WHERE product_id = 15;

UPDATE products SET
  description = $desc$Algodón hidrófilo de uso médico.$desc$,
  possible_uses = $uses$Limpieza de piel antes de inyecciones o curaciones, aplicación de antisépticos, absorción de líquidos en curaciones menores.$uses$,
  additional_info = $info$Uso externo únicamente. Mantener en lugar seco para evitar contaminación.$info$
WHERE product_id = 16;

UPDATE products SET
  description = $desc$Algodón hidrófilo de uso médico, en rollo o paquete de 100g.$desc$,
  possible_uses = $uses$Limpieza de piel antes de inyecciones o curaciones, aplicación de antisépticos, absorción de líquidos en curaciones menores.$uses$,
  additional_info = $info$Uso externo únicamente. Mantener en lugar seco para evitar contaminación.$info$
WHERE product_id = 17;

UPDATE products SET
  description = $desc$Combinación de comprimido analgésico (ácido acetilsalicílico + cafeína) con polvo efervescente antiácido (bicarbonato de sodio, ácido cítrico, carbonato de sodio), en sobre.$desc$,
  possible_uses = $uses$Dolor de cabeza asociado a acidez o indigestión, malestar estomacal con dolor.$uses$,
  additional_info = $info$Contraindicado en menores de 16 años, úlcera péptica o hipersensibilidad a la aspirina.$info$
WHERE product_id = 18;

UPDATE products SET
  description = $desc$Analgésico antiácido efervescente a base de ácido acetilsalicílico, bicarbonato de sodio y ácido cítrico.$desc$,
  possible_uses = $uses$Dolor de cabeza, malestar estomacal, acidez con dolor leve.$uses$,
  additional_info = $info$Disolver en agua antes de tomar; evitar en úlcera péptica o alergia a la aspirina.$info$
WHERE product_id = 19;

UPDATE products SET
  description = $desc$Mucolítico y expectorante a base de ambroxol, en presentación de jarabe.$desc$,
  possible_uses = $uses$Tos con flema, bronquitis, afecciones respiratorias con exceso de secreciones.$uses$,
  additional_info = $info$Tomar con abundante agua para facilitar la expulsión de secreciones; respetar la dosis pediátrica según la concentración indicada.$info$
WHERE product_id = 20;

UPDATE products SET
  description = $desc$Pastilla para chupar de acción anestésica y antiséptica local, usada para el alivio de la irritación de garganta.$desc$,
  possible_uses = $uses$Dolor e irritación de garganta, molestias por faringitis leve.$uses$,
  additional_info = $info$Uso de corta duración; no reemplaza tratamiento antibiótico en infecciones bacterianas de garganta.$info$
WHERE product_id = 21;

UPDATE products SET
  description = $desc$Suspensión oral de amoxicilina, antibiótico betalactámico de amplio espectro, en presentación de 100ml.$desc$,
  possible_uses = $uses$Infecciones respiratorias, óticas, urinarias y de piel sensibles a amoxicilina, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica; completar el esquema de tratamiento indicado aunque los síntomas mejoren antes.$info$
WHERE product_id = 22;

UPDATE products SET
  description = $desc$Suspensión oral de amoxicilina, antibiótico betalactámico de amplio espectro, en presentación de 70ml.$desc$,
  possible_uses = $uses$Infecciones respiratorias, óticas, urinarias y de piel sensibles a amoxicilina, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica; completar el esquema de tratamiento indicado aunque los síntomas mejoren antes.$info$
WHERE product_id = 23;

UPDATE products SET
  description = $desc$Antibiótico betalactámico (aminopenicilina) de amplio espectro, bactericida, en tableta de 1 gramo.$desc$,
  possible_uses = $uses$Infecciones respiratorias (faringitis, sinusitis, otitis), infecciones urinarias no complicadas, infecciones dentales, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica. Completar el esquema indicado por el profesional aunque los síntomas mejoren antes. Contraindicado en alergia a penicilinas.$info$
WHERE product_id = 24;

UPDATE products SET
  description = $desc$Antibiótico betalactámico (aminopenicilina) de amplio espectro, bactericida, en tabletas de 500mg.$desc$,
  possible_uses = $uses$Infecciones respiratorias (faringitis, sinusitis, otitis), infecciones urinarias no complicadas, infecciones dentales, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica. Completar el esquema indicado por el profesional aunque los síntomas mejoren antes. Contraindicado en alergia a penicilinas.$info$
WHERE product_id = 25;

UPDATE products SET
  description = $desc$Antibiótico betalactámico (aminopenicilina) de amplio espectro, bactericida.$desc$,
  possible_uses = $uses$Infecciones respiratorias (faringitis, sinusitis, otitis), infecciones urinarias no complicadas, infecciones dentales, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica. Completar el esquema indicado por el profesional aunque los síntomas mejoren antes. Contraindicado en alergia a penicilinas.$info$
WHERE product_id = 26;

UPDATE products SET
  description = $desc$Suspensión oral de amoxicilina 500mg/5ml, antibiótico betalactámico de amplio espectro, en frasco de 60ml.$desc$,
  possible_uses = $uses$Infecciones respiratorias, óticas y urinarias sensibles a amoxicilina en niños y adultos, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica; agitar bien antes de usar y conservar según indicación del fabricante.$info$
WHERE product_id = 27;

UPDATE products SET
  description = $desc$Polvo para reconstituir en suspensión oral de amoxicilina 500mg/5ml, antibiótico de amplio espectro, en frasco de 100ml.$desc$,
  possible_uses = $uses$Infecciones bacterianas de garganta, oído, vías urinarias y piel sensibles a amoxicilina.$uses$,
  additional_info = $info$Requiere receta médica; reconstituir con agua hasta el nivel indicado en el frasco y agitar antes de cada toma.$info$
WHERE product_id = 28;

UPDATE products SET
  description = $desc$Antibiótico betalactámico combinado (amoxicilina + ácido clavulánico), de espectro ampliado frente a bacterias productoras de betalactamasas.$desc$,
  possible_uses = $uses$Infecciones respiratorias, urinarias, de piel y dentales resistentes a amoxicilina sola, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica; tomar con alimentos para reducir el malestar gastrointestinal.$info$
WHERE product_id = 29;

UPDATE products SET
  description = $desc$Antibiótico betalactámico (aminopenicilina) de amplio espectro, en cápsulas de 500mg.$desc$,
  possible_uses = $uses$Infecciones respiratorias, urinarias, gastrointestinales y de piel sensibles a ampicilina.$uses$,
  additional_info = $info$Requiere receta médica; tomar preferentemente en ayunas para una mejor absorción.$info$
WHERE product_id = 30;

UPDATE products SET
  description = $desc$Antibiótico betalactámico (aminopenicilina) de amplio espectro, en cápsulas de 500mg.$desc$,
  possible_uses = $uses$Infecciones respiratorias, urinarias, gastrointestinales y de piel sensibles a ampicilina.$uses$,
  additional_info = $info$Requiere receta médica; tomar preferentemente en ayunas para una mejor absorción.$info$
WHERE product_id = 31;

UPDATE products SET
  description = $desc$Analgésico combinado (paracetamol 325mg + ibuprofeno 200mg + cafeína 30mg), marca boliviana SAE (Anamax NF).$desc$,
  possible_uses = $uses$Dolor de cabeza, dolor de espalda, dolor muscular, dolor de origen artrítico, dolor dental, fiebre.$uses$,
  additional_info = $info$No usar por más de 5 días sin consulta médica; evitar en enfermedad hepática o renal, gastritis, úlcera péptica, embarazo o lactancia.$info$
WHERE product_id = 32;

UPDATE products SET
  description = $desc$Laxante estimulante a base de picosulfato de sodio.$desc$,
  possible_uses = $uses$Estreñimiento agudo o crónico en adultos y niños.$uses$,
  additional_info = $info$Efecto laxante entre 6 y 12 horas tras su administración; no usar de forma prolongada sin indicación médica.$info$
WHERE product_id = 33;

UPDATE products SET
  description = $desc$Laxante estimulante a base de picosulfato de sodio, en tabletas.$desc$,
  possible_uses = $uses$Estreñimiento agudo o crónico en adultos y niños.$uses$,
  additional_info = $info$Efecto laxante entre 6 y 12 horas tras su administración; no usar de forma prolongada sin indicación médica.$info$
WHERE product_id = 34;

UPDATE products SET
  description = $desc$Antigripal combinado a base de paracetamol y pseudoefedrina, distribuido en Bolivia por SAE (existen versiones día y noche, esta última con clorfenamina).$desc$,
  possible_uses = $uses$Síntomas de resfrío y gripe: congestión nasal, fiebre, malestar general.$uses$,
  additional_info = $info$Precaución en hipertensos por la pseudoefedrina; la versión noche puede causar somnolencia por el antihistamínico. Indicado para mayores de 12 años.$info$
WHERE product_id = 35;

UPDATE products SET
  description = $desc$Antiemético a base de extracto de jengibre (Zingiber officinale).$desc$,
  possible_uses = $uses$Prevención de náuseas y vómitos por mareo del viajero (cinetosis) y durante el embarazo.$uses$,
  additional_info = $info$De origen natural, considerado de bajo riesgo en el embarazo; consultar al médico si los síntomas persisten.$info$
WHERE product_id = 36;

UPDATE products SET
  description = $desc$Digestivo fitofarmacéutico a base de extractos de alcachofa, boldo, propóleo y otras plantas, de Laboratorios Valencia (Bolivia).$desc$,
  possible_uses = $uses$Malestar digestivo tras comidas copiosas, normalización de la digestión, apoyo hepático leve.$uses$,
  additional_info = $info$Tomar 1-2 tabletas después de las comidas principales; producto de origen natural.$info$
WHERE product_id = 37;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de ácido acetilsalicílico, con acción analgésica, antipirética y antiinflamatoria.$desc$,
  possible_uses = $uses$Dolor leve a moderado, fiebre, dolores musculares y de cabeza.$uses$,
  additional_info = $info$Evitar en niños con cuadros virales (riesgo de síndrome de Reye); precaución en gastritis o úlcera péptica.$info$
WHERE product_id = 38;

UPDATE products SET
  description = $desc$Ácido acetilsalicílico en dosis baja (aspirina infantil), usado como antiagregante plaquetario.$desc$,
  possible_uses = $uses$Prevención de eventos cardiovasculares (infarto, trombosis) bajo indicación médica.$uses$,
  additional_info = $info$Requiere indicación médica para uso cardiovascular; no usar como analgésico en niños por riesgo de síndrome de Reye.$info$
WHERE product_id = 39;

UPDATE products SET
  description = $desc$Antibiótico macrólido a base de azitromicina, marca del Grupo Alcos.$desc$,
  possible_uses = $uses$Infecciones respiratorias, de piel y de transmisión sexual sensibles a azitromicina.$uses$,
  additional_info = $info$Requiere receta médica; tratamiento habitualmente de corta duración (3-5 días) por su vida media prolongada.$info$
WHERE product_id = 40;

UPDATE products SET
  description = $desc$Antibiótico macrólido de amplio espectro, en presentación de 200mg.$desc$,
  possible_uses = $uses$Infecciones respiratorias, de piel y de transmisión sexual sensibles a azitromicina.$uses$,
  additional_info = $info$Requiere receta médica; tratamiento habitualmente de corta duración (3-5 días) por su vida media prolongada.$info$
WHERE product_id = 41;

UPDATE products SET
  description = $desc$Antibiótico macrólido de amplio espectro, en tableta de 500mg.$desc$,
  possible_uses = $uses$Infecciones respiratorias, de piel y de transmisión sexual sensibles a azitromicina.$uses$,
  additional_info = $info$Requiere receta médica; tratamiento habitualmente de corta duración (3-5 días) por su vida media prolongada.$info$
WHERE product_id = 42;

UPDATE products SET
  description = $desc$Talco cosmético para bebé, en frasco de 650g.$desc$,
  possible_uses = $uses$Absorción de humedad y prevención de rozaduras en la piel del bebé.$uses$,
  additional_info = $info$Evitar aplicar cerca de la cara para prevenir inhalación; uso externo únicamente.$info$
WHERE product_id = 43;

UPDATE products SET
  description = $desc$Repelente de insectos de uso tópico, marca Bahía, en concentración estándar (100).$desc$,
  possible_uses = $uses$Prevención de picaduras de mosquitos y otros insectos.$uses$,
  additional_info = $info$Aplicar sobre la piel expuesta evitando ojos y mucosas; reaplicar según indicación del fabricante.$info$
WHERE product_id = 44;

UPDATE products SET
  description = $desc$Repelente de insectos de uso tópico, marca Bahía, en concentración estándar (90).$desc$,
  possible_uses = $uses$Prevención de picaduras de mosquitos y otros insectos.$uses$,
  additional_info = $info$Aplicar sobre la piel expuesta evitando ojos y mucosas; reaplicar según indicación del fabricante.$info$
WHERE product_id = 45;

UPDATE products SET
  description = $desc$Repelente de insectos de uso tópico formulado para niños, marca Bahía.$desc$,
  possible_uses = $uses$Prevención de picaduras de mosquitos y otros insectos en población infantil.$uses$,
  additional_info = $info$Formulado en menor concentración que las versiones para adultos; evitar aplicar en manos de niños pequeños o cerca de la boca.$info$
WHERE product_id = 46;

UPDATE products SET
  description = $desc$Depresor lingual (baja lenguas) de un solo uso, para examen pediátrico.$desc$,
  possible_uses = $uses$Examen visual de boca y garganta en consultas médicas u odontológicas.$uses$,
  additional_info = $info$Uso de un solo uso; desechar después de cada paciente.$info$
WHERE product_id = 47;

UPDATE products SET
  description = $desc$Mascarilla facial (barbijo) para protección respiratoria básica.$desc$,
  possible_uses = $uses$Prevención de contagio de enfermedades respiratorias, uso en consultorios o espacios públicos.$uses$,
  additional_info = $info$Uso de un solo día o según indicaciones del fabricante; desechar si se humedece.$info$
WHERE product_id = 48;

UPDATE products SET
  description = $desc$Mascarilla facial (barbijo) de color negro, para protección respiratoria básica.$desc$,
  possible_uses = $uses$Prevención de contagio de enfermedades respiratorias, uso en consultorios o espacios públicos.$uses$,
  additional_info = $info$Uso de un solo día o según indicaciones del fabricante; desechar si se humedece.$info$
WHERE product_id = 49;

UPDATE products SET
  description = $desc$Preparado tópico (pomada o parche) a base de extracto de belladona, con efecto anestésico y antiinflamatorio local.$desc$,
  possible_uses = $uses$Dolor muscular, articular, contusiones y esguinces.$uses$,
  additional_info = $info$Uso externo únicamente; evitar contacto con mucosas y heridas abiertas por su contenido de alcaloides (atropina, escopolamina).$info$
WHERE product_id = 50;

UPDATE products SET
  description = $desc$Escabicida y pediculicida en loción, a base de benzoato de bencilo.$desc$,
  possible_uses = $uses$Tratamiento de sarna (escabiosis) y piojos (pediculosis) del cuero cabelludo.$uses$,
  additional_info = $info$No aplicar sobre piel inflamada, heridas o mucosas; se recomienda tratamiento simultáneo de convivientes.$info$
WHERE product_id = 51;

UPDATE products SET
  description = $desc$Corticosteroide tópico de mediana-alta potencia a base de betametasona 0,1%.$desc$,
  possible_uses = $uses$Dermatosis inflamatorias, alergias de piel, eccema, urticaria.$uses$,
  additional_info = $info$Uso por tiempo limitado; evitar en infecciones cutáneas no tratadas y en grandes superficies de piel.$info$
WHERE product_id = 52;

UPDATE products SET
  description = $desc$Crema corticosteroide combinada (betametasona con antibiótico), de uso tópico.$desc$,
  possible_uses = $uses$Dermatitis alérgica o de contacto, eccema con componente inflamatorio.$uses$,
  additional_info = $info$Requiere indicación profesional; no usar de forma prolongada por riesgo de atrofia cutánea.$info$
WHERE product_id = 53;

UPDATE products SET
  description = $desc$Crema tópica combinada de clotrimazol, gentamicina y betametasona, con acción antifúngica, antibacteriana y antiinflamatoria.$desc$,
  possible_uses = $uses$Infecciones de piel y uñas con componente inflamatorio, dermatosis complicadas con infección fúngica o bacteriana.$uses$,
  additional_info = $info$Uso por tiempo limitado bajo indicación profesional; evitar en heridas abiertas.$info$
WHERE product_id = 54;

UPDATE products SET
  description = $desc$Bicarbonato de sodio en polvo, de uso múltiple.$desc$,
  possible_uses = $uses$Alivio ocasional de acidez estomacal, uso en preparaciones caseras e higiene.$uses$,
  additional_info = $info$Uso ocasional para acidez; no recomendado en pacientes con hipertensión por su contenido de sodio.$info$
WHERE product_id = 55;

UPDATE products SET
  description = $desc$Bicarbonato de sodio en polvo, de uso múltiple.$desc$,
  possible_uses = $uses$Alivio ocasional de acidez estomacal, uso en preparaciones caseras e higiene.$uses$,
  additional_info = $info$Uso ocasional para acidez; no recomendado en pacientes con hipertensión por su contenido de sodio.$info$
WHERE product_id = 56;

UPDATE products SET
  description = $desc$Analgésico combinado a base de ácido acetilsalicílico, paracetamol y cafeína.$desc$,
  possible_uses = $uses$Dolor de cabeza, migraña, dolores musculares y fiebre.$uses$,
  additional_info = $info$Evitar en gastritis, úlcera péptica o alergia a la aspirina; no exceder la dosis diaria indicada.$info$
WHERE product_id = 57;

UPDATE products SET
  description = $desc$Bisturí (hoja quirúrgica desechable) de uso médico.$desc$,
  possible_uses = $uses$Procedimientos de corte en curaciones o cirugías menores.$uses$,
  additional_info = $info$Uso de un solo uso; desechar en contenedor de punzocortantes tras su aplicación.$info$
WHERE product_id = 58;

UPDATE products SET
  description = $desc$Botiquín de primeros auxilios con insumos básicos.$desc$,
  possible_uses = $uses$Atención inicial de heridas menores, cortes y golpes en el hogar o el trabajo.$uses$,
  additional_info = $info$Revisar periódicamente el contenido y reponer o renovar los insumos vencidos.$info$
WHERE product_id = 59;

UPDATE products SET
  description = $desc$Catéter intravenoso periférico (branula) calibre 18G, para canalización de vena.$desc$,
  possible_uses = $uses$Acceso venoso para administración de sueros, medicamentos intravenosos o transfusiones.$uses$,
  additional_info = $info$Calibre 18G apto para adultos que requieren infusión rápida de volumen. Uso exclusivo por personal capacitado.$info$
WHERE product_id = 60;

UPDATE products SET
  description = $desc$Catéter intravenoso periférico (branula) calibre 20G, para canalización de vena.$desc$,
  possible_uses = $uses$Acceso venoso para administración de sueros, medicamentos intravenosos o transfusiones en pacientes con venas de menor calibre.$uses$,
  additional_info = $info$Calibre más fino que el 18G, apto para niños o adultos con venas delicadas. Uso exclusivo por personal capacitado.$info$
WHERE product_id = 61;

UPDATE products SET
  description = $desc$Antiespasmódico anticolinérgico (butilbromuro de hioscina) en ampolla inyectable de 20mg/1ml.$desc$,
  possible_uses = $uses$Espasmos gastrointestinales, cólicos biliares o renales, dolor abdominal tipo cólico.$uses$,
  additional_info = $info$Administración por personal de salud (vía intramuscular o intravenosa); contraindicado en glaucoma o hipertrofia prostática severa.$info$
WHERE product_id = 62;

UPDATE products SET
  description = $desc$Antiespasmódico anticolinérgico (butilbromuro de hioscina), en tabletas de 10mg.$desc$,
  possible_uses = $uses$Espasmos y dolores de estómago, cólicos intestinales.$uses$,
  additional_info = $info$Contraindicado en glaucoma de ángulo cerrado, obstrucción intestinal o hipertrofia prostática severa.$info$
WHERE product_id = 63;

UPDATE products SET
  description = $desc$Analgésico combinado de ácido acetilsalicílico y cafeína.$desc$,
  possible_uses = $uses$Dolor de cabeza, dolores musculares, fatiga asociada a dolor leve.$uses$,
  additional_info = $info$Evitar en gastritis, úlcera péptica o hipersensibilidad a la aspirina; la cafeína puede causar insomnio si se toma tarde en el día.$info$
WHERE product_id = 64;

UPDATE products SET
  description = $desc$Analgésico y antipirético masticable a base de ácido acetilsalicílico 100mg, marca del Grupo Alcos formulada para niños.$desc$,
  possible_uses = $uses$Dolor y fiebre en niños.$uses$,
  additional_info = $info$Evitar en niños con cuadros virales (varicela, gripe) por riesgo de síndrome de Reye; consultar al pediatra antes de usar.$info$
WHERE product_id = 65;

UPDATE products SET
  description = $desc$Pastillas para chupar con benzocaína y dextrometorfano, de acción anestésica local y antitusiva.$desc$,
  possible_uses = $uses$Dolor e irritación de garganta, tos seca improductiva.$uses$,
  additional_info = $info$Uso de corta duración; en niños de 4 a 12 años limitar la dosis según indicación del empaque.$info$
WHERE product_id = 66;

UPDATE products SET
  description = $desc$Anticonvulsivante y estabilizador del ánimo, derivado de la iminodibencilo.$desc$,
  possible_uses = $uses$Epilepsia, neuralgia del trigémino, trastorno bipolar, bajo prescripción médica.$uses$,
  additional_info = $info$Medicamento de control, requiere receta médica; requiere control periódico de hemograma por riesgo de discrasias sanguíneas.$info$
WHERE product_id = 67;

UPDATE products SET
  description = $desc$Suplemento vitamínico a base de ácido fólico, vitamina B6 y vitamina B12, de Droguería Inti (Bolivia).$desc$,
  possible_uses = $uses$Apoyo nutricional en anemia y como coadyuvante en la protección cardiovascular.$uses$,
  additional_info = $info$No sustituye el tratamiento farmacológico de una enfermedad cardiovascular establecida; uso bajo indicación profesional.$info$
WHERE product_id = 68;

UPDATE products SET
  description = $desc$Antibiótico cefalosporina de tercera generación, de amplio espectro, en cápsulas de 400mg.$desc$,
  possible_uses = $uses$Infecciones respiratorias (faringitis, sinusitis), urinarias y otras infecciones bacterianas sensibles.$uses$,
  additional_info = $info$Requiere receta médica; completar el esquema indicado aunque los síntomas mejoren antes.$info$
WHERE product_id = 69;

UPDATE products SET
  description = $desc$Antibiótico cefalosporina de tercera generación, de administración inyectable, en presentación de 1 gramo.$desc$,
  possible_uses = $uses$Infecciones bacterianas severas (respiratorias, urinarias, meníngeas, sistémicas), bajo prescripción médica.$uses$,
  additional_info = $info$Administración por personal de salud (vía intramuscular o intravenosa); requiere receta médica.$info$
WHERE product_id = 70;

UPDATE products SET
  description = $desc$Cepillo dental de cerdas sintéticas, marca Astral.$desc$,
  possible_uses = $uses$Higiene bucal diaria, cepillado de dientes y encías.$uses$,
  additional_info = $info$Reemplazar cada 3 meses o antes si las cerdas se desgastan.$info$
WHERE product_id = 71;

UPDATE products SET
  description = $desc$Cepillo dental de cerdas sintéticas, marca Colgate.$desc$,
  possible_uses = $uses$Higiene bucal diaria, cepillado de dientes y encías.$uses$,
  additional_info = $info$Reemplazar cada 3 meses o antes si las cerdas se desgastan.$info$
WHERE product_id = 72;

UPDATE products SET
  description = $desc$Cepillo dental infantil, de cerdas suaves y cabezal pequeño.$desc$,
  possible_uses = $uses$Higiene bucal diaria en niños.$uses$,
  additional_info = $info$Usar con supervisión de un adulto y reemplazar cada 3 meses.$info$
WHERE product_id = 73;

UPDATE products SET
  description = $desc$Antihistamínico H1 de segunda generación, de acción rápida.$desc$,
  possible_uses = $uses$Alergias respiratorias, conjuntivitis alérgica, urticaria crónica.$uses$,
  additional_info = $info$Puede causar somnolencia leve en algunos pacientes, más que loratadina. Ajustar dosis en insuficiencia renal.$info$
WHERE product_id = 74;

UPDATE products SET
  description = $desc$Mamadera (biberón) para alimentación infantil.$desc$,
  possible_uses = $uses$Alimentación con leche o líquidos para bebés.$uses$,
  additional_info = $info$Esterilizar antes del primer uso y lavar después de cada toma.$info$
WHERE product_id = 75;

UPDATE products SET
  description = $desc$Chupete (chupón) de uso infantil para succión no nutritiva.$desc$,
  possible_uses = $uses$Calmar el reflejo de succión del bebé.$uses$,
  additional_info = $info$Esterilizar antes de usar y reemplazar periódicamente por desgaste.$info$
WHERE product_id = 76;

UPDATE products SET
  description = $desc$Tetina (chupón) de repuesto para mamadera/biberón.$desc$,
  possible_uses = $uses$Alimentación del bebé con biberón.$uses$,
  additional_info = $info$Verificar el tamaño del orificio según la edad del bebé; reemplazar si se agrieta.$info$
WHERE product_id = 77;

UPDATE products SET
  description = $desc$Chupón tipo alimentador de frutas, para introducir alimentos sólidos de forma segura.$desc$,
  possible_uses = $uses$Introducción de frutas y alimentos sólidos en bebés en etapa de ablactación.$uses$,
  additional_info = $info$Lavar después de cada uso y verificar que la malla no esté dañada.$info$
WHERE product_id = 78;

UPDATE products SET
  description = $desc$Chupones/tetinas de repuesto para biberón.$desc$,
  possible_uses = $uses$Alimentación del bebé con biberón.$uses$,
  additional_info = $info$Verificar el tamaño del orificio según la edad del bebé; reemplazar si se agrieta.$info$
WHERE product_id = 79;

UPDATE products SET
  description = $desc$Antibiótico quinolona de amplio espectro, en tableta de 500mg.$desc$,
  possible_uses = $uses$Infecciones urinarias, respiratorias, gastrointestinales y de piel sensibles a ciprofloxacino.$uses$,
  additional_info = $info$Requiere receta médica; evitar en menores de edad y embarazo por riesgo en cartílagos de crecimiento.$info$
WHERE product_id = 80;

UPDATE products SET
  description = $desc$Antiséptico bucal en solución, a base de clorhexidina 0,12%.$desc$,
  possible_uses = $uses$Higiene bucal, prevención de infecciones tras procedimientos dentales, gingivitis.$uses$,
  additional_info = $info$Uso a corto plazo; puede causar tinción dental temporal con el uso prolongado.$info$
WHERE product_id = 81;

UPDATE products SET
  description = $desc$Antihistamínico H1 de primera generación, sedante, en tableta de 4mg.$desc$,
  possible_uses = $uses$Alergias nasales, rinorrea y estornudos por resfrío común.$uses$,
  additional_info = $info$Puede causar somnolencia marcada; evitar conducir o manejar maquinaria tras su consumo.$info$
WHERE product_id = 82;

UPDATE products SET
  description = $desc$Antihistamínico H1 de primera generación, en presentación inyectable de 10mg/2ml.$desc$,
  possible_uses = $uses$Reacciones alérgicas agudas, rinitis alérgica severa.$uses$,
  additional_info = $info$Administración por personal de salud; puede causar sedación marcada.$info$
WHERE product_id = 83;

UPDATE products SET
  description = $desc$Sal mineral de magnesio, utilizada como suplemento.$desc$,
  possible_uses = $uses$Suplementación de magnesio, de uso popular como apoyo digestivo o muscular.$uses$,
  additional_info = $info$No existe evidencia científica sólida que respalde su uso para regular la presión arterial; consultar al médico ante condiciones cardiovasculares.$info$
WHERE product_id = 84;

UPDATE products SET
  description = $desc$Antifúngico imidazólico de uso vaginal, en óvulo.$desc$,
  possible_uses = $uses$Infecciones vaginales por hongos (candidiasis).$uses$,
  additional_info = $info$Completar el esquema de tratamiento aunque los síntomas mejoren antes; evitar relaciones sexuales durante el tratamiento.$info$
WHERE product_id = 85;

UPDATE products SET
  description = $desc$Antifúngico imidazólico tópico de amplio espectro, al 1%.$desc$,
  possible_uses = $uses$Infecciones cutáneas por hongos (pie de atleta, tiña, candidiasis cutánea).$uses$,
  additional_info = $info$Aplicar sobre piel limpia y seca; continuar el tratamiento algunos días después de la desaparición de los síntomas.$info$
WHERE product_id = 86;

UPDATE products SET
  description = $desc$Complejo vitamínico B (B1, B6, B12) en solución inyectable.$desc$,
  possible_uses = $uses$Deficiencia de vitaminas del complejo B, neuritis, apoyo en dolores neuríticos.$uses$,
  additional_info = $info$Administración por personal de salud (vía intramuscular); uso bajo indicación profesional.$info$
WHERE product_id = 87;

UPDATE products SET
  description = $desc$Pasta dental Colgate, presentación de 50 gramos.$desc$,
  possible_uses = $uses$Higiene bucal diaria, prevención de caries.$uses$,
  additional_info = $info$Usar cantidad del tamaño de una arveja en niños pequeños para evitar la ingesta excesiva de flúor.$info$
WHERE product_id = 88;

UPDATE products SET
  description = $desc$Pasta dental infantil ("colino"), de uso diario.$desc$,
  possible_uses = $uses$Higiene bucal diaria en niños.$uses$,
  additional_info = $info$Verificar contenido de flúor apto para la edad del niño; supervisar el cepillado en menores.$info$
WHERE product_id = 89;

UPDATE products SET
  description = $desc$Suplemento vitamínico del complejo B (B1, B6, B12), en cápsulas.$desc$,
  possible_uses = $uses$Apoyo nutricional, prevención de dolores musculares y neuríticos por deficiencia vitamínica.$uses$,
  additional_info = $info$No sustituye una alimentación balanceada; uso prolongado según indicación profesional.$info$
WHERE product_id = 90;

UPDATE products SET
  description = $desc$Compresa de gasa de 10cm, para curación de heridas.$desc$,
  possible_uses = $uses$Cobertura y protección de heridas, absorción de secreciones, compresión leve.$uses$,
  additional_info = $info$Verificar esterilidad según presentación antes de aplicar sobre heridas abiertas.$info$
WHERE product_id = 91;

UPDATE products SET
  description = $desc$Compresa de gasa de 7,5cm, para curación de heridas.$desc$,
  possible_uses = $uses$Cobertura y protección de heridas, absorción de secreciones, compresión leve.$uses$,
  additional_info = $info$Verificar esterilidad según presentación antes de aplicar sobre heridas abiertas.$info$
WHERE product_id = 92;

UPDATE products SET
  description = $desc$Hisopos de algodón (cotonetes) de uso higiénico.$desc$,
  possible_uses = $uses$Limpieza de oídos externos, aplicación de productos tópicos en zonas pequeñas.$uses$,
  additional_info = $info$No introducir profundamente en el conducto auditivo por riesgo de lesión.$info$
WHERE product_id = 93;

UPDATE products SET
  description = $desc$Antibiótico combinado (sulfametoxazol + trimetoprima), de amplio espectro.$desc$,
  possible_uses = $uses$Infecciones urinarias, respiratorias y gastrointestinales bacterianas sensibles.$uses$,
  additional_info = $info$Requiere receta médica; mantener buena hidratación durante el tratamiento.$info$
WHERE product_id = 94;

UPDATE products SET
  description = $desc$Antibiótico combinado (sulfametoxazol + trimetoprima) en dosis "forte", de amplio espectro.$desc$,
  possible_uses = $uses$Infecciones urinarias, respiratorias y gastrointestinales bacterianas sensibles.$uses$,
  additional_info = $info$Requiere receta médica; mantener buena hidratación durante el tratamiento.$info$
WHERE product_id = 95;

UPDATE products SET
  description = $desc$Antibiótico combinado (sulfametoxazol 400mg + trimetoprima 80mg) en suspensión oral.$desc$,
  possible_uses = $uses$Infecciones bacterianas urinarias, respiratorias e intestinales en niños y adultos.$uses$,
  additional_info = $info$Requiere receta médica; agitar bien antes de usar y respetar el esquema de dosificación indicado.$info$
WHERE product_id = 96;

UPDATE products SET
  description = $desc$Crema humectante tradicional boliviana a base de chirimoya, de Laboratorios Rossi.$desc$,
  possible_uses = $uses$Hidratación de piel seca en rostro y manos.$uses$,
  additional_info = $info$Uso cosmético externo; producto icónico paceño con más de 50 años en el mercado.$info$
WHERE product_id = 97;

UPDATE products SET
  description = $desc$Crema humectante tradicional boliviana a base de lechuga, de Laboratorios Rossi.$desc$,
  possible_uses = $uses$Hidratación de piel reseca por exposición al sol o la intemperie.$uses$,
  additional_info = $info$Uso cosmético externo; complementaria de la crema de chirimoya de la misma marca.$info$
WHERE product_id = 98;

UPDATE products SET
  description = $desc$Crema humectante de uso cosmético para el cuidado de la piel.$desc$,
  possible_uses = $uses$Hidratación diaria de piel de rostro y cuerpo.$uses$,
  additional_info = $info$Uso cosmético externo; verificar el tipo de piel recomendado en el empaque.$info$
WHERE product_id = 99;

UPDATE products SET
  description = $desc$Crema cosmética antiedad a base de extracto de placenta.$desc$,
  possible_uses = $uses$Hidratación y cuidado de piel madura, apoyo en la apariencia de la piel (antiarrugas).$uses$,
  additional_info = $info$Uso cosmético externo, no terapéutico; aplicar en rostro, cuello y manos según indicación del fabricante.$info$
WHERE product_id = 100;

UPDATE products SET
  description = $desc$Crema humectante cosmética de Laboratorios Portugal, marca boliviana de cuidado de la piel.$desc$,
  possible_uses = $uses$Hidratación diaria de piel de rostro y cuerpo.$uses$,
  additional_info = $info$Uso cosmético externo; verificar el tipo de piel recomendado en el empaque.$info$
WHERE product_id = 101;
UPDATE products SET
  description = $desc$Sales de rehidratación oral (suero oral), marca boliviana del Grupo Alcos, a base de dextrosa anhidra, cloruro de sodio, cloruro de potasio y citrato de sodio.$desc$,
  possible_uses = $uses$Reposición de líquidos y electrolitos en casos de deshidratación por diarrea, vómitos o pérdida excesiva de líquidos.$uses$,
  additional_info = $info$Diluir según las instrucciones del empaque; existen presentaciones Curadil 75 y 90 con distinta concentración de sodio (mEq/L). No debe usarse en caso de vómitos incontrolables u obstrucción intestinal sin supervisión médica.$info$
WHERE product_id = 102;

UPDATE products SET
  description = $desc$Suero de rehidratación oral saborizado (naranja), marca boliviana Curadil, con concentración de sodio de 75 mEq/L.$desc$,
  possible_uses = $uses$Reposición de agua y electrolitos en deshidratación leve a moderada por diarrea o vómitos, en niños y adultos.$uses$,
  additional_info = $info$Preparar y administrar según indicaciones del envase; desechar la solución reconstituida después de 24 horas.$info$
WHERE product_id = 103;

UPDATE products SET
  description = $desc$Suero de rehidratación oral saborizado (cereza), marca boliviana Curadil, con concentración de sodio de 90 mEq/L.$desc$,
  possible_uses = $uses$Reposición de agua y electrolitos en deshidratación por diarrea aguda, vómitos o sudoración excesiva.$uses$,
  additional_info = $info$Mayor concentración de sodio que Curadil 75; seguir indicación profesional en niños pequeños.$info$
WHERE product_id = 104;

UPDATE products SET
  description = $desc$Curita (apósito adhesivo) para cubrir heridas menores.$desc$,
  possible_uses = $uses$Protección de cortes, raspones y heridas superficiales pequeñas.$uses$,
  additional_info = $info$Uso externo de un solo uso; cambiar si se humedece o pierde adherencia.$info$
WHERE product_id = 105;

UPDATE products SET
  description = $desc$Curita adhesiva marca G-Band para heridas menores.$desc$,
  possible_uses = $uses$Cobertura y protección de cortes o raspones superficiales.$uses$,
  additional_info = $info$Verificar que la piel esté limpia y seca antes de aplicar para mejor adherencia.$info$
WHERE product_id = 106;

UPDATE products SET
  description = $desc$Producto de cuidado de uñas para bebé (cortaúñas o lima infantil), según presentación.$desc$,
  possible_uses = $uses$Corte y cuidado de las uñas del bebé de forma segura.$uses$,
  additional_info = $info$Usar con cuidado para evitar cortes en la piel; mantener limpio antes y después de cada uso.$info$
WHERE product_id = 107;

UPDATE products SET
  description = $desc$Anticonceptivo de emergencia a base de levonorgestrel 1.5mg, dosis única.$desc$,
  possible_uses = $uses$Prevención de embarazo no planificado tras relación sexual sin protección o falla del método anticonceptivo habitual.$uses$,
  additional_info = $info$Debe tomarse lo antes posible, idealmente dentro de las 72 horas. No sustituye un método anticonceptivo regular ni protege contra ITS.$info$
WHERE product_id = 108;

UPDATE products SET
  description = $desc$Antiácido en suspensión a base de hidróxido de aluminio e hidróxido de magnesio, marca boliviana del Laboratorio Delta.$desc$,
  possible_uses = $uses$Hiperacidez gástrica, gastritis, reflujo gastroesofágico, úlcera péptica.$uses$,
  additional_info = $info$Tomar alejado de otros medicamentos orales (puede reducir su absorción). Uso pediátrico y de adultos según dosis indicada en el prospecto.$info$
WHERE product_id = 109;

UPDATE products SET
  description = $desc$Antiespasmódico combinado (propinox clorhidrato + dimeticona) en gotas, para el dolor abdominal tipo cólico y gases.$desc$,
  possible_uses = $uses$Dolor abdominal tipo cólico, distensión y gases en niños y adultos.$uses$,
  additional_info = $info$Administrar según peso/edad indicado en el prospecto; no usar en obstrucción intestinal.$info$
WHERE product_id = 110;

UPDATE products SET
  description = $desc$Gel dental a base de lidocaína y extracto de manzanilla, para el alivio del dolor de encías durante la dentición.$desc$,
  possible_uses = $uses$Molestias y dolor de encías en bebés durante la erupción dentaria.$uses$,
  additional_info = $info$Aplicar en pequeña cantidad sobre la encía con masaje suave; no exceder la frecuencia indicada en el envase.$info$
WHERE product_id = 111;

UPDATE products SET
  description = $desc$Anticonceptivo inyectable de depósito a base de acetato de medroxiprogesterona, de aplicación trimestral.$desc$,
  possible_uses = $uses$Anticoncepción hormonal de larga duración (cada 3 meses).$uses$,
  additional_info = $info$Requiere aplicación por personal de salud vía intramuscular; puede causar irregularidades menstruales o amenorrea con el uso prolongado.$info$
WHERE product_id = 112;

UPDATE products SET
  description = $desc$Crema a base de óxido de zinc, con acción queratoplástica y bactericida local, marca boliviana de Laboratorios Minerva.$desc$,
  possible_uses = $uses$Escaldaduras y dermatitis del pañal en bebés, rozaduras, grietas en el pezón, quemaduras leves.$uses$,
  additional_info = $info$Uso externo; la lanolina en su composición puede causar dermatitis de contacto en personas sensibles.$info$
WHERE product_id = 113;

UPDATE products SET
  description = $desc$Desodorante corporal en spray, de uso cosmético.$desc$,
  possible_uses = $uses$Control del olor corporal y transpiración.$uses$,
  additional_info = $info$Uso externo; evitar aplicar sobre piel irritada o recién afeitada.$info$
WHERE product_id = 114;

UPDATE products SET
  description = $desc$Corticosteroide sintético (glucocorticoide) de acción prolongada, en tableta de 0.5mg.$desc$,
  possible_uses = $uses$Procesos inflamatorios y alérgicos diversos, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica. No suspender abruptamente en tratamientos prolongados; puede elevar la glucemia y la presión arterial.$info$
WHERE product_id = 115;

UPDATE products SET
  description = $desc$Corticosteroide inyectable (dexametasona 4mg/ml), de acción antiinflamatoria e inmunosupresora.$desc$,
  possible_uses = $uses$Reacciones alérgicas agudas, procesos inflamatorios severos, edema cerebral, bajo indicación médica.$uses$,
  additional_info = $info$Administración por personal de salud. Requiere receta médica; uso prolongado puede causar supresión adrenal.$info$
WHERE product_id = 116;

UPDATE products SET
  description = $desc$Corticosteroide inyectable (dexametasona 8mg/2ml), de acción antiinflamatoria e inmunosupresora.$desc$,
  possible_uses = $uses$Procesos inflamatorios y alérgicos severos, shock anafiláctico coadyuvante, bajo indicación médica.$uses$,
  additional_info = $info$Administración por personal de salud. Requiere receta médica; vigilar glucemia en pacientes diabéticos.$info$
WHERE product_id = 117;

UPDATE products SET
  description = $desc$Corticosteroide sintético en tableta de 4mg, con potente acción antiinflamatoria.$desc$,
  possible_uses = $uses$Procesos inflamatorios y alérgicos, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica; no combinar con AINEs sin supervisión por mayor riesgo gástrico.$info$
WHERE product_id = 118;

UPDATE products SET
  description = $desc$Suplemento a base de aminoácidos (DL-metionina, colina), vitamina B6 y vitamina C, con acción lipotrópica y desintoxicante hepática, marca boliviana de Corporación COFAR.$desc$,
  possible_uses = $uses$Coadyuvante en la desintoxicación hepática, recuperación tras consumo excesivo de alcohol, apoyo hepático.$uses$,
  additional_info = $info$No sustituye tratamiento médico en intoxicación aguda; diluir el sobre en agua según indicación del envase.$info$
WHERE product_id = 119;

UPDATE products SET
  description = $desc$Antitusivo de acción central, derivado no opioide, indicado para la tos seca irritativa.$desc$,
  possible_uses = $uses$Tos seca no productiva por resfrío, gripe o irritación de vías respiratorias altas.$uses$,
  additional_info = $info$No usar en tos con flema (productiva). Evitar combinar con inhibidores de la MAO.$info$
WHERE product_id = 120;

UPDATE products SET
  description = $desc$Jarabe antitusivo a base de dextrometorfano 10mg, de acción central no opioide.$desc$,
  possible_uses = $uses$Alivio de la tos seca irritativa asociada a resfrío o gripe.$uses$,
  additional_info = $info$No emplear en tos productiva (con flema). Respetar el intervalo entre dosis indicado en el envase.$info$
WHERE product_id = 121;

UPDATE products SET
  description = $desc$Jarabe antitusivo a base de dextrometorfano 15mg, de acción central no opioide.$desc$,
  possible_uses = $uses$Alivio de la tos seca irritativa en adultos.$uses$,
  additional_info = $info$No emplear en tos productiva (con flema). Evitar el uso concomitante con inhibidores de la MAO.$info$
WHERE product_id = 122;

UPDATE products SET
  description = $desc$Suplemento energético en polvo a base de dextrosa anhidra, vitamina C y vitamina B1, marca boliviana de Droguería INTI.$desc$,
  possible_uses = $uses$Apoyo energético y nutricional en estados de decaimiento, convalecencia o esfuerzo físico.$uses$,
  additional_info = $info$Diluir en agua u otro líquido según la dosis indicada en el envase; no reemplaza una alimentación balanceada.$info$
WHERE product_id = 123;

UPDATE products SET
  description = $desc$Gel antiinflamatorio no esteroideo a base de diclofenaco, de uso tópico.$desc$,
  possible_uses = $uses$Dolor e inflamación localizada por golpes, esguinces o dolores musculares y articulares.$uses$,
  additional_info = $info$Uso externo únicamente; evitar contacto con mucosas y heridas abiertas. No exponer la zona tratada al sol.$info$
WHERE product_id = 124;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de diclofenaco 100mg, de liberación prolongada.$desc$,
  possible_uses = $uses$Dolor e inflamación moderada a severa de origen musculoesquelético, articular o postraumático.$uses$,
  additional_info = $info$Tomar con alimentos para reducir irritación gástrica. Evitar en úlcera péptica activa o insuficiencia renal severa.$info$
WHERE product_id = 125;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) en supositorio de diclofenaco 12.5mg, presentación de baja dosis, generalmente de uso pediátrico.$desc$,
  possible_uses = $uses$Dolor e inflamación leve a moderada, fiebre, en pacientes que no toleran la vía oral.$uses$,
  additional_info = $info$Uso rectal; seguir la dosis indicada según edad/peso. Evitar en procesos inflamatorios rectales.$info$
WHERE product_id = 126;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) inyectable a base de diclofenaco sódico, en ampolla de 2ml/75mg.$desc$,
  possible_uses = $uses$Dolor agudo moderado a severo de origen musculoesquelético o postoperatorio, vía intramuscular.$uses$,
  additional_info = $info$Administración por personal de salud; uso a corto plazo por riesgo gastrointestinal y renal.$info$
WHERE product_id = 127;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de diclofenaco sódico 50mg.$desc$,
  possible_uses = $uses$Dolor e inflamación musculoesquelética, articular, dental o postraumática.$uses$,
  additional_info = $info$Tomar con alimentos para reducir irritación gástrica; evitar uso prolongado sin supervisión médica.$info$
WHERE product_id = 128;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) inyectable a base de diclofenaco sódico 75mg, de uso intramuscular.$desc$,
  possible_uses = $uses$Dolor agudo moderado a severo de origen muscular, articular o postraumático.$uses$,
  additional_info = $info$Con frecuencia se administra junto con dexametasona para potenciar el efecto antiinflamatorio; uso a corto plazo por riesgo gastrointestinal y renal.$info$
WHERE product_id = 129;

UPDATE products SET
  description = $desc$Gel antiinflamatorio no esteroideo a base de diclofenaco, de aplicación tópica.$desc$,
  possible_uses = $uses$Dolores musculares y articulares localizados, contusiones, esguinces.$uses$,
  additional_info = $info$Uso externo; lavar las manos tras la aplicación y evitar exposición solar de la zona tratada.$info$
WHERE product_id = 130;

UPDATE products SET
  description = $desc$Gel antiinflamatorio no esteroideo a base de diclofenaco, marca boliviana del laboratorio Inquibol.$desc$,
  possible_uses = $uses$Dolor e inflamación localizada por golpes, esguinces o dolores musculares.$uses$,
  additional_info = $info$Uso externo únicamente; evitar contacto con ojos, mucosas y heridas abiertas.$info$
WHERE product_id = 131;

UPDATE products SET
  description = $desc$AINE derivado del ácido fenilacético, con efecto analgésico y antiinflamatorio marcado.$desc$,
  possible_uses = $uses$Dolores musculares y articulares, dolor postraumático, procesos inflamatorios agudos.$uses$,
  additional_info = $info$Uso a corto plazo recomendado por riesgo cardiovascular y gástrico con uso prolongado. Evitar en insuficiencia cardiaca o renal.$info$
WHERE product_id = 132;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de diclofenaco sódico 75mg.$desc$,
  possible_uses = $uses$Dolores musculares y articulares, dolor postraumático, procesos inflamatorios agudos.$uses$,
  additional_info = $info$Uso a corto plazo recomendado por riesgo gástrico y cardiovascular; evitar en insuficiencia renal.$info$
WHERE product_id = 133;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo a base de clonixinato de lisina 250mg, de acción analgésica rápida.$desc$,
  possible_uses = $uses$Dolor agudo leve a moderado: dolor muscular, dental, dismenorrea, dolor articular.$uses$,
  additional_info = $info$Efecto analgésico de inicio rápido (aproximadamente 30 minutos); tomar con alimentos para reducir molestias gástricas.$info$
WHERE product_id = 134;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio combinado: diclofenaco sódico con vitaminas del complejo B (B1, B6, B12).$desc$,
  possible_uses = $uses$Dolor con componente neurítico: lumbalgia, ciática, dolor muscular y articular.$uses$,
  additional_info = $info$Contraindicado en alergia a AINEs, úlcera péptica activa o insuficiencia renal severa.$info$
WHERE product_id = 135;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio combinado: diclofenaco sódico 50mg con vitaminas B1, B6 y B12.$desc$,
  possible_uses = $uses$Dolor neurítico y musculoesquelético: lumbalgia, ciática, neuralgias.$uses$,
  additional_info = $info$Contraindicado en alergia a AINEs o úlcera péptica activa; requiere precaución en insuficiencia renal.$info$
WHERE product_id = 136;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio combinado: diclofenaco con vitaminas del complejo B1, B6 y B12, en cápsulas.$desc$,
  possible_uses = $uses$Dolor con componente neurítico: lumbalgia, dolor muscular y articular.$uses$,
  additional_info = $info$Contraindicado en alergia a AINEs o úlcera péptica activa; uso a corto plazo recomendado.$info$
WHERE product_id = 137;

UPDATE products SET
  description = $desc$Anticonceptivo oral combinado (etinilestradiol + levonorgestrel), en presentación de 28 tabletas (21 hormonales + 7 con hierro).$desc$,
  possible_uses = $uses$Anticoncepción hormonal diaria.$uses$,
  additional_info = $info$Tomar una tableta diaria en el orden indicado en el blíster; no protege contra infecciones de transmisión sexual.$info$
WHERE product_id = 138;

UPDATE products SET
  description = $desc$Anticonceptivo oral combinado (etinilestradiol + levonorgestrel), variante de presentación de Difem.$desc$,
  possible_uses = $uses$Anticoncepción hormonal diaria.$uses$,
  additional_info = $info$Tomar una tableta diaria a la misma hora; no protege contra infecciones de transmisión sexual.$info$
WHERE product_id = 139;

UPDATE products SET
  description = $desc$Gel antiinflamatorio no esteroideo a base de diclofenaco dietilamina, marca boliviana de Industrias Torrico Antelo (ITA).$desc$,
  possible_uses = $uses$Dolor e inflamación localizada por golpes, esguinces o dolores musculares y articulares.$uses$,
  additional_info = $info$Uso externo; evitar exposición solar de la zona tratada y contacto con mucosas.$info$
WHERE product_id = 140;

UPDATE products SET
  description = $desc$Antiácido y digestivo en polvo (diastasa, subnitrato de bismuto, carbonatos y bicarbonato de sodio), marca boliviana de Laboratorios VITA.$desc$,
  possible_uses = $uses$Hiperacidez, digestiones difíciles, dispepsia, acidez estomacal.$uses$,
  additional_info = $info$Diluir el sobre en agua según indicación del envase; uso ocasional, no reemplaza el tratamiento de causas digestivas de base.$info$
WHERE product_id = 141;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de dipirona (metamizol) magnésica 500mg.$desc$,
  possible_uses = $uses$Dolor leve a moderado y fiebre.$uses$,
  additional_info = $info$Contraindicado en antecedentes de agranulocitosis o alergia a pirazolonas; contiene tartrazina como colorante.$info$
WHERE product_id = 142;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio combinado: piroxicam con vitaminas del complejo B (B1, B6, B12), marca boliviana de Droguería INTI.$desc$,
  possible_uses = $uses$Dolor neurítico y musculoesquelético: lumbalgia, ciática, neuralgias, dolor de espalda.$uses$,
  additional_info = $info$Contraindicado en úlcera péptica activa o alergia a AINEs; se recomienda tomar con alimentos.$info$
WHERE product_id = 143;

UPDATE products SET
  description = $desc$Analgésico combinado (ibuprofeno 200mg + paracetamol 300mg) de doble acción.$desc$,
  possible_uses = $uses$Dolor leve a moderado: dolor de muela, cefalea, dismenorrea, dolor muscular, fiebre.$uses$,
  additional_info = $info$No exceder la dosis diaria indicada; precaución en pacientes con antecedentes de úlcera gástrica.$info$
WHERE product_id = 144;

UPDATE products SET
  description = $desc$Analgésico combinado (ibuprofeno + paracetamol) de doble acción, variante de presentación de Dolo-Octirona.$desc$,
  possible_uses = $uses$Dolor leve a moderado: dolor de muela, cefalea, dolor muscular, fiebre.$uses$,
  additional_info = $info$No exceder la dosis diaria indicada; precaución en pacientes con antecedentes de úlcera gástrica.$info$
WHERE product_id = 145;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio combinado: diclofenaco gastrorresistente con vitaminas B1, B6 y B12, marca boliviana de Breskot Pharma.$desc$,
  possible_uses = $uses$Dolor musculoesquelético y neurítico: lumbalgia, ciática, dolor muscular.$uses$,
  additional_info = $info$Contraindicado en úlcera péptica, asma o policitemia vera; requiere precaución en alergia a AINEs.$info$
WHERE product_id = 146;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio combinado: diclofenaco sódico con vitaminas neurotrópicas B1, B6 y B12.$desc$,
  possible_uses = $uses$Dolor musculoesquelético agudo o crónico con componente neurítico, dolor muscular y de espalda.$uses$,
  additional_info = $info$Contraindicado en úlcera péptica activa o alergia a AINEs; uso a corto plazo recomendado.$info$
WHERE product_id = 147;

UPDATE products SET
  description = $desc$Ungüento analgésico tópico a base de salicilato de metilo, mentol y alcanfor, marca boliviana de Laboratorios Farcos.$desc$,
  possible_uses = $uses$Dolor muscular, lumbago, contracturas, esguinces, golpes.$uses$,
  additional_info = $info$Uso externo; evitar contacto con mucosas, heridas abiertas u ojos. No aplicar con calor local (bolsa de agua caliente) por riesgo de quemadura.$info$
WHERE product_id = 148;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de ketorolaco trometamina 20mg.$desc$,
  possible_uses = $uses$Dolor agudo moderado a severo: postoperatorio, traumatismos, cólicos.$uses$,
  additional_info = $info$Uso a corto plazo (máximo 5 días) por riesgo gastrointestinal y renal; requiere receta médica.$info$
WHERE product_id = 149;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de ketorolaco trometamina 30mg.$desc$,
  possible_uses = $uses$Dolor agudo moderado a severo: postoperatorio, traumatismos, cólicos.$uses$,
  additional_info = $info$Uso a corto plazo (máximo 5 días) por riesgo gastrointestinal y renal; requiere receta médica.$info$
WHERE product_id = 150;

UPDATE products SET
  description = $desc$Analgésico, antiinflamatorio y antipirético combinado (ibuprofeno + paracetamol), marca boliviana del Laboratorio Terbol.$desc$,
  possible_uses = $uses$Dolor leve a moderado: cefalea, dolor dental, dolor muscular, dismenorrea, fiebre, síntomas de resfrío y gripe.$uses$,
  additional_info = $info$Tomar con alimentos para reducir molestias gástricas; no exceder la dosis diaria indicada.$info$
WHERE product_id = 151;

UPDATE products SET
  description = $desc$Antibiótico de la familia de las tetraciclinas, de amplio espectro, en cápsula de 100mg.$desc$,
  possible_uses = $uses$Infecciones respiratorias, urinarias, de piel, enfermedades de transmisión sexual y otras infecciones bacterianas, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica. Evitar exposición solar prolongada por fotosensibilidad; no administrar en embarazo ni en niños menores de 8 años.$info$
WHERE product_id = 152;

UPDATE products SET
  description = $desc$Solución de uso tópico comercializada como 'Esencia Maravillosa', de uso cosmético/tradicional.$desc$,
  possible_uses = $uses$Uso cosmético o de higiene personal, según indicación del fabricante.$uses$,
  additional_info = $info$Uso externo; suspender en caso de irritación de la piel.$info$
WHERE product_id = 153;

UPDATE products SET
  description = $desc$Pastillas para chupar con benzocaína y mentol, de acción anestésica local, marca boliviana de SAE Bolivia.$desc$,
  possible_uses = $uses$Alivio del dolor, ardor e irritación de garganta.$uses$,
  additional_info = $info$Disolver lentamente en la boca; no exceder la dosis diaria indicada. Existe versión 'Duo' con acción antiséptica adicional.$info$
WHERE product_id = 154;

UPDATE products SET
  description = $desc$Antihipertensivo inhibidor de la enzima convertidora de angiotensina (IECA).$desc$,
  possible_uses = $uses$Control de presión arterial alta, insuficiencia cardiaca, bajo indicación médica.$uses$,
  additional_info = $info$Requiere receta y control médico periódico; contraindicado en embarazo. Puede causar tos seca como efecto adverso.$info$
WHERE product_id = 155;

UPDATE products SET
  description = $desc$Esparadrapo (cinta adhesiva) de uso médico para fijar apósitos y vendajes.$desc$,
  possible_uses = $uses$Fijación de gasas, apósitos y vendajes sobre la piel.$uses$,
  additional_info = $info$Verificar sensibilidad cutánea antes de aplicar en pieles delicadas; retirar con cuidado para evitar irritación.$info$
WHERE product_id = 156;

UPDATE products SET
  description = $desc$Artículo de uso personal (espejo pequeño) disponible en la farmacia.$desc$,
  possible_uses = $uses$Uso cosmético o de higiene personal, según necesidad del cliente.$uses$,
  additional_info = $info$Producto no farmacológico; limpiar con paño seco para su conservación.$info$
WHERE product_id = 157;

UPDATE products SET
  description = $desc$Terapia de reemplazo hormonal a base de estrógenos conjugados 0.625mg.$desc$,
  possible_uses = $uses$Síntomas vasomotores moderados a severos de la menopausia (bochornos), atrofia vaginal.$uses$,
  additional_info = $info$Requiere receta médica. Contraindicado en antecedentes de cáncer hormonodependiente, tromboembolismo o sangrado vaginal no diagnosticado.$info$
WHERE product_id = 158;

UPDATE products SET
  description = $desc$Gel de uso tópico para el alivio del dolor e inflamación muscular y articular.$desc$,
  possible_uses = $uses$Dolor muscular y articular localizado, golpes, esguinces.$uses$,
  additional_info = $info$Uso externo únicamente; evitar contacto con mucosas, heridas abiertas y exposición solar de la zona tratada.$info$
WHERE product_id = 159;

UPDATE products SET
  description = $desc$Antigripal multisíntoma para niños en polvo granulado (paracetamol, pseudoefedrina, dextrometorfano y clorfenamina), marca boliviana del Laboratorio COFAR.$desc$,
  possible_uses = $uses$Síntomas de resfrío y gripe en niños: congestión nasal, tos, fiebre, malestar general.$uses$,
  additional_info = $info$Indicado para niños de 6 a 12 años según el prospecto; diluir el sobre en agua. Contiene antihistamínico, puede causar somnolencia leve.$info$
WHERE product_id = 160;

UPDATE products SET
  description = $desc$Antigripal combinado (paracetamol + dextrometorfano + fenilefrina) en cápsulas blandas, formulado para uso diurno (sin componentes sedantes).$desc$,
  possible_uses = $uses$Síntomas de resfrío y gripe: congestión nasal, tos, fiebre, malestar general.$uses$,
  additional_info = $info$Versión 'día' sin antihistamínico sedante, a diferencia de la versión 'noche'. Precaución en hipertensos por la fenilefrina.$info$
WHERE product_id = 161;

UPDATE products SET
  description = $desc$Antigripal combinado (paracetamol + dextrometorfano + fenilefrina + antihistamínico sedante) en cápsulas blandas, formulado para uso nocturno.$desc$,
  possible_uses = $uses$Síntomas de resfrío y gripe durante la noche, incluyendo dificultad para descansar por congestión.$uses$,
  additional_info = $info$Contiene antihistamínico sedante; evitar conducir o el uso de maquinaria tras su consumo.$info$
WHERE product_id = 162;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio y relajante muscular combinado: piroxicam, dexametasona, carisoprodol y vitaminas B6/B12, marca del laboratorio Roemmers.$desc$,
  possible_uses = $uses$Dolor musculoesquelético con contractura: lumbalgia, cervicalgia, dolor por espasmo muscular.$uses$,
  additional_info = $info$Contraindicado en úlcera péptica, alergia a AINEs o miastenia gravis; puede causar somnolencia por el relajante muscular.$info$
WHERE product_id = 163;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio y relajante muscular combinado, de la línea Flogiatrin (piroxicam, carisoprodol y vitaminas del complejo B).$desc$,
  possible_uses = $uses$Dolor musculoesquelético con contractura: lumbalgia, cervicalgia, dolor por espasmo muscular.$uses$,
  additional_info = $info$Contraindicado en úlcera péptica o alergia a AINEs; puede causar somnolencia.$info$
WHERE product_id = 164;

UPDATE products SET
  description = $desc$Crema de uso tópico para el tratamiento de afecciones fúngicas de la piel.$desc$,
  possible_uses = $uses$Micosis cutáneas superficiales (hongos en la piel).$uses$,
  additional_info = $info$Uso externo; completar el tiempo de tratamiento indicado en el envase aunque los síntomas mejoren antes.$info$
WHERE product_id = 165;

UPDATE products SET
  description = $desc$Antifúngico triazólico de amplio espectro, en cápsula.$desc$,
  possible_uses = $uses$Candidiasis vaginal, oral o sistémica, infecciones fúngicas de piel y uñas, bajo indicación médica.$uses$,
  additional_info = $info$Requiere receta médica en tratamientos prolongados. Puede interactuar con otros medicamentos metabolizados por el hígado.$info$
WHERE product_id = 166;

UPDATE products SET
  description = $desc$Antigripal en gotas (paracetamol, pseudoefedrina y clorfeniramina), marca boliviana del Laboratorio Delta.$desc$,
  possible_uses = $uses$Congestión nasal, estornudos, fiebre y malestar general por resfrío o gripe.$uses$,
  additional_info = $info$Contiene antihistamínico sedante; puede causar somnolencia. Uso pediátrico según dosis indicada por edad.$info$
WHERE product_id = 167;

UPDATE products SET
  description = $desc$Antidepresivo inhibidor selectivo de la recaptación de serotonina (ISRS).$desc$,
  possible_uses = $uses$Depresión, trastorno obsesivo-compulsivo, trastornos de ansiedad, bajo prescripción psiquiátrica/médica.$uses$,
  additional_info = $info$Medicamento de control, requiere receta médica retenida. El efecto terapéutico completo puede tardar varias semanas. No suspender abruptamente sin indicación médica.$info$
WHERE product_id = 168;

UPDATE products SET
  description = $desc$Jarabe antitusivo y expectorante a base de dextrometorfano y guaifenesina, marca Vick Fórmula 44.$desc$,
  possible_uses = $uses$Tos seca y con flema asociada a resfrío o gripe.$uses$,
  additional_info = $info$No combinar con otros productos que contengan dextrometorfano. Evitar el uso concomitante con inhibidores de la MAO.$info$
WHERE product_id = 169;

UPDATE products SET
  description = $desc$Frasco estéril para recolección de muestra de heces con fines de laboratorio.$desc$,
  possible_uses = $uses$Recolección y transporte de muestra de heces para análisis coproparasitológico u otros estudios de laboratorio.$uses$,
  additional_info = $info$Uso de un solo paciente; rotular con los datos del paciente y entregar al laboratorio dentro del tiempo indicado.$info$
WHERE product_id = 170;

UPDATE products SET
  description = $desc$Gasa estéril/no estéril de 5×5 cm para curación de heridas.$desc$,
  possible_uses = $uses$Cobertura y protección de heridas, limpieza de zonas afectadas, compresión leve.$uses$,
  additional_info = $info$Verificar esterilidad según presentación antes de aplicar sobre heridas abiertas.$info$
WHERE product_id = 171;

UPDATE products SET
  description = $desc$Gasa de 5×5 cm marca Premier, para curación de heridas.$desc$,
  possible_uses = $uses$Cobertura y protección de heridas, limpieza de zonas afectadas, compresión leve.$uses$,
  additional_info = $info$Verificar esterilidad según presentación antes de aplicar sobre heridas abiertas.$info$
WHERE product_id = 172;

UPDATE products SET
  description = $desc$Gasa de 7×5 cm marca Ecom, para curación de heridas.$desc$,
  possible_uses = $uses$Cobertura y protección de heridas de mayor superficie, limpieza de zonas afectadas.$uses$,
  additional_info = $info$Verificar esterilidad según presentación antes de aplicar sobre heridas abiertas.$info$
WHERE product_id = 173;

UPDATE products SET
  description = $desc$Gasa de 7×5 cm marca Premier, para curación de heridas.$desc$,
  possible_uses = $uses$Cobertura y protección de heridas de mayor superficie, limpieza de zonas afectadas.$uses$,
  additional_info = $info$Verificar esterilidad según presentación antes de aplicar sobre heridas abiertas.$info$
WHERE product_id = 174;

UPDATE products SET
  description = $desc$Mamadera (biberón) con doble asa, marca Ghiraff, de 330ml (11oz).$desc$,
  possible_uses = $uses$Alimentación de bebés con leche o líquidos.$uses$,
  additional_info = $info$Esterilizar antes del primer uso y entre usos; revisar la tetina periódicamente por desgaste.$info$
WHERE product_id = 175;

UPDATE products SET
  description = $desc$Mamadera (biberón) con doble asa, marca Ghiraff, de 300ml.$desc$,
  possible_uses = $uses$Alimentación de bebés con leche o líquidos.$uses$,
  additional_info = $info$Esterilizar antes del primer uso y entre usos; revisar la tetina periódicamente por desgaste.$info$
WHERE product_id = 176;

UPDATE products SET
  description = $desc$Mamadera (biberón) marca Ghiraff, de 240ml (8oz).$desc$,
  possible_uses = $uses$Alimentación de bebés con leche o líquidos.$uses$,
  additional_info = $info$Esterilizar antes del primer uso y entre usos; revisar la tetina periódicamente por desgaste.$info$
WHERE product_id = 177;

UPDATE products SET
  description = $desc$Máquina de afeitar (rasuradora) desechable de uso personal.$desc$,
  possible_uses = $uses$Rasurado de vello corporal o facial, incluyendo preparación de la piel antes de procedimientos médicos.$uses$,
  additional_info = $info$Uso individual; desechar tras su uso para evitar cortes o infecciones por reutilización.$info$
WHERE product_id = 178;

UPDATE products SET
  description = $desc$Antidiabético oral sulfonilurea, estimula la secreción de insulina por el páncreas.$desc$,
  possible_uses = $uses$Manejo de diabetes tipo 2, bajo prescripción y control médico.$uses$,
  additional_info = $info$Requiere receta médica. Tomar antes de las comidas; riesgo de hipoglucemia si se omite la ingesta de alimentos.$info$
WHERE product_id = 179;

UPDATE products SET
  description = $desc$Solución oftálmica de uso tópico, según indicación del envase.$desc$,
  possible_uses = $uses$Alivio de molestias oculares leves como sequedad o irritación, según indicación del fabricante.$uses$,
  additional_info = $info$Uso oftálmico exclusivo; desechar el frasco una vez abierto según el plazo indicado en el envase, para evitar contaminación.$info$
WHERE product_id = 180;

UPDATE products SET
  description = $desc$Suplemento energético en polvo a base de dextrosa y vitaminas B1, B6 y B12, marca boliviana de Laboratorios VITA.$desc$,
  possible_uses = $uses$Apoyo energético en esfuerzo físico, deportes, convalecencia o periodo pre y postoperatorio.$uses$,
  additional_info = $info$Contraindicado en diabetes o coma diabético; diluir en agua u otro líquido según la dosis indicada.$info$
WHERE product_id = 181;

UPDATE products SET
  description = $desc$Antidiabético oral combinado: glibenclamida + metformina.$desc$,
  possible_uses = $uses$Manejo de diabetes tipo 2 no controlada con monoterapia, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica. Tomar con alimentos; contraindicado en insuficiencia renal o hepática severa.$info$
WHERE product_id = 182;

UPDATE products SET
  description = $desc$Gorro desechable de uso médico para cubrir el cabello.$desc$,
  possible_uses = $uses$Protección e higiene en procedimientos clínicos, quirúrgicos o de manipulación de alimentos/material estéril.$uses$,
  additional_info = $info$Uso de un solo uso; desechar después de cada procedimiento.$info$
WHERE product_id = 183;

UPDATE products SET
  description = $desc$Antiemético y antivertiginoso a base de dimenhidrinato, marca internacional Gravol.$desc$,
  possible_uses = $uses$Mareo por movimiento (cinetosis), náuseas y vómitos, vértigo.$uses$,
  additional_info = $info$Puede causar somnolencia; evitar conducir o el uso de maquinaria tras su consumo. Precaución en glaucoma o hipertrofia prostática.$info$
WHERE product_id = 184;

UPDATE products SET
  description = $desc$Guantes desechables de látex para examinación o procedimientos médicos.$desc$,
  possible_uses = $uses$Protección en curaciones, procedimientos clínicos, manipulación de material biológico.$uses$,
  additional_info = $info$Contraindicados en personas con alergia al látex (existe alternativa de nitrilo, ver ítem correspondiente).$info$
WHERE product_id = 185;

UPDATE products SET
  description = $desc$Guantes desechables de nitrilo para examinación o procedimientos médicos, alternativa sin látex.$desc$,
  possible_uses = $uses$Protección en curaciones, procedimientos clínicos, manipulación de material biológico, apto para personas alérgicas al látex.$uses$,
  additional_info = $info$Uso de un solo uso; desechar tras cada procedimiento.$info$
WHERE product_id = 186;

UPDATE products SET
  description = $desc$Prueba rápida cualitativa de embarazo en tira, que detecta la hormona gonadotropina coriónica humana (HCG) en orina.$desc$,
  possible_uses = $uses$Detección temprana de embarazo en el hogar.$uses$,
  additional_info = $info$Realizar preferentemente con la primera orina de la mañana; confirmar el resultado con un profesional de salud.$info$
WHERE product_id = 187;

UPDATE products SET
  description = $desc$Hepatoprotector a base de silimarina (extracto de cardo mariano) 150mg.$desc$,
  possible_uses = $uses$Apoyo en la protección hepática, coadyuvante en intoxicaciones o hepatitis, bajo indicación profesional.$uses$,
  additional_info = $info$No debe administrarse en pacientes con obstrucción biliar. Uso prolongado (hasta 6 semanas) según posología recomendada.$info$
WHERE product_id = 188;

UPDATE products SET
  description = $desc$Corticosteroide tópico de baja potencia (hidrocortisona), en crema.$desc$,
  possible_uses = $uses$Inflamación y picazón de la piel: dermatitis, eczema, picaduras de insectos, irritaciones leves.$uses$,
  additional_info = $info$Uso externo por periodos cortos; evitar aplicar sobre heridas infectadas o grandes extensiones de piel sin indicación médica.$info$
WHERE product_id = 189;

UPDATE products SET
  description = $desc$Hilo dental para la higiene bucal.$desc$,
  possible_uses = $uses$Limpieza interdental para remover placa y restos de alimentos.$uses$,
  additional_info = $info$Uso diario recomendado como complemento del cepillado dental.$info$
WHERE product_id = 190;

UPDATE products SET
  description = $desc$Hilo de sutura de uso quirúrgico, según calibre y presentación.$desc$,
  possible_uses = $uses$Sutura de piel en heridas o procedimientos quirúrgicos menores.$uses$,
  additional_info = $info$Uso exclusivo por personal capacitado; requiere retiro de puntos según indicación médica si es no absorbible.$info$
WHERE product_id = 191;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de ibuprofeno 200mg, con acción analgésica, antipirética y antiinflamatoria.$desc$,
  possible_uses = $uses$Dolor leve a moderado, fiebre, cefalea, dolor muscular.$uses$,
  additional_info = $info$Tomar con alimentos para reducir irritación gástrica. Evitar en úlcera péptica activa o insuficiencia renal severa.$info$
WHERE product_id = 192;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) derivado del ácido propiónico, con acción analgésica, antipirética y antiinflamatoria.$desc$,
  possible_uses = $uses$Dolor musculoesquelético, dolor menstrual, cefalea, inflamación leve a moderada, fiebre.$uses$,
  additional_info = $info$Tomar con alimentos para reducir irritación gástrica. Evitar en úlcera péptica activa, insuficiencia renal severa o tercer trimestre de embarazo.$info$
WHERE product_id = 193;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) derivado del ácido propiónico, ibuprofeno 600mg, con acción analgésica, antipirética y antiinflamatoria.$desc$,
  possible_uses = $uses$Dolor musculoesquelético moderado a severo, dolor menstrual, inflamación, fiebre.$uses$,
  additional_info = $info$Tomar con alimentos para reducir irritación gástrica. Evitar en úlcera péptica activa, insuficiencia renal severa o tercer trimestre de embarazo.$info$
WHERE product_id = 194;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de ibuprofeno 800mg, para dolor e inflamación moderada a severa.$desc$,
  possible_uses = $uses$Dolor musculoesquelético moderado a severo, procesos inflamatorios, fiebre.$uses$,
  additional_info = $info$Tomar con alimentos para reducir irritación gástrica. Evitar en úlcera péptica activa o insuficiencia renal severa.$info$
WHERE product_id = 195;

UPDATE products SET
  description = $desc$Jarabe pediátrico mucolítico y expectorante a base de ambroxol clorhidrato 15mg/5ml.$desc$,
  possible_uses = $uses$Afecciones respiratorias con secreciones espesas: bronquitis, resfrío con tos productiva.$uses$,
  additional_info = $info$Administrar según edad y peso indicados en el envase; no combinar con antitusivos que inhiban la expulsión de flema.$info$
WHERE product_id = 196;

UPDATE products SET
  description = $desc$Jabón cosmético a base de extracto de arroz, de uso para el cuidado de la piel.$desc$,
  possible_uses = $uses$Limpieza facial y corporal, uso cosmético para unificar el tono de piel.$uses$,
  additional_info = $info$Uso externo; suspender en caso de irritación o reacción alérgica.$info$
WHERE product_id = 197;

UPDATE products SET
  description = $desc$Jabón de glicerina de uso cosmético e higiene personal.$desc$,
  possible_uses = $uses$Limpieza suave de piel sensible.$uses$,
  additional_info = $info$Uso externo; adecuado para pieles secas o sensibles por su efecto humectante.$info$
WHERE product_id = 198;

UPDATE products SET
  description = $desc$Jabón a base de aceite de oliva, de uso cosmético e higiene personal.$desc$,
  possible_uses = $uses$Limpieza e hidratación de piel.$uses$,
  additional_info = $info$Uso externo; adecuado para pieles secas por su contenido graso natural.$info$
WHERE product_id = 199;

UPDATE products SET
  description = $desc$Jabón de tocador de uso cosmético e higiene personal, marca Harmoni.$desc$,
  possible_uses = $uses$Limpieza e higiene corporal.$uses$,
  additional_info = $info$Uso externo; suspender en caso de irritación de la piel.$info$
WHERE product_id = 200;

UPDATE products SET
  description = $desc$Jabón de azufre, con propiedades antisépticas y queratolíticas suaves.$desc$,
  possible_uses = $uses$Higiene de piel con tendencia acneica, coadyuvante en afecciones cutáneas leves.$uses$,
  additional_info = $info$Uso externo; puede resecar la piel con uso frecuente, hidratar la zona después de su uso.$info$
WHERE product_id = 201;

UPDATE products SET
  description = $desc$Jabón de tocador humectante marca Dove, con un cuarto de crema hidratante.$desc$,
  possible_uses = $uses$Limpieza e higiene corporal diaria.$uses$,
  additional_info = $info$Uso externo; adecuado para piel sensible o seca.$info$
WHERE product_id = 202;
UPDATE products SET
  description = $desc$Jeringa desechable graduada para insulina (escala U-100), con aguja fina fija, de un solo uso.$desc$,
  possible_uses = $uses$Administración subcutánea de insulina en pacientes diabéticos.$uses$,
  additional_info = $info$Desechar en contenedor de punzocortantes tras un solo uso; no reutilizar ni compartir entre pacientes.$info$
WHERE product_id = 203;

UPDATE products SET
  description = $desc$Jeringa desechable de 10 ml con aguja, de un solo uso.$desc$,
  possible_uses = $uses$Administración de medicamentos inyectables, irrigación de heridas, extracción de líquidos.$uses$,
  additional_info = $info$Desechar en contenedor de punzocortantes tras un solo uso; no reutilizar.$info$
WHERE product_id = 204;

UPDATE products SET
  description = $desc$Jeringa desechable de 20 ml con aguja, de un solo uso.$desc$,
  possible_uses = $uses$Administración de medicamentos inyectables de mayor volumen, irrigación de heridas, aspiración de líquidos.$uses$,
  additional_info = $info$Desechar en contenedor de punzocortantes tras un solo uso; no reutilizar.$info$
WHERE product_id = 205;

UPDATE products SET
  description = $desc$Jeringa desechable de 5 ml con aguja, de un solo uso.$desc$,
  possible_uses = $uses$Administración de medicamentos inyectables, aplicación de dosis pequeñas, extracción de líquidos.$uses$,
  additional_info = $info$Desechar en contenedor de punzocortantes tras un solo uso; no reutilizar.$info$
WHERE product_id = 206;

UPDATE products SET
  description = $desc$Jeringa desechable de 3 ml con aguja, de un solo uso.$desc$,
  possible_uses = $uses$Administración de medicamentos inyectables en dosis pequeñas, uso pediátrico o de precisión.$uses$,
  additional_info = $info$Desechar en contenedor de punzocortantes tras un solo uso; no reutilizar.$info$
WHERE product_id = 207;

UPDATE products SET
  description = $desc$Shampoo infantil suave, formulado para el cuidado del cabello y cuero cabelludo de bebés.$desc$,
  possible_uses = $uses$Higiene capilar diaria de bebés y niños pequeños.$uses$,
  additional_info = $info$Fórmula libre de lágrimas (hipoalergénica); evitar contacto directo con los ojos.$info$
WHERE product_id = 208;

UPDATE products SET
  description = $desc$Producto de venta en farmacia; no se cuenta con información verificable sobre su composición o clasificación específica.$desc$,
  possible_uses = $uses$Según indicación del prospecto del fabricante o del profesional de salud.$uses$,
  additional_info = $info$Consultar el empaque o al químico farmacéutico antes de dispensar o recomendar su uso.$info$
WHERE product_id = 209;

UPDATE products SET
  description = $desc$Antifúngico tópico imidazólico (ketoconazol), de aplicación cutánea.$desc$,
  possible_uses = $uses$Micosis cutáneas, tiña, pitiriasis versicolor, candidiasis cutánea.$uses$,
  additional_info = $info$Uso externo; aplicar sobre piel limpia y seca, generalmente una vez al día durante el tiempo indicado por el profesional.$info$
WHERE product_id = 210;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio no esteroideo (AINE) a base de ketorolaco trometamina, de laboratorio boliviano Inti.$desc$,
  possible_uses = $uses$Dolor agudo moderado a severo (postoperatorio, cólicos, traumatismos).$uses$,
  additional_info = $info$Uso a corto plazo (máximo 5 días) por riesgo gastrointestinal y renal; requiere receta médica.$info$
WHERE product_id = 211;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio no esteroideo (AINE), ketorolaco trometamina 30mg en tableta sublingual.$desc$,
  possible_uses = $uses$Dolor agudo moderado a severo, de rápida absorción por vía sublingual.$uses$,
  additional_info = $info$Uso a corto plazo (máximo 5 días); evitar en úlcera péptica activa o insuficiencia renal.$info$
WHERE product_id = 212;

UPDATE products SET
  description = $desc$Pañuelos faciales desechables de papel suave.$desc$,
  possible_uses = $uses$Higiene nasal y facial de uso cotidiano.$uses$,
  additional_info = $info$Producto de un solo uso; no indicado para heridas ni curaciones.$info$
WHERE product_id = 213;

UPDATE products SET
  description = $desc$Toalla higiénica femenina desechable para la menstruación.$desc$,
  possible_uses = $uses$Protección e higiene durante el periodo menstrual.$uses$,
  additional_info = $info$Cambiar cada 4-6 horas aproximadamente para mantener una adecuada higiene.$info$
WHERE product_id = 214;

UPDATE products SET
  description = $desc$Toalla higiénica femenina desechable de mayor tamaño y absorción, para uso nocturno.$desc$,
  possible_uses = $uses$Protección e higiene menstrual durante la noche o flujo abundante.$uses$,
  additional_info = $info$Cambiar al despertar o antes si es necesario para mantener una adecuada higiene.$info$
WHERE product_id = 215;

UPDATE products SET
  description = $desc$Toalla higiénica femenina desechable, línea con materiales suaves.$desc$,
  possible_uses = $uses$Protección e higiene durante el periodo menstrual.$uses$,
  additional_info = $info$Cambiar cada 4-6 horas aproximadamente para mantener una adecuada higiene.$info$
WHERE product_id = 216;

UPDATE products SET
  description = $desc$Laxante en emulsión oral a base de petrolato líquido y fenolftaleína.$desc$,
  possible_uses = $uses$Estreñimiento ocasional o crónico, preparación intestinal, pacientes con reposo prolongado.$uses$,
  additional_info = $info$Tomar preferentemente antes de dormir; uso prolongado no recomendado sin indicación médica.$info$
WHERE product_id = 217;

UPDATE products SET
  description = $desc$Antihistamínico H1 de segunda generación (levocetirizina), en tableta.$desc$,
  possible_uses = $uses$Alergias respiratorias, rinitis alérgica, urticaria, reacciones por picaduras de insectos.$uses$,
  additional_info = $info$Baja somnolencia comparado con antihistamínicos de primera generación; ajustar dosis en insuficiencia renal.$info$
WHERE product_id = 218;

UPDATE products SET
  description = $desc$Producto farmacéutico de la línea comercial LCH; la información disponible no permite confirmar con certeza su principio activo específico.$desc$,
  possible_uses = $uses$Según indicación del prospecto del fabricante o del profesional de salud.$uses$,
  additional_info = $info$Verificar la composición exacta en el empaque antes de dispensar, ya que el laboratorio comercializa distintos medicamentos bajo esta misma línea.$info$
WHERE product_id = 219;

UPDATE products SET
  description = $desc$Anticonceptivo de emergencia en tableta única, a base de levonorgestrel 1.5 mg.$desc$,
  possible_uses = $uses$Prevención de embarazo no planificado tras relación sexual sin protección o falla del método anticonceptivo habitual.$uses$,
  additional_info = $info$Debe tomarse lo antes posible, idealmente dentro de las 72 horas; no sustituye un método anticonceptivo regular ni protege contra ITS.$info$
WHERE product_id = 220;

UPDATE products SET
  description = $desc$Antibiótico fluoroquinolona de amplio espectro, en solución inyectable.$desc$,
  possible_uses = $uses$Infecciones respiratorias, urinarias y de piel de moderadas a severas, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica; evitar en pacientes con antecedentes de tendinopatía o QT prolongado.$info$
WHERE product_id = 221;

UPDATE products SET
  description = $desc$Anticonceptivo de emergencia en tableta, de la misma clase que otras presentaciones de levonorgestrel disponibles en el mercado boliviano.$desc$,
  possible_uses = $uses$Prevención de embarazo no planificado tras relación sexual sin protección o falla del método anticonceptivo habitual.$uses$,
  additional_info = $info$Debe tomarse lo antes posible, idealmente dentro de las 72 horas; no sustituye un método anticonceptivo regular.$info$
WHERE product_id = 222;

UPDATE products SET
  description = $desc$Anticonceptivo de emergencia en tableta única, a base de levonorgestrel 1.5 mg.$desc$,
  possible_uses = $uses$Prevención de embarazo no planificado tras relación sexual sin protección o falla del método anticonceptivo habitual.$uses$,
  additional_info = $info$Debe tomarse lo antes posible, idealmente dentro de las 72 horas; no sustituye un método anticonceptivo regular ni protege contra ITS.$info$
WHERE product_id = 223;

UPDATE products SET
  description = $desc$Anestésico local tipo amida, en solución inyectable.$desc$,
  possible_uses = $uses$Anestesia local infiltrativa o troncular para procedimientos menores.$uses$,
  additional_info = $info$Conservar en lugar fresco; verificar ausencia de epinefrina si el paciente es hipertenso o cardiópata.$info$
WHERE product_id = 224;

UPDATE products SET
  description = $desc$Anestésico local tipo amida al 1%, en solución inyectable.$desc$,
  possible_uses = $uses$Anestesia local infiltrativa para suturas, procedimientos menores y odontológicos.$uses$,
  additional_info = $info$Uso exclusivo por personal capacitado; verificar antecedentes de alergia a anestésicos locales.$info$
WHERE product_id = 225;

UPDATE products SET
  description = $desc$Anestésico local tipo amida al 1%, presentación de 5 ml en ampolla.$desc$,
  possible_uses = $uses$Anestesia local infiltrativa para suturas y procedimientos menores.$uses$,
  additional_info = $info$Uso exclusivo por personal capacitado; descartar la ampolla abierta no utilizada en su totalidad.$info$
WHERE product_id = 226;

UPDATE products SET
  description = $desc$Anticonceptivo hormonal inyectable de depósito, a base de medroxiprogesterona.$desc$,
  possible_uses = $uses$Anticoncepción trimestral por vía intramuscular, bajo indicación médica.$uses$,
  additional_info = $info$Requiere aplicación por personal de salud en fechas programadas; puede alterar el patrón menstrual.$info$
WHERE product_id = 227;

UPDATE products SET
  description = $desc$Antidiarreico opioide de acción local, reduce la motilidad intestinal.$desc$,
  possible_uses = $uses$Diarrea aguda no complicada en niños y adultos.$uses$,
  additional_info = $info$No usar en diarrea con sangre o fiebre alta sin evaluación médica; suspender si no hay mejoría en 48 horas.$info$
WHERE product_id = 228;

UPDATE products SET
  description = $desc$Antihistamínico H1 de segunda generación, no sedante.$desc$,
  possible_uses = $uses$Rinitis alérgica, urticaria, picazón y estornudos por alergias estacionales.$uses$,
  additional_info = $info$Efecto de baja somnolencia comparado con antihistamínicos de primera generación. Uso con precaución en insuficiencia hepática.$info$
WHERE product_id = 229;

UPDATE products SET
  description = $desc$Antihipertensivo antagonista de los receptores de angiotensina II (ARA-II).$desc$,
  possible_uses = $uses$Control de presión arterial alta, protección renal en pacientes diabéticos, bajo indicación médica.$uses$,
  additional_info = $info$Requiere receta y control médico periódico. Contraindicado en embarazo.$info$
WHERE product_id = 230;

UPDATE products SET
  description = $desc$Lágrima artificial y lubricante oftálmico en gotas, para el alivio de la sequedad ocular.$desc$,
  possible_uses = $uses$Sequedad ocular, irritación leve, protección de la superficie ocular.$uses$,
  additional_info = $info$No usar con lentes de contacto puestos salvo indicación específica; desechar el frasco un mes después de abierto.$info$
WHERE product_id = 231;

UPDATE products SET
  description = $desc$Biberón (mamadera) plástico para alimentación infantil.$desc$,
  possible_uses = $uses$Alimentación de lactantes con leche materna extraída o fórmula.$uses$,
  additional_info = $info$Esterilizar antes del primer uso y lavar cuidadosamente después de cada uso.$info$
WHERE product_id = 232;

UPDATE products SET
  description = $desc$Biberón (mamadera) plástico de 120 ml para alimentación infantil.$desc$,
  possible_uses = $uses$Alimentación de lactantes con leche materna extraída o fórmula, en tomas de menor volumen.$uses$,
  additional_info = $info$Esterilizar antes del primer uso y lavar cuidadosamente después de cada uso.$info$
WHERE product_id = 233;

UPDATE products SET
  description = $desc$Preservativo masculino de látex, con lubricante.$desc$,
  possible_uses = $uses$Anticoncepción de barrera y prevención de infecciones de transmisión sexual (ITS).$uses$,
  additional_info = $info$Verificar fecha de vencimiento antes de usar; almacenar lejos de calor y luz directa.$info$
WHERE product_id = 234;

UPDATE products SET
  description = $desc$Antiparasitario de amplio espectro (bencimidazol), actúa a nivel intestinal.$desc$,
  possible_uses = $uses$Parasitosis intestinal (áscaris, oxiuros, tricocéfalos, anquilostomas).$uses$,
  additional_info = $info$Se recomienda tratamiento familiar simultáneo en caso de oxiuriasis; evitar en el primer trimestre de embarazo.$info$
WHERE product_id = 235;

UPDATE products SET
  description = $desc$Antiparasitario de amplio espectro (bencimidazol) en suspensión oral, de dosificación más práctica en niños.$desc$,
  possible_uses = $uses$Parasitosis intestinal (áscaris, oxiuros, tricocéfalos, anquilostomas).$uses$,
  additional_info = $info$Agitar bien antes de usar; se recomienda tratamiento familiar simultáneo en caso de oxiuriasis.$info$
WHERE product_id = 236;

UPDATE products SET
  description = $desc$Curitas (apósitos adhesivos) redondas para heridas menores.$desc$,
  possible_uses = $uses$Cobertura y protección de raspones, cortes pequeños o punciones.$uses$,
  additional_info = $info$Cambiar si se humedece o ensucia; no usar sobre heridas con signos de infección sin evaluación.$info$
WHERE product_id = 237;

UPDATE products SET
  description = $desc$Antidiabético oral combinado (metformina 500mg + glibenclamida 5mg), asocia biguanida y sulfonilurea.$desc$,
  possible_uses = $uses$Manejo de diabetes tipo 2 no controlada con monoterapia, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica; riesgo de hipoglucemia, tomar con alimentos.$info$
WHERE product_id = 238;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) de la familia oxicam, con acción preferentemente sobre COX-2.$desc$,
  possible_uses = $uses$Dolores musculares y articulares, procesos inflamatorios crónicos como artrosis.$uses$,
  additional_info = $info$Tomar con alimentos para reducir irritación gástrica; precaución en pacientes con enfermedad renal o cardiovascular.$info$
WHERE product_id = 239;

UPDATE products SET
  description = $desc$Ungüento tópico a base de alcanfor, mentol y eucaliptol, de aplicación en pecho y espalda.$desc$,
  possible_uses = $uses$Alivio de la congestión nasal y malestar por resfrío, dolores musculares leves.$uses$,
  additional_info = $info$Uso externo únicamente; no aplicar en fosas nasales, ojos ni mucosas, ni en niños menores de 2 años.$info$
WHERE product_id = 240;

UPDATE products SET
  description = $desc$Ungüento tópico a base de alcanfor, mentol y eucaliptol, presentación de mayor contenido.$desc$,
  possible_uses = $uses$Alivio de la congestión nasal y malestar por resfrío, dolores musculares leves.$uses$,
  additional_info = $info$Uso externo únicamente; no aplicar en fosas nasales, ojos ni mucosas, ni en niños menores de 2 años.$info$
WHERE product_id = 241;

UPDATE products SET
  description = $desc$Antiséptico tópico a base de mercurocromo, de aplicación cutánea.$desc$,
  possible_uses = $uses$Desinfección de heridas menores, cortes y raspones superficiales.$uses$,
  additional_info = $info$Uso externo únicamente; puede teñir la piel de un tono rojizo/anaranjado de forma temporal.$info$
WHERE product_id = 242;

UPDATE products SET
  description = $desc$Antiséptico tópico a base de mercurocromo, presentación en frasco de 10 ml.$desc$,
  possible_uses = $uses$Desinfección de heridas menores, cortes y raspones superficiales.$uses$,
  additional_info = $info$Uso externo únicamente; puede teñir la piel de un tono rojizo/anaranjado de forma temporal.$info$
WHERE product_id = 243;

UPDATE products SET
  description = $desc$Analgésico, antipirético y antiespasmódico (dipirona/metamizol sódico), en solución inyectable.$desc$,
  possible_uses = $uses$Dolor moderado a severo, fiebre alta que no responde a otros antipiréticos, cólicos.$uses$,
  additional_info = $info$Contraindicado en antecedentes de agranulocitosis; administrar lentamente por vía intravenosa para evitar hipotensión.$info$
WHERE product_id = 244;

UPDATE products SET
  description = $desc$Antidiabético oral biguanida, reduce la producción hepática de glucosa y mejora la sensibilidad a la insulina.$desc$,
  possible_uses = $uses$Manejo de diabetes tipo 2, bajo prescripción y control médico.$uses$,
  additional_info = $info$Requiere receta médica; tomar con alimentos para reducir malestar gastrointestinal.$info$
WHERE product_id = 245;

UPDATE products SET
  description = $desc$Antidiabético oral biguanida, reduce la producción hepática de glucosa y mejora la sensibilidad a la insulina.$desc$,
  possible_uses = $uses$Manejo de diabetes tipo 2, bajo prescripción y control médico.$uses$,
  additional_info = $info$Requiere receta médica; tomar con alimentos para reducir malestar gastrointestinal; contraindicado en insuficiencia renal severa.$info$
WHERE product_id = 246;

UPDATE products SET
  description = $desc$Antidiabético oral biguanida, reduce la producción hepática de glucosa y mejora la sensibilidad a la insulina.$desc$,
  possible_uses = $uses$Manejo de diabetes tipo 2, bajo prescripción y control médico.$uses$,
  additional_info = $info$Requiere receta médica. Tomar con alimentos para reducir malestar gastrointestinal. Contraindicado en insuficiencia renal severa.$info$
WHERE product_id = 247;

UPDATE products SET
  description = $desc$Antiemético y procinético, favorece el vaciamiento gástrico.$desc$,
  possible_uses = $uses$Náuseas, vómitos, reflujo gastroesofágico, sensación de plenitud gástrica.$uses$,
  additional_info = $info$Uso a corto plazo; puede producir efectos extrapiramidales, especialmente en niños y adultos mayores.$info$
WHERE product_id = 248;

UPDATE products SET
  description = $desc$Antiemético y procinético, en solución inyectable.$desc$,
  possible_uses = $uses$Náuseas y vómitos agudos, incluyendo los asociados a quimioterapia o postoperatorios.$uses$,
  additional_info = $info$Uso a corto plazo; puede producir efectos extrapiramidales, especialmente en niños y adultos mayores.$info$
WHERE product_id = 249;

UPDATE products SET
  description = $desc$Antiemético y procinético, en solución inyectable.$desc$,
  possible_uses = $uses$Náuseas y vómitos agudos.$uses$,
  additional_info = $info$Uso a corto plazo; puede producir efectos extrapiramidales, especialmente en niños y adultos mayores.$info$
WHERE product_id = 250;

UPDATE products SET
  description = $desc$Antiparasitario y antibacteriano de la familia de los nitroimidazoles, en suspensión oral.$desc$,
  possible_uses = $uses$Parasitosis intestinal (giardiasis, amebiasis), infecciones por anaerobios.$uses$,
  additional_info = $info$Evitar el consumo de alcohol durante el tratamiento y hasta 48 horas después; puede alterar el sabor de la boca.$info$
WHERE product_id = 251;

UPDATE products SET
  description = $desc$Antiparasitario y antibacteriano de la familia de los nitroimidazoles.$desc$,
  possible_uses = $uses$Parasitosis intestinal (giardiasis, amebiasis, tricomoniasis), infecciones por anaerobios.$uses$,
  additional_info = $info$Evitar el consumo de alcohol durante el tratamiento y hasta 48 horas después; puede alterar el sabor de la boca.$info$
WHERE product_id = 252;

UPDATE products SET
  description = $desc$Producto a base de propóleo de abeja, en presentación de gotas o pastillas, de venta en farmacia como suplemento natural.$desc$,
  possible_uses = $uses$Apoyo del sistema inmunológico, alivio de molestias leves de garganta.$uses$,
  additional_info = $info$No sustituye tratamiento médico; conservar en lugar fresco y seco.$info$
WHERE product_id = 253;

UPDATE products SET
  description = $desc$Producto a base de propóleo de abeja formulado para niños, en presentación de gotas o pastillas.$desc$,
  possible_uses = $uses$Apoyo del sistema inmunológico infantil, alivio de molestias leves de garganta.$uses$,
  additional_info = $info$Respetar la dosis según edad indicada en el empaque; no sustituye tratamiento médico.$info$
WHERE product_id = 254;

UPDATE products SET
  description = $desc$Cinta adhesiva hipoalergénica de papel (micropore), para fijación sobre la piel.$desc$,
  possible_uses = $uses$Fijación de gasas, apósitos o vendajes; fijación de catéteres o sondas.$uses$,
  additional_info = $info$Adecuada para pieles sensibles; retirar con cuidado para evitar irritación.$info$
WHERE product_id = 255;

UPDATE products SET
  description = $desc$Jarabe natural a base de miel de abeja y eucalipto, de uso tradicional para malestares de garganta.$desc$,
  possible_uses = $uses$Alivio de la tos y la irritación de garganta asociadas al resfrío.$uses$,
  additional_info = $info$No reemplaza tratamiento médico en cuadros persistentes; no administrar en menores de 1 año por riesgo de botulismo infantil asociado a la miel.$info$
WHERE product_id = 256;

UPDATE products SET
  description = $desc$Antimigrañoso combinado a base de paracetamol 650mg, cafeína 100mg y ergotamina 1mg.$desc$,
  possible_uses = $uses$Migraña con o sin aura, cefalea vascular, cefalea en racimos.$uses$,
  additional_info = $info$Requiere receta médica; no exceder la dosis indicada por riesgo de ergotismo, evitar en hipertensión no controlada o enfermedad vascular.$info$
WHERE product_id = 257;

UPDATE products SET
  description = $desc$Mordedor de silicona o plástico para bebés en etapa de dentición.$desc$,
  possible_uses = $uses$Alivio de molestias por la erupción dental en bebés.$uses$,
  additional_info = $info$Lavar y desinfectar antes del primer uso y regularmente; revisar que no presente daños antes de cada uso.$info$
WHERE product_id = 258;

UPDATE products SET
  description = $desc$Antiparasitario a base de mebendazol 500mg, dosis única.$desc$,
  possible_uses = $uses$Tratamiento de parasitosis intestinal (áscaris, oxiuros, tricocéfalos, anquilostomas).$uses$,
  additional_info = $info$Se recomienda tratamiento familiar simultáneo en caso de oxiuriasis. Evitar en el primer trimestre de embarazo.$info$
WHERE product_id = 259;

UPDATE products SET
  description = $desc$Mucolítico a base de N-acetilcisteína 600mg, en sobre para disolver.$desc$,
  possible_uses = $uses$Fluidificación de secreciones respiratorias en procesos catarrales o bronquiales.$uses$,
  additional_info = $info$Disolver en agua antes de tomar; precaución en pacientes asmáticos por posible broncoespasmo.$info$
WHERE product_id = 260;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) derivado del ácido propiónico, de acción prolongada.$desc$,
  possible_uses = $uses$Dolor musculoesquelético, dolor menstrual, cefalea, procesos inflamatorios.$uses$,
  additional_info = $info$Tomar con alimentos para reducir irritación gástrica; evitar en úlcera péptica activa o insuficiencia renal severa.$info$
WHERE product_id = 261;

UPDATE products SET
  description = $desc$Antigripal descongestionante y antihistamínico combinado (pseudoefedrina 60mg + clorfenamina 4mg).$desc$,
  possible_uses = $uses$Congestión nasal, rinitis alérgica, sinusitis, síntomas de resfrío.$uses$,
  additional_info = $info$Precaución en hipertensos por la pseudoefedrina; puede causar somnolencia por el componente antihistamínico.$info$
WHERE product_id = 262;

UPDATE products SET
  description = $desc$Crema regeneradora a base de óxido de zinc, aloe vera y vitaminas A y D, para el cuidado de la piel del bebé.$desc$,
  possible_uses = $uses$Prevención y tratamiento de la dermatitis del pañal (escaldaduras).$uses$,
  additional_info = $info$Aplicar en cada cambio de pañal sobre piel limpia y seca; suspender si aparece irritación.$info$
WHERE product_id = 263;

UPDATE products SET
  description = $desc$Antibiótico tópico combinado (neomicina + bacitracina), de amplio espectro.$desc$,
  possible_uses = $uses$Prevención y tratamiento de infecciones bacterianas en heridas superficiales, cortes y quemaduras menores.$uses$,
  additional_info = $info$Uso externo; suspender si aparecen signos de sensibilización o alergia local.$info$
WHERE product_id = 264;

UPDATE products SET
  description = $desc$Suplemento vitamínico-mineral (glicerofosfato de calcio, vitaminas del complejo B), tónico neurotrópico.$desc$,
  possible_uses = $uses$Apoyo en estados de fatiga, astenia, decaimiento y dificultad de concentración.$uses$,
  additional_info = $info$No sustituye tratamiento médico en cuadros neurológicos persistentes; seguir la dosis indicada en el empaque.$info$
WHERE product_id = 265;

UPDATE products SET
  description = $desc$Crema tópica antifúngica y protectora (nistatina + óxido de zinc + vitaminas A y D).$desc$,
  possible_uses = $uses$Dermatitis del pañal (escaldaduras) con o sin sobreinfección por Candida.$uses$,
  additional_info = $info$No usar en pacientes con hipersensibilidad a la nistatina o al óxido de zinc.$info$
WHERE product_id = 266;

UPDATE products SET
  description = $desc$Antifúngico tópico o de uso local, activo frente a especies de Candida.$desc$,
  possible_uses = $uses$Candidiasis oral, cutánea o vaginal, según presentación.$uses$,
  additional_info = $info$No se absorbe de forma significativa por vía oral; completar el tiempo de tratamiento indicado aunque los síntomas mejoren.$info$
WHERE product_id = 267;

UPDATE products SET
  description = $desc$Producto tópico para el cuidado de la piel con problemas de acné, de venta en farmacia.$desc$,
  possible_uses = $uses$Ayuda en el tratamiento local de granos y afecciones leves de la piel asociadas al acné.$uses$,
  additional_info = $info$Uso externo; aplicar según indicación del empaque y suspender si hay irritación excesiva.$info$
WHERE product_id = 268;

UPDATE products SET
  description = $desc$Anticonceptivo hormonal inyectable mensual, combinación de enantato de noretisterona 50mg y valerato de estradiol 5mg.$desc$,
  possible_uses = $uses$Anticoncepción mensual por vía intramuscular, bajo indicación médica.$uses$,
  additional_info = $info$Debe aplicarse cada 30 días aproximadamente por personal de salud; puede alterar el patrón de sangrado menstrual.$info$
WHERE product_id = 269;

UPDATE products SET
  description = $desc$Toalla higiénica femenina desechable con tratamiento antibacterial.$desc$,
  possible_uses = $uses$Protección e higiene durante el periodo menstrual.$uses$,
  additional_info = $info$Cambiar cada 4-6 horas aproximadamente para mantener una adecuada higiene.$info$
WHERE product_id = 270;

UPDATE products SET
  description = $desc$Toalla higiénica femenina desechable, línea con materiales de origen natural/algodón.$desc$,
  possible_uses = $uses$Protección e higiene durante el periodo menstrual.$uses$,
  additional_info = $info$Cambiar cada 4-6 horas aproximadamente para mantener una adecuada higiene.$info$
WHERE product_id = 271;

UPDATE products SET
  description = $desc$Protector diario femenino con núcleo absorbente tipo gel.$desc$,
  possible_uses = $uses$Higiene íntima diaria fuera del periodo menstrual.$uses$,
  additional_info = $info$Cambiar al menos una vez al día; no reemplaza la toalla higiénica durante la menstruación.$info$
WHERE product_id = 272;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio combinado (diclofenaco + paracetamol), en cápsulas.$desc$,
  possible_uses = $uses$Dolor moderado, procesos inflamatorios musculoesqueléticos.$uses$,
  additional_info = $info$Uso a corto plazo por riesgo gastrointestinal; requiere receta médica.$info$
WHERE product_id = 273;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio combinado (diclofenaco gastrorresistente 75mg + paracetamol 500mg), en cápsula.$desc$,
  possible_uses = $uses$Dolor moderado a severo de origen musculoesquelético o postraumático.$uses$,
  additional_info = $info$Uso a corto plazo por riesgo gastrointestinal; requiere receta médica.$info$
WHERE product_id = 274;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio combinado (diclofenaco + paracetamol), en comprimidos recubiertos de mayor concentración.$desc$,
  possible_uses = $uses$Dolor moderado a severo, procesos inflamatorios musculoesqueléticos.$uses$,
  additional_info = $info$Uso a corto plazo por riesgo gastrointestinal; requiere receta médica.$info$
WHERE product_id = 275;

UPDATE products SET
  description = $desc$Hilo de sutura monofilamento no absorbible, calibre 2-0.$desc$,
  possible_uses = $uses$Sutura de piel en heridas o procedimientos quirúrgicos menores.$uses$,
  additional_info = $info$Requiere retiro de puntos tras cicatrización (según indicación médica, usualmente 7-14 días).$info$
WHERE product_id = 276;

UPDATE products SET
  description = $desc$Hilo de sutura monofilamento no absorbible, calibre 3/0.$desc$,
  possible_uses = $uses$Sutura de piel en heridas o procedimientos quirúrgicos menores, zonas de menor tensión.$uses$,
  additional_info = $info$Requiere retiro de puntos tras cicatrización (según indicación médica, usualmente 7-14 días).$info$
WHERE product_id = 277;

UPDATE products SET
  description = $desc$Hilo de sutura monofilamento no absorbible, calibre 3-0, de color negro para mejor visibilidad.$desc$,
  possible_uses = $uses$Sutura de piel en heridas o procedimientos quirúrgicos menores.$uses$,
  additional_info = $info$Requiere retiro de puntos tras cicatrización (según indicación médica, usualmente 7-14 días).$info$
WHERE product_id = 278;

UPDATE products SET
  description = $desc$Antibiótico oftálmico tópico, disponible en gotas (neomicina + nafazolina) o pomada (oxitetraciclina + polimixina B) según presentación.$desc$,
  possible_uses = $uses$Infecciones oculares bacterianas leves, conjuntivitis.$uses$,
  additional_info = $info$No usar por más días de los indicados sin evaluación médica; descartar el frasco tras el periodo de uso recomendado.$info$
WHERE product_id = 279;

UPDATE products SET
  description = $desc$Suplemento nutricional a base de ácidos grasos omega-3 (aceite de pescado).$desc$,
  possible_uses = $uses$Apoyo cardiovascular y cognitivo, como complemento de la dieta.$uses$,
  additional_info = $info$No sustituye tratamiento médico; precaución en pacientes con tratamiento anticoagulante.$info$
WHERE product_id = 280;

UPDATE products SET
  description = $desc$Inhibidor de la bomba de protones (IBP), reduce la producción de ácido gástrico.$desc$,
  possible_uses = $uses$Gastritis, reflujo gastroesofágico, úlcera péptica, protección gástrica durante tratamiento con AINEs.$uses$,
  additional_info = $info$Tomar en ayunas, 30 minutos antes del desayuno, para mejor eficacia. Uso prolongado sin supervisión puede afectar absorción de vitamina B12 y magnesio.$info$
WHERE product_id = 281;

UPDATE products SET
  description = $desc$Tratamiento para la disfunción eréctil a base de sildenafil 100mg, en gel de aplicación oral por sobre.$desc$,
  possible_uses = $uses$Disfunción eréctil masculina.$uses$,
  additional_info = $info$Requiere receta médica; contraindicado con nitratos y en pacientes con enfermedad cardiovascular no controlada.$info$
WHERE product_id = 282;

UPDATE products SET
  description = $desc$Antimicrobiano vaginal combinado (clotrimazol + metronidazol + lactobacilos), en tabletas vaginales.$desc$,
  possible_uses = $uses$Infecciones vaginales mixtas (candidiasis, tricomoniasis, vaginosis bacteriana).$uses$,
  additional_info = $info$Aplicar por vía vaginal según indicación; evitar relaciones sexuales durante el tratamiento.$info$
WHERE product_id = 283;

UPDATE products SET
  description = $desc$Óxido de zinc tópico, con acción protectora y astringente sobre la piel.$desc$,
  possible_uses = $uses$Prevención y tratamiento de la dermatitis del pañal, protección de la piel irritada.$uses$,
  additional_info = $info$Uso externo únicamente; aplicar en capa fina sobre piel limpia y seca.$info$
WHERE product_id = 284;

UPDATE products SET
  description = $desc$Hormona uterotónica (oxitocina sintética), en solución inyectable.$desc$,
  possible_uses = $uses$Inducción y conducción del trabajo de parto, control de la hemorragia posparto, bajo estricta indicación y supervisión médica.$uses$,
  additional_info = $info$Uso hospitalario, requiere monitoreo de la contracción uterina y frecuencia cardiaca fetal; no está indicada para el dolor menstrual.$info$
WHERE product_id = 285;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio combinado (paracetamol 500mg + diclofenaco sódico 50mg), en tabletas recubiertas.$desc$,
  possible_uses = $uses$Dolor moderado a severo, procesos inflamatorios musculoesqueléticos.$uses$,
  additional_info = $info$Uso a corto plazo por riesgo gastrointestinal y renal; requiere receta médica.$info$
WHERE product_id = 286;

UPDATE products SET
  description = $desc$Inhibidor de la bomba de protones (esomeprazol), reduce la producción de ácido gástrico.$desc$,
  possible_uses = $uses$Gastritis, reflujo gastroesofágico, úlcera péptica.$uses$,
  additional_info = $info$Tomar en ayunas para mejor eficacia; uso prolongado sin supervisión puede afectar la absorción de vitamina B12 y magnesio.$info$
WHERE product_id = 287;

UPDATE products SET
  description = $desc$Inhibidor de la bomba de protones a base de esomeprazol 20mg, en cápsulas con microgránulos gastrorresistentes.$desc$,
  possible_uses = $uses$Gastritis, reflujo gastroesofágico, úlcera péptica.$uses$,
  additional_info = $info$Tomar en ayunas para mejor eficacia; uso prolongado sin supervisión puede afectar la absorción de vitamina B12 y magnesio.$info$
WHERE product_id = 288;

UPDATE products SET
  description = $desc$Pañal desechable para adultos con incontinencia.$desc$,
  possible_uses = $uses$Manejo de la incontinencia urinaria o fecal en adultos.$uses$,
  additional_info = $info$Elegir talla según contorno de cintura/cadera indicado en el empaque; cambiar con regularidad para evitar irritación.$info$
WHERE product_id = 289;

UPDATE products SET
  description = $desc$Pañal desechable para bebé, talla XG (extra grande).$desc$,
  possible_uses = $uses$Higiene y cuidado en bebés de mayor peso o edad.$uses$,
  additional_info = $info$Verificar el rango de peso indicado en el empaque antes de la compra.$info$
WHERE product_id = 290;

UPDATE products SET
  description = $desc$Preservativo masculino de látex natural, lubricado, con aroma y sabor a cereza.$desc$,
  possible_uses = $uses$Anticoncepción de barrera y prevención de infecciones de transmisión sexual (ITS).$uses$,
  additional_info = $info$Verificar fecha de vencimiento antes de usar; almacenar lejos de calor y luz directa.$info$
WHERE product_id = 291;

UPDATE products SET
  description = $desc$Preservativo masculino de látex natural, lubricado, con aroma y sabor a chocolate.$desc$,
  possible_uses = $uses$Anticoncepción de barrera y prevención de infecciones de transmisión sexual (ITS).$uses$,
  additional_info = $info$Verificar fecha de vencimiento antes de usar; almacenar lejos de calor y luz directa.$info$
WHERE product_id = 292;

UPDATE products SET
  description = $desc$Preservativo masculino de látex natural, lubricado, línea clásica transparente.$desc$,
  possible_uses = $uses$Anticoncepción de barrera y prevención de infecciones de transmisión sexual (ITS).$uses$,
  additional_info = $info$Verificar fecha de vencimiento antes de usar; almacenar lejos de calor y luz directa.$info$
WHERE product_id = 293;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol, en gotas de uso pediátrico.$desc$,
  possible_uses = $uses$Fiebre y dolor leve a moderado en lactantes y niños pequeños.$uses$,
  additional_info = $info$Dosificar según peso del niño con el gotero incluido; no combinar con otros productos que contengan paracetamol.$info$
WHERE product_id = 294;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol, en gotas de uso pediátrico de alta concentración.$desc$,
  possible_uses = $uses$Fiebre y dolor leve a moderado en lactantes y niños pequeños.$uses$,
  additional_info = $info$Dosificar según peso del niño con el gotero incluido; no combinar con otros productos que contengan paracetamol.$info$
WHERE product_id = 295;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol, en suspensión oral pediátrica.$desc$,
  possible_uses = $uses$Fiebre y dolor leve a moderado en niños.$uses$,
  additional_info = $info$Agitar bien antes de usar; dosificar según peso con el vaso o jeringa dosificadora incluida.$info$
WHERE product_id = 296;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol, en jarabe de uso pediátrico.$desc$,
  possible_uses = $uses$Fiebre y dolor leve a moderado en niños.$uses$,
  additional_info = $info$Dosificar según peso con el vaso o jeringa dosificadora incluida; no combinar con otros productos que contengan paracetamol.$info$
WHERE product_id = 297;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol, en tabletas de 1 gramo.$desc$,
  possible_uses = $uses$Dolor leve a moderado y fiebre en adultos.$uses$,
  additional_info = $info$No exceder los 4 gramos diarios ni combinar con otros productos que contengan paracetamol por riesgo de daño hepático.$info$
WHERE product_id = 298;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol.$desc$,
  possible_uses = $uses$Dolor leve a moderado y fiebre.$uses$,
  additional_info = $info$No combinar con otros productos que contengan paracetamol por riesgo de sobredosis hepática.$info$
WHERE product_id = 299;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol (acetaminofén), indicado para el alivio del dolor leve a moderado y la fiebre.$desc$,
  possible_uses = $uses$Dolor de cabeza, dolor muscular, dolor dental, fiebre, malestar general por resfrío o gripe.$uses$,
  additional_info = $info$No combinar con otros productos que contengan paracetamol (riesgo de sobredosis hepática). Precaución en pacientes con enfermedad hepática o consumo crónico de alcohol.$info$
WHERE product_id = 300;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol 500mg, producido por el laboratorio boliviano SAE.$desc$,
  possible_uses = $uses$Dolor de cabeza, dolor muscular, dolor dental, fiebre, malestar general por resfrío o gripe.$uses$,
  additional_info = $info$No combinar con otros productos que contengan paracetamol; precaución en pacientes con enfermedad hepática.$info$
WHERE product_id = 301;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol.$desc$,
  possible_uses = $uses$Dolor leve a moderado y fiebre.$uses$,
  additional_info = $info$No combinar con otros productos que contengan paracetamol por riesgo de sobredosis hepática.$info$
WHERE product_id = 302;

UPDATE products SET
  description = $desc$Parche térmico y tópico para el dolor muscular, a base de alcanfor, mentol y/o árnica.$desc$,
  possible_uses = $uses$Dolor muscular, contracturas, dolor de espalda, cuello y articulaciones.$uses$,
  additional_info = $info$Aplicar sobre piel limpia y seca, hasta un máximo de 24 horas continuas; no usar sobre piel lesionada.$info$
WHERE product_id = 303;
UPDATE products SET
  description = $desc$Parche transdérmico analgésico de uso tópico, a base de mentol, alcanfor y aceites esenciales tipo "tigre", con efecto de calor y frío local.$desc$,
  possible_uses = $uses$Dolores musculares, contracturas, dolores articulares leves.$uses$,
  additional_info = $info$Uso externo únicamente; evitar contacto con mucosas y piel lesionada.$info$
WHERE product_id = 304;

UPDATE products SET
  description = $desc$Pañal desechable para bebé/adulto según presentación.$desc$,
  possible_uses = $uses$Higiene y cuidado en incontinencia infantil o de adultos.$uses$,
  additional_info = $info$Elegir talla según peso indicado en el empaque.$info$
WHERE product_id = 305;

UPDATE products SET
  description = $desc$Pomada tópica antiescaldante a base de óxido de zinc, extracto de manzanilla y talco, en base de vaselina.$desc$,
  possible_uses = $uses$Prevención y alivio de la dermatitis del pañal (escaldaduras) en bebés, protección de la piel irritada.$uses$,
  additional_info = $info$Aplicar en cada cambio de pañal sobre piel limpia y seca; uso externo únicamente.$info$
WHERE product_id = 306;

UPDATE products SET
  description = $desc$Antibiótico betalactámico inyectable, combinación de penicilina G benzatínica, procaínica y potásica/cristalina (formulación "12.6.6": 1.200.000 + 600.000 + 600.000 UI aproximadamente).$desc$,
  possible_uses = $uses$Infecciones bacterianas sensibles a penicilina (faringoamigdalitis estreptocócica, sífilis, profilaxis de fiebre reumática), bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica y administración por personal capacitado (vía intramuscular). Contraindicado en alergia a penicilinas.$info$
WHERE product_id = 307;

UPDATE products SET
  description = $desc$Antibiótico betalactámico inyectable, combinación de penicilina G benzatínica, procaínica y potásica/cristalina en dosis menor (formulación "6.3.3": 600.000 + 300.000 + 300.000 UI aproximadamente).$desc$,
  possible_uses = $uses$Infecciones bacterianas sensibles a penicilina, especialmente en pacientes de menor peso, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica y administración por personal capacitado (vía intramuscular). Contraindicado en alergia a penicilinas.$info$
WHERE product_id = 308;

UPDATE products SET
  description = $desc$Laxante estimulante a base de picosulfato sódico, en cápsulas.$desc$,
  possible_uses = $uses$Estreñimiento ocasional, preparación intestinal previa a estudios o procedimientos médicos.$uses$,
  additional_info = $info$Actúa entre 6 y 12 horas después de su administración; no usar de forma prolongada sin indicación médica.$info$
WHERE product_id = 309;

UPDATE products SET
  description = $desc$Antiinflamatorio de uso oral en presentación de suspensión.$desc$,
  possible_uses = $uses$Alivio de dolor e inflamación leve a moderada.$uses$,
  additional_info = $info$Seguir la dosificación indicada en el empaque o por el profesional de salud; agitar bien antes de usar.$info$
WHERE product_id = 310;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (piroxicam) combinado con piridoxina (vitamina B6), en tabletas.$desc$,
  possible_uses = $uses$Dolor e inflamación en procesos musculoesqueléticos, artritis, artrosis.$uses$,
  additional_info = $info$La piridoxina se incluye para reducir efectos adversos gastrointestinales del piroxicam; tomar con alimentos. Evitar en úlcera péptica activa.$info$
WHERE product_id = 311;

UPDATE products SET
  description = $desc$Solución oftálmica antibiótica combinada, de uso tópico ocular, en gotas.$desc$,
  possible_uses = $uses$Infecciones bacterianas oculares leves (conjuntivitis bacteriana).$uses$,
  additional_info = $info$Uso exclusivamente oftálmico; no compartir el frasco entre distintos pacientes para evitar contaminación.$info$
WHERE product_id = 312;

UPDATE products SET
  description = $desc$Pomada tópica de uso tradicional para molestias musculares y de la piel.$desc$,
  possible_uses = $uses$Alivio de golpes, dolores musculares leves, molestias cutáneas menores.$uses$,
  additional_info = $info$Uso externo únicamente; suspender en caso de irritación de la piel.$info$
WHERE product_id = 313;

UPDATE products SET
  description = $desc$Mamadera (biberón) para bebé, con capacidad de 9 onzas.$desc$,
  possible_uses = $uses$Alimentación de lactantes con leche materna extraída o fórmula.$uses$,
  additional_info = $info$Esterilizar antes del primer uso y lavar después de cada uso.$info$
WHERE product_id = 314;

UPDATE products SET
  description = $desc$Corticosteroide sistémico (glucocorticoide) de uso oral.$desc$,
  possible_uses = $uses$Enfermedades inflamatorias, autoinmunes y renales, alergias severas, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica; no suspender bruscamente tras uso prolongado (riesgo de insuficiencia suprarrenal). Contraindicado en infecciones sistémicas no tratadas.$info$
WHERE product_id = 315;

UPDATE products SET
  description = $desc$Anticonvulsivante análogo del GABA, con acción sobre el dolor neuropático.$desc$,
  possible_uses = $uses$Dolor neuropático, fibromialgia, dolor reumático crónico, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica (medicamento de control). Puede causar somnolencia y mareo; evitar conducir hasta conocer la tolerancia individual.$info$
WHERE product_id = 316;

UPDATE products SET
  description = $desc$Anticonvulsivante análogo del GABA, con acción sobre el dolor neuropático, en presentación de mayor concentración.$desc$,
  possible_uses = $uses$Dolor neuropático, fibromialgia, ansiedad generalizada, bajo prescripción médica.$uses$,
  additional_info = $info$Requiere receta médica (medicamento de control). Ajuste de dosis gradual bajo supervisión profesional.$info$
WHERE product_id = 317;

UPDATE products SET
  description = $desc$Inhibidor de la fosfodiesterasa tipo 5 (sildenafilo), en tabletas de 50mg.$desc$,
  possible_uses = $uses$Tratamiento de la disfunción eréctil masculina.$uses$,
  additional_info = $info$Requiere receta médica. Contraindicado con nitratos (riesgo de hipotensión severa) y en pacientes con enfermedad cardiovascular no controlada.$info$
WHERE product_id = 318;

UPDATE products SET
  description = $desc$Producto cosmético removedor de esmalte de uñas.$desc$,
  possible_uses = $uses$Eliminación de esmalte de uñas.$uses$,
  additional_info = $info$Uso externo; evitar contacto prolongado con la piel y mantener lejos del fuego (producto inflamable).$info$
WHERE product_id = 319;

UPDATE products SET
  description = $desc$Insecticida en aerosol de uso doméstico, marca Raid.$desc$,
  possible_uses = $uses$Control y eliminación de insectos domésticos (moscas, mosquitos, cucarachas, hormigas, según presentación).$uses$,
  additional_info = $info$Uso exclusivamente ambiental; ventilar el área tratada y evitar contacto con alimentos y superficies de cocina.$info$
WHERE product_id = 320;

UPDATE products SET
  description = $desc$Antagonista de los receptores H2 (ranitidina), inyectable, que reduce la secreción de ácido gástrico.$desc$,
  possible_uses = $uses$Reflujo gastroesofágico, úlcera péptica, gastritis, tratamiento hospitalario de hemorragia digestiva alta.$uses$,
  additional_info = $info$Administración por personal de salud (vía intramuscular o intravenosa). Requiere receta médica.$info$
WHERE product_id = 321;

UPDATE products SET
  description = $desc$Antigripal combinado en sobre (paracetamol, pseudoefedrina y vitamina C), formulado para uso diurno sin componentes sedantes.$desc$,
  possible_uses = $uses$Síntomas de resfrío durante el día: congestión nasal, fiebre, malestar general.$uses$,
  additional_info = $info$Versión "día" sin antihistamínico sedante; existe versión "noche" con clorfenamina (ver ítem correspondiente).$info$
WHERE product_id = 322;

UPDATE products SET
  description = $desc$Antigripal combinado en sobre (paracetamol, pseudoefedrina, vitamina C y clorfenamina), formulado para uso nocturno.$desc$,
  possible_uses = $uses$Síntomas de resfrío nocturnos, incluyendo dificultad para descansar por congestión.$uses$,
  additional_info = $info$Contiene antihistamínico sedante (clorfenamina); evitar conducir o usar maquinaria tras su consumo.$info$
WHERE product_id = 323;

UPDATE products SET
  description = $desc$Antigripal pediátrico en gotas, sabor tutifruti, formulado para niños.$desc$,
  possible_uses = $uses$Síntomas de resfrío en niños: congestión nasal, fiebre, malestar general.$uses$,
  additional_info = $info$Dosificar según peso/edad indicado en el prospecto; no exceder la dosis diaria recomendada.$info$
WHERE product_id = 324;

UPDATE products SET
  description = $desc$Relajante muscular combinado (carisoprodol 200mg, ácido acetilsalicílico 160mg y cafeína), en tabletas.$desc$,
  possible_uses = $uses$Contracturas y espasmos musculares, dolor muscular agudo, lumbago, tortícolis.$uses$,
  additional_info = $info$Tratamiento no debe exceder 7 días consecutivos. Contraindicado en úlcera péptica activa, asma, trastornos de coagulación y menores de 12 años.$info$
WHERE product_id = 325;

UPDATE products SET
  description = $desc$Repelente de insectos de uso tópico o ambiental.$desc$,
  possible_uses = $uses$Prevención de picaduras de mosquitos y otros insectos.$uses$,
  additional_info = $info$Seguir las instrucciones de aplicación del envase; evitar contacto con ojos y mucosas.$info$
WHERE product_id = 326;

UPDATE products SET
  description = $desc$Repelente de insectos de uso tópico, marca Floresta.$desc$,
  possible_uses = $uses$Prevención de picaduras de mosquitos y otros insectos, especialmente en actividades al aire libre.$uses$,
  additional_info = $info$Reaplicar según indicaciones del envase; evitar contacto con ojos y mucosas.$info$
WHERE product_id = 327;

UPDATE products SET
  description = $desc$Analgésico efervescente combinado (ácido acetilsalicílico 480mg y cafeína 50mg), con efecto antiácido asociado.$desc$,
  possible_uses = $uses$Dolor de cabeza y malestar general asociado a resaca o consumo excesivo de alcohol.$uses$,
  additional_info = $info$Contiene ácido acetilsalicílico; evitar en úlcera péptica, alergia a salicilatos o trastornos de coagulación.$info$
WHERE product_id = 328;

UPDATE products SET
  description = $desc$Antigripal combinado (paracetamol, pseudoefedrina y bromhexina), en tabletas.$desc$,
  possible_uses = $uses$Síntomas de resfrío y gripe: congestión nasal, tos con flema, dolor de cabeza, fiebre.$uses$,
  additional_info = $info$Precaución en hipertensos por la pseudoefedrina; no combinar con otros productos que contengan paracetamol.$info$
WHERE product_id = 329;

UPDATE products SET
  description = $desc$Antigripal combinado en sobre (paracetamol, pseudoefedrina y vitamina C), formulado para uso diurno sin componentes sedantes.$desc$,
  possible_uses = $uses$Síntomas de resfrío durante el día: congestión nasal, fiebre, malestar general.$uses$,
  additional_info = $info$Versión "día" sin antihistamínico sedante; existe versión "noche" con clorfenamina (ver ítem correspondiente).$info$
WHERE product_id = 330;

UPDATE products SET
  description = $desc$Antigripal combinado en sobre (paracetamol, pseudoefedrina, vitamina C y clorfenamina), formulado para uso nocturno.$desc$,
  possible_uses = $uses$Síntomas de resfrío nocturnos, incluyendo dificultad para descansar por congestión.$uses$,
  additional_info = $info$Contiene antihistamínico sedante (clorfenamina); evitar conducir o usar maquinaria tras su consumo.$info$
WHERE product_id = 331;

UPDATE products SET
  description = $desc$Antigripal de uso oral para el alivio de síntomas de resfrío.$desc$,
  possible_uses = $uses$Congestión nasal, fiebre, malestar general por resfrío o gripe.$uses$,
  additional_info = $info$Seguir la dosis indicada en el empaque según la edad del paciente.$info$
WHERE product_id = 332;

UPDATE products SET
  description = $desc$Producto de uso tópico u oral (según presentación) indicado para molestias reumáticas y articulares.$desc$,
  possible_uses = $uses$Dolores reumáticos, artritis, molestias musculoesqueléticas.$uses$,
  additional_info = $info$Seguir las indicaciones de uso del empaque; en caso de duda sobre la vía de administración, consultar al farmacéutico.$info$
WHERE product_id = 333;

UPDATE products SET
  description = $desc$Producto a base de aceites esenciales (mentol, pineno, borneol, cineol, entre otros) que favorece el flujo biliar.$desc$,
  possible_uses = $uses$Coadyuvante en molestias de la vesícula biliar, disquinesia biliar, favorecer la eliminación de cálculos biliares pequeños.$uses$,
  additional_info = $info$Uso bajo indicación médica; no reemplaza tratamiento quirúrgico en casos de litiasis biliar complicada.$info$
WHERE product_id = 334;

UPDATE products SET
  description = $desc$Sal inglesa (sulfato de magnesio) de uso oral o externo.$desc$,
  possible_uses = $uses$Estreñimiento ocasional (efecto laxante osmótico), baños de pies para desinflamar.$uses$,
  additional_info = $info$Uso oral prolongado no recomendado sin indicación médica; puede causar deshidratación o desequilibrio electrolítico.$info$
WHERE product_id = 335;

UPDATE products SET
  description = $desc$Broncodilatador agonista beta-2 adrenérgico de acción corta (salbutamol), en inhalador (spray).$desc$,
  possible_uses = $uses$Alivio rápido de crisis de broncoespasmo en asma y EPOC.$uses$,
  additional_info = $info$De uso "de rescate", no como tratamiento de mantenimiento único; agitar el inhalador antes de cada uso.$info$
WHERE product_id = 336;

UPDATE products SET
  description = $desc$Sales de rehidratación oral en polvo, a base de cloruro de sodio, cloruro de potasio y citrato de sodio.$desc$,
  possible_uses = $uses$Prevención y tratamiento de la deshidratación por diarrea aguda o vómitos.$uses$,
  additional_info = $info$Disolver en la cantidad de agua indicada en el sobre; no hervir la solución ya preparada.$info$
WHERE product_id = 337;

UPDATE products SET
  description = $desc$Antigripal combinado (paracetamol, noscapina, cafeína, vitamina C) en gel oral/cápsulas blandas.$desc$,
  possible_uses = $uses$Fiebre, tos, congestión nasal, malestar general por resfrío.$uses$,
  additional_info = $info$Existen versiones diferenciadas "día" (sin sedantes) y "noche" (con clorfenamina); ver ítems relacionados de Sanatusin gel día y noche.$info$
WHERE product_id = 338;

UPDATE products SET
  description = $desc$Versión diurna de Sanatusin gel, sin antihistamínico sedante.$desc$,
  possible_uses = $uses$Síntomas de resfrío durante el día sin causar somnolencia.$uses$,
  additional_info = $info$Contiene paracetamol, dextrometorfano/fenilefrina, cafeína y vitamina C según presentación.$info$
WHERE product_id = 339;

UPDATE products SET
  description = $desc$Versión nocturna de Sanatusin gel, con clorfenamina para facilitar el descanso.$desc$,
  possible_uses = $uses$Síntomas de resfrío nocturnos, incluyendo dificultad para dormir por congestión.$uses$,
  additional_info = $info$Contiene antihistamínico sedante (clorfenamina); evitar conducir o el uso de maquinaria tras su consumo.$info$
WHERE product_id = 340;

UPDATE products SET
  description = $desc$Hilo de sutura de seda trenzada no absorbible, calibre 4-0.$desc$,
  possible_uses = $uses$Sutura de piel y tejidos en heridas o procedimientos quirúrgicos.$uses$,
  additional_info = $info$Requiere retiro de puntos tras cicatrización, según indicación médica.$info$
WHERE product_id = 341;

UPDATE products SET
  description = $desc$Hilo de sutura de seda trenzada no absorbible, calibre 5-0.$desc$,
  possible_uses = $uses$Sutura de piel en heridas o procedimientos quirúrgicos menores, especialmente en zonas de mayor delicadeza.$uses$,
  additional_info = $info$Requiere retiro de puntos tras cicatrización, según indicación médica.$info$
WHERE product_id = 342;

UPDATE products SET
  description = $desc$Anticonceptivo oral combinado (etinilestradiol 0.035mg + acetato de ciproterona 2mg), con efecto antiandrogénico.$desc$,
  possible_uses = $uses$Anticoncepción hormonal, tratamiento del acné moderado a severo y del hirsutismo en mujeres.$uses$,
  additional_info = $info$Requiere receta médica. Contraindicado en fumadoras mayores de 35 años y en antecedentes de trombosis; no protege contra infecciones de transmisión sexual.$info$
WHERE product_id = 343;

UPDATE products SET
  description = $desc$Champú suave de uso cosmético formulado para bebés.$desc$,
  possible_uses = $uses$Higiene capilar y del cuero cabelludo en bebés.$uses$,
  additional_info = $info$Fórmula de baja irritación ocular (según presentación); evitar contacto directo con los ojos.$info$
WHERE product_id = 344;

UPDATE products SET
  description = $desc$Champú suave para bebés de la marca Johnson's.$desc$,
  possible_uses = $uses$Higiene capilar y del cuero cabelludo en bebés.$uses$,
  additional_info = $info$Fórmula "sin más lágrimas"; evitar contacto directo con los ojos.$info$
WHERE product_id = 345;

UPDATE products SET
  description = $desc$Solución fisiológica estéril de cloruro de sodio al 0.9%.$desc$,
  possible_uses = $uses$Limpieza e hidratación nasal, lavado de heridas, irrigación ocular.$uses$,
  additional_info = $info$Uso externo; desechar el envase transcurrido el periodo indicado una vez abierto.$info$
WHERE product_id = 346;

UPDATE products SET
  description = $desc$Antidiarreico combinado (sulfaguanidina, carbón vegetal activado y subnitrato de bismuto), en tabletas.$desc$,
  possible_uses = $uses$Diarrea aguda, dispepsia con gases, coadyuvante en trastornos gastrointestinales leves.$uses$,
  additional_info = $info$No usar de forma prolongada sin evaluación médica si la diarrea persiste o hay fiebre alta.$info$
WHERE product_id = 347;

UPDATE products SET
  description = $desc$Polvo antibacteriano tópico a base de sulfatiazol.$desc$,
  possible_uses = $uses$Aplicación en heridas superficiales para prevenir infección.$uses$,
  additional_info = $info$Uso externo únicamente; suspender en caso de irritación o reacción alérgica.$info$
WHERE product_id = 348;

UPDATE products SET
  description = $desc$Antiácido efervescente a base de bicarbonato de sodio, carbonato de sodio y ácido cítrico, en sobre.$desc$,
  possible_uses = $uses$Hiperacidez, gastritis, sensación de pesadez estomacal, indigestión.$uses$,
  additional_info = $info$Disolver en agua antes de tomar; uso ocasional, no como tratamiento continuo sin evaluación médica.$info$
WHERE product_id = 349;

UPDATE products SET
  description = $desc$Antiinflamatorio no esteroideo (AINE) a base de diclofenaco, en presentación de supositorio.$desc$,
  possible_uses = $uses$Dolor y fiebre, especialmente en pacientes que no toleran la vía oral.$uses$,
  additional_info = $info$Verificar la concentración adecuada según edad/peso del paciente; uso pediátrico solo bajo indicación médica.$info$
WHERE product_id = 350;

UPDATE products SET
  description = $desc$Talco de uso cosmético para pies.$desc$,
  possible_uses = $uses$Control de humedad y mal olor en los pies.$uses$,
  additional_info = $info$Uso externo; aplicar sobre piel limpia y seca.$info$
WHERE product_id = 351;

UPDATE products SET
  description = $desc$Antigripal combinado (paracetamol y descongestionante) en tabletas, formulado para uso diurno sin componentes sedantes.$desc$,
  possible_uses = $uses$Síntomas de resfrío durante el día: congestión nasal, dolor de cabeza, fiebre.$uses$,
  additional_info = $info$Existe versión "noche" con antihistamínico sedante (ver ítem correspondiente); precaución en hipertensos por el descongestionante.$info$
WHERE product_id = 352;

UPDATE products SET
  description = $desc$Antigripal combinado (paracetamol, descongestionante y antihistamínico sedante) en tabletas, formulado para uso nocturno.$desc$,
  possible_uses = $uses$Síntomas de resfrío nocturnos, incluyendo dificultad para dormir por congestión.$uses$,
  additional_info = $info$Contiene antihistamínico sedante; evitar conducir o usar maquinaria tras su consumo.$info$
WHERE product_id = 353;

UPDATE products SET
  description = $desc$Termómetro clínico de mercurio para medición de temperatura corporal.$desc$,
  possible_uses = $uses$Control de fiebre en el hogar.$uses$,
  additional_info = $info$Manipular con cuidado; en caso de rotura, no tocar el mercurio directamente y ventilar el área.$info$
WHERE product_id = 354;

UPDATE products SET
  description = $desc$Termómetro clínico digital para medición de temperatura corporal.$desc$,
  possible_uses = $uses$Control de fiebre en el hogar, monitoreo de temperatura en niños y adultos.$uses$,
  additional_info = $info$Requiere pila (batería); limpiar la punta con alcohol antes y después de cada uso.$info$
WHERE product_id = 355;

UPDATE products SET
  description = $desc$Termómetro clínico digital diseñado para uso en bebés.$desc$,
  possible_uses = $uses$Control de fiebre en lactantes y niños pequeños.$uses$,
  additional_info = $info$Requiere pila (batería); limpiar la punta con alcohol antes y después de cada uso.$info$
WHERE product_id = 356;

UPDATE products SET
  description = $desc$Antibacteriano intestinal a base de nifuroxazida, de acción local (no sistémica).$desc$,
  possible_uses = $uses$Diarrea aguda de origen bacteriano, colopatías infecciosas.$uses$,
  additional_info = $info$No recomendado por más de 7 días sin evaluación médica; mantener una hidratación adecuada durante el episodio diarreico.$info$
WHERE product_id = 357;

UPDATE products SET
  description = $desc$Tetina de silicona para biberón.$desc$,
  possible_uses = $uses$Alimentación de lactantes con leche materna extraída o fórmula.$uses$,
  additional_info = $info$Verificar la talla/flujo adecuado según edad del bebé; esterilizar antes del primer uso.$info$
WHERE product_id = 358;

UPDATE products SET
  description = $desc$Tetina de silicona para biberón de boca ancha, marca Potato, talla L.$desc$,
  possible_uses = $uses$Alimentación de lactantes de mayor edad que requieren flujo más rápido.$uses$,
  additional_info = $info$Verificar compatibilidad con el biberón; esterilizar antes del primer uso.$info$
WHERE product_id = 359;

UPDATE products SET
  description = $desc$Tetina de silicona para biberón de boca ancha, marca Potato, talla M.$desc$,
  possible_uses = $uses$Alimentación de lactantes en etapa intermedia, con flujo moderado.$uses$,
  additional_info = $info$Verificar compatibilidad con el biberón; esterilizar antes del primer uso.$info$
WHERE product_id = 360;

UPDATE products SET
  description = $desc$Tetina de silicona para biberón de boca ancha, marca Potato, talla S.$desc$,
  possible_uses = $uses$Alimentación de recién nacidos y lactantes pequeños, con flujo lento.$uses$,
  additional_info = $info$Verificar compatibilidad con el biberón; esterilizar antes del primer uso.$info$
WHERE product_id = 361;

UPDATE products SET
  description = $desc$Antiséptico tópico a base de tintura de yodo al 2%, frasco de 10ml.$desc$,
  possible_uses = $uses$Desinfección de heridas superficiales y de la piel antes de procedimientos.$uses$,
  additional_info = $info$Uso externo únicamente; puede manchar la piel y la ropa.$info$
WHERE product_id = 362;

UPDATE products SET
  description = $desc$Antiséptico tópico a base de tintura de yodo al 2%, frasco de 30ml.$desc$,
  possible_uses = $uses$Desinfección de heridas superficiales y de la piel antes de procedimientos.$uses$,
  additional_info = $info$Uso externo únicamente; puede manchar la piel y la ropa.$info$
WHERE product_id = 363;

UPDATE products SET
  description = $desc$Preservativo masculino de látex, marca Titan.$desc$,
  possible_uses = $uses$Anticoncepción de barrera y prevención de infecciones de transmisión sexual (ITS).$uses$,
  additional_info = $info$Verificar fecha de vencimiento antes de usar; almacenar lejos de calor y luz directa.$info$
WHERE product_id = 364;

UPDATE products SET
  description = $desc$Preservativo masculino de látex, marca Titan.$desc$,
  possible_uses = $uses$Anticoncepción de barrera y prevención de infecciones de transmisión sexual (ITS).$uses$,
  additional_info = $info$Verificar fecha de vencimiento antes de usar; almacenar lejos de calor y luz directa.$info$
WHERE product_id = 365;

UPDATE products SET
  description = $desc$Toallas húmedas de higiene personal, paquete de 100 unidades.$desc$,
  possible_uses = $uses$Limpieza e higiene de la piel, especialmente en el cambio de pañal.$uses$,
  additional_info = $info$Cerrar bien el paquete tras su uso para evitar que se sequen.$info$
WHERE product_id = 366;

UPDATE products SET
  description = $desc$Toallas higiénicas femeninas de uso desechable.$desc$,
  possible_uses = $uses$Protección durante el periodo menstrual.$uses$,
  additional_info = $info$Cambiar cada 4-6 horas aproximadamente para mantener una adecuada higiene.$info$
WHERE product_id = 367;

UPDATE products SET
  description = $desc$Toallas húmedas de higiene personal de uso general.$desc$,
  possible_uses = $uses$Limpieza de piel, manos y superficies de contacto frecuente.$uses$,
  additional_info = $info$Cerrar bien el paquete tras su uso para evitar que se sequen.$info$
WHERE product_id = 368;

UPDATE products SET
  description = $desc$Antitusivo (dextrometorfano) con acción antihistamínica, disponible en jarabe o pastillas.$desc$,
  possible_uses = $uses$Tos seca o irritativa asociada a resfrío.$uses$,
  additional_info = $info$Puede causar somnolencia por su componente antihistamínico; no combinar con otros sedantes.$info$
WHERE product_id = 369;

UPDATE products SET
  description = $desc$Analgésico antiinflamatorio no esteroideo inyectable a base de ketorolaco trometamina 60mg/2ml.$desc$,
  possible_uses = $uses$Manejo a corto plazo del dolor agudo moderado a severo (postoperatorio, cólicos, traumatismos), vía intramuscular.$uses$,
  additional_info = $info$Uso restringido a corto plazo (máx. 5 días) por riesgo gastrointestinal y renal. Requiere receta y administración supervisada.$info$
WHERE product_id = 370;

UPDATE products SET
  description = $desc$Cinta adhesiva hipoalergénica de uso médico, tipo Transpore.$desc$,
  possible_uses = $uses$Fijación de gasas, apósitos y catéteres sobre la piel.$uses$,
  additional_info = $info$Presentación porosa que permite transpiración de la piel; retirar con cuidado en pieles sensibles.$info$
WHERE product_id = 371;

UPDATE products SET
  description = $desc$Cinta adhesiva hipoalergénica de uso médico, tipo Transpore, en presentación adicional.$desc$,
  possible_uses = $uses$Fijación de gasas, apósitos y catéteres sobre la piel.$uses$,
  additional_info = $info$Presentación porosa que permite transpiración de la piel; retirar con cuidado en pieles sensibles.$info$
WHERE product_id = 372;

UPDATE products SET
  description = $desc$Analgésico y antipirético a base de paracetamol 1g, en polvo granulado (sobre).$desc$,
  possible_uses = $uses$Dolor de cabeza, dolor muscular, dolor dental, fiebre, malestar del resfrío.$uses$,
  additional_info = $info$Disolver el contenido del sobre en agua tibia; no exceder 4 sobres al día. Precaución en pacientes con enfermedad hepática.$info$
WHERE product_id = 373;

UPDATE products SET
  description = $desc$Antigripal combinado (paracetamol, pseudoefedrina y clorfenamina), disponible en comprimidos, suspensión o gotas.$desc$,
  possible_uses = $uses$Síntomas de resfrío y gripe: congestión nasal, estornudos, dolor de cabeza, malestar general.$uses$,
  additional_info = $info$La pseudoefedrina está contraindicada en hipertensión severa o enfermedad coronaria grave; puede causar somnolencia por la clorfenamina.$info$
WHERE product_id = 374;

UPDATE products SET
  description = $desc$Jarabe antitusivo a base de dextrometorfano.$desc$,
  possible_uses = $uses$Tos seca o irritativa asociada a resfrío o afecciones respiratorias leves.$uses$,
  additional_info = $info$No usar junto con otros antitusivos; evitar en tos con abundante flema sin indicación médica.$info$
WHERE product_id = 375;

UPDATE products SET
  description = $desc$Antigripal combinado (paracetamol, clorfeniramina, pseudoefedrina y dextrometorfano) en cápsulas blandas.$desc$,
  possible_uses = $uses$Síntomas de resfrío y gripe: tos, congestión nasal, estornudos, fiebre.$uses$,
  additional_info = $info$Contiene antihistamínico sedante y descongestionante; precaución en hipertensos y evitar conducir tras su consumo.$info$
WHERE product_id = 376;

UPDATE products SET
  description = $desc$Tónico reconstituyente a base de complejo de vitaminas B, vitamina C, niacinamida y aminoácidos esenciales, en jarabe.$desc$,
  possible_uses = $uses$Apoyo nutricional en estados de decaimiento, fatiga o convalecencia.$uses$,
  additional_info = $info$Existe versión con y sin cafeína (Tónico Inti SC); no sustituye una alimentación balanceada.$info$
WHERE product_id = 377;

UPDATE products SET
  description = $desc$Ungüento analgésico tópico a base de mentol, salicilato de metilo y otros componentes rubefacientes.$desc$,
  possible_uses = $uses$Dolores musculares, articulares y reumáticos.$uses$,
  additional_info = $info$Uso externo únicamente; evitar contacto con mucosas, ojos y heridas abiertas.$info$
WHERE product_id = 378;

UPDATE products SET
  description = $desc$Antimicrobiano urinario combinado: norfloxacina 400mg + fenazopiridina 100mg.$desc$,
  possible_uses = $uses$Infecciones agudas del tracto urinario (cistitis, uretritis) con dolor o ardor asociado.$uses$,
  additional_info = $info$La fenazopiridina puede colorear la orina de naranja/rojo (efecto esperado, no dañino). Contraindicado en insuficiencia renal o hepática.$info$
WHERE product_id = 379;

UPDATE products SET
  description = $desc$Producto de uso tópico asociado al alivio de molestias urinarias, según indicación del fabricante.$desc$,
  possible_uses = $uses$Malestar asociado a infecciones urinarias, como complemento del tratamiento indicado por el médico.$uses$,
  additional_info = $info$No sustituye el tratamiento antibiótico indicado por el profesional de salud; consultar en caso de síntomas persistentes.$info$
WHERE product_id = 380;

UPDATE products SET
  description = $desc$Antibacteriano urinario combinado (sulfametizol 500mg + fenazopiridina 100mg), en cápsulas.$desc$,
  possible_uses = $uses$Infecciones del tracto urinario bajo, con dolor o ardor asociado.$uses$,
  additional_info = $info$La fenazopiridina puede colorear la orina de naranja/rojo (efecto esperado). Requiere receta médica; contraindicado en alergia a sulfas.$info$
WHERE product_id = 381;

UPDATE products SET
  description = $desc$Antibacteriano urinario combinado (ácido pipemídico 400mg + fenazopiridina 100mg), en cápsulas.$desc$,
  possible_uses = $uses$Infecciones agudas no complicadas del tracto urinario (cistitis, uretritis).$uses$,
  additional_info = $info$La fenazopiridina puede colorear la orina de naranja/rojo (efecto esperado). Requiere receta médica.$info$
WHERE product_id = 382;

UPDATE products SET
  description = $desc$Óvulo vaginal combinado (metronidazol, miconazol, polimixina, neomicina y centella asiática), con acción antibacteriana, antimicótica y regeneradora del epitelio vaginal.$desc$,
  possible_uses = $uses$Vaginitis inespecífica, tricomoniasis, candidiasis vaginal.$uses$,
  additional_info = $info$Requiere receta médica; evitar relaciones sexuales durante el tratamiento y completar el esquema indicado.$info$
WHERE product_id = 383;

UPDATE products SET
  description = $desc$Vaselina blanca (petrolato) de uso tópico.$desc$,
  possible_uses = $uses$Protección e hidratación de la piel seca o agrietada.$uses$,
  additional_info = $info$Uso externo únicamente; puede usarse como base para mezclar otros productos tópicos.$info$
WHERE product_id = 384;

UPDATE products SET
  description = $desc$Vaselina perfumada de uso cosmético para la piel.$desc$,
  possible_uses = $uses$Hidratación y suavizado de la piel seca.$uses$,
  additional_info = $info$Uso externo; evitar contacto con los ojos.$info$
WHERE product_id = 385;

UPDATE products SET
  description = $desc$Venda elástica de uso médico, ancho de 10cm.$desc$,
  possible_uses = $uses$Vendaje compresivo de esguinces, contusiones y sujeción de apósitos.$uses$,
  additional_info = $info$No aplicar demasiado ajustada para evitar comprometer la circulación.$info$
WHERE product_id = 386;

UPDATE products SET
  description = $desc$Venda elástica de uso médico, ancho de 5cm.$desc$,
  possible_uses = $uses$Vendaje compresivo de esguinces, contusiones y sujeción de apósitos en zonas pequeñas (dedos, muñeca).$uses$,
  additional_info = $info$No aplicar demasiado ajustada para evitar comprometer la circulación.$info$
WHERE product_id = 387;

UPDATE products SET
  description = $desc$Venda elástica de uso médico, de 15cm de ancho por 4.5m de largo.$desc$,
  possible_uses = $uses$Vendaje compresivo de esguinces, contusiones y sujeción de apósitos en zonas de mayor superficie.$uses$,
  additional_info = $info$No aplicar demasiado ajustada para evitar comprometer la circulación.$info$
WHERE product_id = 388;

UPDATE products SET
  description = $desc$Venda de gasa de uso médico, de 10cm de ancho por 4.5m de largo.$desc$,
  possible_uses = $uses$Cobertura y sujeción de apósitos en curaciones de heridas.$uses$,
  additional_info = $info$Verificar esterilidad según presentación antes de aplicar sobre heridas abiertas.$info$
WHERE product_id = 389;

UPDATE products SET
  description = $desc$Venda de gasa de uso médico, de 5cm de ancho por 4m de largo.$desc$,
  possible_uses = $uses$Cobertura y sujeción de apósitos en curaciones de heridas pequeñas.$uses$,
  additional_info = $info$Verificar esterilidad según presentación antes de aplicar sobre heridas abiertas.$info$
WHERE product_id = 390;

UPDATE products SET
  description = $desc$Venda de gasa de uso médico, de 7.5cm de ancho por 4.5m de largo.$desc$,
  possible_uses = $uses$Cobertura y sujeción de apósitos en curaciones de heridas.$uses$,
  additional_info = $info$Verificar esterilidad según presentación antes de aplicar sobre heridas abiertas.$info$
WHERE product_id = 391;

UPDATE products SET
  description = $desc$Solución tópica queratolítica para el tratamiento de verrugas.$desc$,
  possible_uses = $uses$Eliminación de verrugas cutáneas.$uses$,
  additional_info = $info$Aplicar únicamente sobre la verruga, evitando la piel sana circundante; no usar en mucosas ni rostro sin indicación médica.$info$
WHERE product_id = 392;

UPDATE products SET
  description = $desc$Antiespasmódico analgésico inyectable, combinación de bromhidrato de pargeverina y metamizol magnésico.$desc$,
  possible_uses = $uses$Dolor de tipo cólico (renal, biliar, intestinal) con componente espasmódico.$uses$,
  additional_info = $info$Administración por personal de salud (vía intramuscular). Requiere receta médica; contraindicado en alergia al metamizol.$info$
WHERE product_id = 393;

UPDATE products SET
  description = $desc$Antiespasmódico analgésico combinado (pargeverina y metamizol), en tabletas.$desc$,
  possible_uses = $uses$Dolor de tipo cólico (renal, biliar, intestinal) con componente espasmódico.$uses$,
  additional_info = $info$Requiere receta médica; contraindicado en alergia al metamizol o antecedentes de discrasias sanguíneas.$info$
WHERE product_id = 394;

UPDATE products SET
  description = $desc$Producto de venta en farmacia, presentado en unidades.$desc$,
  possible_uses = $uses$Uso según las indicaciones del fabricante para este producto.$uses$,
  additional_info = $info$Conservar en un lugar fresco y seco, siguiendo las indicaciones del empaque.$info$
WHERE product_id = 395;

UPDATE products SET
  description = $desc$Solución antiséptica y antifúngica tópica de violeta de genciana.$desc$,
  possible_uses = $uses$Desinfección de heridas superficiales, tratamiento de afecciones fúngicas leves de la piel y mucosas (aftas, candidiasis oral en bebés).$uses$,
  additional_info = $info$Tiñe la piel y la ropa de color violeta; uso externo únicamente.$info$
WHERE product_id = 396;

UPDATE products SET
  description = $desc$Antigripal combinado (paracetamol, clorfeniramina, dextrometorfano, pseudoefedrina), en cápsulas.$desc$,
  possible_uses = $uses$Síntomas de resfrío y gripe: congestión nasal, tos, dolor de cabeza, fiebre.$uses$,
  additional_info = $info$Existen versiones "compuesto" (con ácido acetilsalicílico), "sin aspirina" y "caliente" (granulado); verificar la presentación exacta en el empaque. Precaución en hipertensos.$info$
WHERE product_id = 397;

UPDATE products SET
  description = $desc$Vitamina C (ácido ascórbico) inyectable.$desc$,
  possible_uses = $uses$Suplementación en deficiencia de vitamina C, apoyo del sistema inmunológico, coadyuvante en cicatrización.$uses$,
  additional_info = $info$Administración por personal de salud (vía intramuscular o intravenosa); requiere indicación médica para uso inyectable.$info$
WHERE product_id = 398;

UPDATE products SET
  description = $desc$Vitamina K1 (fitomenadiona) inyectable, esencial para la coagulación sanguínea.$desc$,
  possible_uses = $uses$Prevención de enfermedad hemorrágica del recién nacido, reversión del efecto de anticoagulantes orales, deficiencia de vitamina K.$uses$,
  additional_info = $info$Administración por personal de salud; requiere indicación médica.$info$
WHERE product_id = 399;

UPDATE products SET
  description = $desc$Crema despigmentante de uso tópico, a base de hidroquinona y ácido kójico, marca boliviana Vitarosa.$desc$,
  possible_uses = $uses$Manchas y pecas en la piel del rostro y las manos.$uses$,
  additional_info = $info$Aplicar solo en las zonas afectadas; usar protector solar durante el tratamiento por mayor sensibilidad de la piel a la luz.$info$
WHERE product_id = 400;

UPDATE products SET
  description = $desc$Vitamina K1 (fitomenadiona) inyectable, esencial para la coagulación sanguínea.$desc$,
  possible_uses = $uses$Prevención de enfermedad hemorrágica del recién nacido, reversión del efecto de anticoagulantes orales, deficiencia de vitamina K.$uses$,
  additional_info = $info$Administración por personal de salud; requiere indicación médica.$info$
WHERE product_id = 401;

UPDATE products SET
  description = $desc$Suplemento nutricional de uso oral.$desc$,
  possible_uses = $uses$Apoyo nutricional general, coadyuvante en estados de decaimiento o fatiga.$uses$,
  additional_info = $info$No sustituye una alimentación balanceada; seguir la dosis indicada en el envase.$info$
WHERE product_id = 402;

UPDATE products SET
  description = $desc$Antiséptico tópico a base de yodo, en presentación pequeña.$desc$,
  possible_uses = $uses$Desinfección de heridas superficiales y de la piel.$uses$,
  additional_info = $info$Uso externo únicamente; puede manchar la piel y la ropa.$info$
WHERE product_id = 403;
COMMIT;
