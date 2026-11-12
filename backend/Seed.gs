/** GENERADO por tools/build_seed.py desde el libro de catálogos de la Fase 2. No editar a mano. */
var SEED = {
 "CAT_Plantas": {
  "headers": [
   "planta_id",
   "clave",
   "nombre",
   "zona_horaria"
  ],
  "rows": [
   [
    "PLT-CAN",
    "CAN",
    "Cantera",
    "America/Chihuahua"
   ],
   [
    "PLT-BAR",
    "BAR",
    "Barrancas",
    "America/Chihuahua"
   ],
   [
    "PLT-JUV",
    "JUV",
    "Juventud",
    "America/Chihuahua"
   ],
   [
    "PLT-AME",
    "AME",
    "Américas",
    "America/Chihuahua"
   ]
  ]
 },
 "CAT_EsquemasTurno": {
  "headers": [
   "esquema_id",
   "nombre",
   "plantas"
  ],
  "rows": [
   [
    "ESQ-TERCERTURNO",
    "Tercer turno",
    "AME, CAN, JUV"
   ],
   [
    "ESQ-PRIMERTURNO",
    "Primer turno",
    "AME, BAR, CAN, JUV"
   ],
   [
    "ESQ-TIEMPOEXTRA",
    "Tiempo extra",
    "CAN"
   ],
   [
    "ESQ-SEGUNDOTURNO",
    "Segundo turno",
    "AME, BAR, CAN, JUV"
   ],
   [
    "ESQ-429",
    "4.29",
    "AME, BAR"
   ],
   [
    "ESQ-430",
    "4.30",
    "AME, BAR, JUV"
   ],
   [
    "ESQ-438",
    "4.38",
    "AME"
   ],
   [
    "ESQ-436",
    "4.36",
    "AME"
   ],
   [
    "ESQ-437",
    "4.37",
    "AME"
   ],
   [
    "ESQ-SABDOM",
    "Sáb/Dom",
    "JUV"
   ],
   [
    "ESQ-FINDESEMANA",
    "Fin de semana",
    "JUV"
   ]
  ]
 },
 "CAT_Servicios": {
  "headers": [
   "servicio_id",
   "planta_id",
   "servicio",
   "turno_esquema",
   "inicio",
   "fin",
   "clasificar_hasta",
   "duracion_min",
   "dias_operacion",
   "comensales_esperados"
  ],
  "rows": [
   [
    "SRV-CAN-01",
    "PLT-CAN",
    "Cena",
    "Tercer turno",
    "02:00",
    "03:00",
    "03:15",
    "60",
    "L-V",
    ""
   ],
   [
    "SRV-CAN-02",
    "PLT-CAN",
    "Desayuno",
    "Primer turno",
    "05:30",
    "08:30",
    "09:40",
    "180",
    "L-V",
    ""
   ],
   [
    "SRV-CAN-03",
    "PLT-CAN",
    "Comida",
    "Primer turno",
    "11:00",
    "14:00",
    "14:40",
    "180",
    "L-V",
    ""
   ],
   [
    "SRV-CAN-04",
    "PLT-CAN",
    "Snack",
    "Tiempo extra",
    "16:00",
    "16:30",
    "16:45",
    "30",
    "L-V",
    ""
   ],
   [
    "SRV-CAN-05",
    "PLT-CAN",
    "Cena",
    "Segundo turno",
    "18:00",
    "19:00",
    "19:40",
    "60",
    "L-V",
    ""
   ],
   [
    "SRV-CAN-06",
    "PLT-CAN",
    "Merienda",
    "Segundo turno",
    "22:00",
    "23:00",
    "23:40",
    "60",
    "L-V",
    ""
   ],
   [
    "SRV-BAR-01",
    "PLT-BAR",
    "Merienda",
    "Turno 4.29",
    "01:00",
    "02:00",
    "02:30",
    "60",
    "L-V",
    ""
   ],
   [
    "SRV-BAR-02",
    "PLT-BAR",
    "Snack",
    "Turno 4.29",
    "04:00",
    "04:30",
    "05:10",
    "30",
    "L-V",
    ""
   ],
   [
    "SRV-BAR-03",
    "PLT-BAR",
    "Desayuno",
    "Primer turno",
    "05:40",
    "08:30",
    "09:40",
    "170",
    "L-V",
    ""
   ],
   [
    "SRV-BAR-04",
    "PLT-BAR",
    "Comida",
    "Primer turno",
    "12:00",
    "14:00",
    "14:40",
    "120",
    "L-V",
    ""
   ],
   [
    "SRV-BAR-05",
    "PLT-BAR",
    "Snack",
    "Turno 4.30",
    "16:00",
    "17:00",
    "17:45",
    "60",
    "L-V",
    ""
   ],
   [
    "SRV-BAR-06",
    "PLT-BAR",
    "Cena",
    "Segundo turno",
    "18:00",
    "19:00",
    "19:40",
    "60",
    "L-V",
    ""
   ],
   [
    "SRV-BAR-07",
    "PLT-BAR",
    "Cena",
    "Turno 4.29",
    "21:00",
    "21:50",
    "22:10",
    "50",
    "L-V",
    ""
   ],
   [
    "SRV-BAR-08",
    "PLT-BAR",
    "Merienda",
    "Segundo turno",
    "22:11",
    "23:00",
    "23:45",
    "49",
    "L-V",
    ""
   ],
   [
    "SRV-JUV-01",
    "PLT-JUV",
    "Merienda",
    "Sáb/Dom",
    "00:10",
    "00:25",
    "00:39",
    "15",
    "S-D",
    ""
   ],
   [
    "SRV-JUV-02",
    "PLT-JUV",
    "Snack",
    "Sáb/Dom",
    "00:40",
    "00:55",
    "01:40",
    "15",
    "S-D",
    ""
   ],
   [
    "SRV-JUV-03",
    "PLT-JUV",
    "Cena",
    "Tercer turno",
    "02:00",
    "03:00",
    "03:40",
    "60",
    "L-V",
    ""
   ],
   [
    "SRV-JUV-04",
    "PLT-JUV",
    "Snack",
    "Turno 4.30",
    "04:30",
    "05:00",
    "05:39",
    "30",
    "L-V",
    ""
   ],
   [
    "SRV-JUV-05",
    "PLT-JUV",
    "Desayuno",
    "Primer turno",
    "05:40",
    "09:00",
    "10:00",
    "200",
    "L-V",
    ""
   ],
   [
    "SRV-JUV-06",
    "PLT-JUV",
    "Desayuno",
    "Fin de semana",
    "05:40",
    "08:00",
    "09:15",
    "140",
    "S-D",
    ""
   ],
   [
    "SRV-JUV-07",
    "PLT-JUV",
    "Comida",
    "Primer turno",
    "11:30",
    "14:00",
    "14:45",
    "150",
    "L-V",
    ""
   ],
   [
    "SRV-JUV-08",
    "PLT-JUV",
    "Comida",
    "Fin de semana",
    "11:30",
    "13:30",
    "14:45",
    "120",
    "S-D",
    ""
   ],
   [
    "SRV-JUV-09",
    "PLT-JUV",
    "Snack",
    "Fin de semana",
    "16:00",
    "16:30",
    "17:15",
    "30",
    "S-D",
    ""
   ],
   [
    "SRV-JUV-10",
    "PLT-JUV",
    "Cena",
    "Segundo turno",
    "17:30",
    "19:15",
    "20:30",
    "105",
    "L-V",
    ""
   ],
   [
    "SRV-JUV-11",
    "PLT-JUV",
    "Cena",
    "Fin de semana",
    "21:00",
    "21:30",
    "21:45",
    "30",
    "S-D",
    ""
   ],
   [
    "SRV-JUV-12",
    "PLT-JUV",
    "Merienda",
    "Segundo turno",
    "21:46",
    "23:00",
    "23:50",
    "74",
    "L-V",
    ""
   ],
   [
    "SRV-AME-01",
    "PLT-AME",
    "Merienda",
    "Turno 4.29 / 4.38",
    "01:00",
    "02:00",
    "02:15",
    "60",
    "L-V",
    ""
   ],
   [
    "SRV-AME-02",
    "PLT-AME",
    "Cena",
    "Tercer turno",
    "02:16",
    "03:00",
    "03:45",
    "44",
    "L-V",
    ""
   ],
   [
    "SRV-AME-03",
    "PLT-AME",
    "Snack",
    "Turno 4.29 / 4.38",
    "04:00",
    "04:30",
    "05:00",
    "30",
    "L-V",
    ""
   ],
   [
    "SRV-AME-04",
    "PLT-AME",
    "Desayuno",
    "Primer turno / 4.36 / 4.37",
    "05:40",
    "08:30",
    "09:40",
    "170",
    "L-V",
    ""
   ],
   [
    "SRV-AME-05",
    "PLT-AME",
    "Comida",
    "Primer turno",
    "11:00",
    "14:00",
    "14:45",
    "180",
    "L-V",
    ""
   ],
   [
    "SRV-AME-06",
    "PLT-AME",
    "Snack",
    "4.30 / 4.36 / 4.37",
    "16:00",
    "16:30",
    "17:00",
    "30",
    "L-V",
    ""
   ],
   [
    "SRV-AME-07",
    "PLT-AME",
    "Cena",
    "Segundo turno",
    "18:00",
    "19:00",
    "19:50",
    "60",
    "L-V",
    ""
   ],
   [
    "SRV-AME-08",
    "PLT-AME",
    "Cena",
    "4.29 / 4.38",
    "20:00",
    "20:30",
    "21:00",
    "30",
    "L-V",
    ""
   ],
   [
    "SRV-AME-09",
    "PLT-AME",
    "Merienda",
    "Segundo turno",
    "22:00",
    "23:00",
    "23:50",
    "60",
    "L-V",
    ""
   ],
   [
    "SRV-AME-F01",
    "PLT-AME",
    "Merienda",
    "Sáb/Dom",
    "00:10",
    "00:25",
    "00:39",
    "15",
    "Sáb, Dom (propuesto)",
    "PROPUESTO: copia de horarios de fin de semana de Juventud, validar con Oralia"
   ],
   [
    "SRV-AME-F02",
    "PLT-AME",
    "Snack",
    "Sáb/Dom",
    "00:40",
    "00:55",
    "01:40",
    "15",
    "Sáb, Dom (propuesto)",
    "PROPUESTO: copia de horarios de fin de semana de Juventud, validar con Oralia"
   ],
   [
    "SRV-AME-F03",
    "PLT-AME",
    "Desayuno",
    "Fin de semana",
    "05:40",
    "08:00",
    "09:15",
    "140",
    "Sáb, Dom (propuesto)",
    "PROPUESTO: copia de horarios de fin de semana de Juventud, validar con Oralia"
   ],
   [
    "SRV-AME-F04",
    "PLT-AME",
    "Comida",
    "Fin de semana",
    "11:30",
    "13:30",
    "14:45",
    "120",
    "Sáb, Dom (propuesto)",
    "PROPUESTO: copia de horarios de fin de semana de Juventud, validar con Oralia"
   ],
   [
    "SRV-AME-F05",
    "PLT-AME",
    "Snack",
    "Fin de semana",
    "16:00",
    "16:30",
    "17:15",
    "30",
    "Sáb, Dom (propuesto)",
    "PROPUESTO: copia de horarios de fin de semana de Juventud, validar con Oralia"
   ],
   [
    "SRV-AME-F06",
    "PLT-AME",
    "Cena",
    "Fin de semana",
    "21:00",
    "21:30",
    "21:45",
    "30",
    "Sáb, Dom (propuesto)",
    "PROPUESTO: copia de horarios de fin de semana de Juventud, validar con Oralia"
   ]
  ]
 },
 "CAT_ServicioEsquema": {
  "headers": [
   "servicio_esquema_id",
   "servicio_id",
   "esquema_id"
  ],
  "rows": [
   [
    "SES-001",
    "SRV-CAN-01",
    "ESQ-TERCERTURNO"
   ],
   [
    "SES-002",
    "SRV-CAN-02",
    "ESQ-PRIMERTURNO"
   ],
   [
    "SES-003",
    "SRV-CAN-03",
    "ESQ-PRIMERTURNO"
   ],
   [
    "SES-004",
    "SRV-CAN-04",
    "ESQ-TIEMPOEXTRA"
   ],
   [
    "SES-005",
    "SRV-CAN-05",
    "ESQ-SEGUNDOTURNO"
   ],
   [
    "SES-006",
    "SRV-CAN-06",
    "ESQ-SEGUNDOTURNO"
   ],
   [
    "SES-007",
    "SRV-BAR-01",
    "ESQ-429"
   ],
   [
    "SES-008",
    "SRV-BAR-02",
    "ESQ-429"
   ],
   [
    "SES-009",
    "SRV-BAR-03",
    "ESQ-PRIMERTURNO"
   ],
   [
    "SES-010",
    "SRV-BAR-04",
    "ESQ-PRIMERTURNO"
   ],
   [
    "SES-011",
    "SRV-BAR-05",
    "ESQ-430"
   ],
   [
    "SES-012",
    "SRV-BAR-06",
    "ESQ-SEGUNDOTURNO"
   ],
   [
    "SES-013",
    "SRV-BAR-07",
    "ESQ-429"
   ],
   [
    "SES-014",
    "SRV-BAR-08",
    "ESQ-SEGUNDOTURNO"
   ],
   [
    "SES-015",
    "SRV-JUV-01",
    "ESQ-SABDOM"
   ],
   [
    "SES-016",
    "SRV-JUV-02",
    "ESQ-SABDOM"
   ],
   [
    "SES-017",
    "SRV-JUV-03",
    "ESQ-TERCERTURNO"
   ],
   [
    "SES-018",
    "SRV-JUV-04",
    "ESQ-430"
   ],
   [
    "SES-019",
    "SRV-JUV-05",
    "ESQ-PRIMERTURNO"
   ],
   [
    "SES-020",
    "SRV-JUV-06",
    "ESQ-FINDESEMANA"
   ],
   [
    "SES-021",
    "SRV-JUV-07",
    "ESQ-PRIMERTURNO"
   ],
   [
    "SES-022",
    "SRV-JUV-08",
    "ESQ-FINDESEMANA"
   ],
   [
    "SES-023",
    "SRV-JUV-09",
    "ESQ-FINDESEMANA"
   ],
   [
    "SES-024",
    "SRV-JUV-10",
    "ESQ-SEGUNDOTURNO"
   ],
   [
    "SES-025",
    "SRV-JUV-11",
    "ESQ-FINDESEMANA"
   ],
   [
    "SES-026",
    "SRV-JUV-12",
    "ESQ-SEGUNDOTURNO"
   ],
   [
    "SES-027",
    "SRV-AME-01",
    "ESQ-429"
   ],
   [
    "SES-028",
    "SRV-AME-01",
    "ESQ-438"
   ],
   [
    "SES-029",
    "SRV-AME-02",
    "ESQ-TERCERTURNO"
   ],
   [
    "SES-030",
    "SRV-AME-03",
    "ESQ-429"
   ],
   [
    "SES-031",
    "SRV-AME-03",
    "ESQ-438"
   ],
   [
    "SES-032",
    "SRV-AME-04",
    "ESQ-PRIMERTURNO"
   ],
   [
    "SES-033",
    "SRV-AME-04",
    "ESQ-436"
   ],
   [
    "SES-034",
    "SRV-AME-04",
    "ESQ-437"
   ],
   [
    "SES-035",
    "SRV-AME-05",
    "ESQ-PRIMERTURNO"
   ],
   [
    "SES-036",
    "SRV-AME-06",
    "ESQ-430"
   ],
   [
    "SES-037",
    "SRV-AME-06",
    "ESQ-436"
   ],
   [
    "SES-038",
    "SRV-AME-06",
    "ESQ-437"
   ],
   [
    "SES-039",
    "SRV-AME-07",
    "ESQ-SEGUNDOTURNO"
   ],
   [
    "SES-040",
    "SRV-AME-08",
    "ESQ-429"
   ],
   [
    "SES-041",
    "SRV-AME-08",
    "ESQ-438"
   ],
   [
    "SES-042",
    "SRV-AME-09",
    "ESQ-SEGUNDOTURNO"
   ],
   [
    "SES-043",
    "SRV-AME-F01",
    "ESQ-SABDOM"
   ],
   [
    "SES-044",
    "SRV-AME-F02",
    "ESQ-SABDOM"
   ],
   [
    "SES-045",
    "SRV-AME-F03",
    "ESQ-FINDESEMANA"
   ],
   [
    "SES-046",
    "SRV-AME-F04",
    "ESQ-FINDESEMANA"
   ],
   [
    "SES-047",
    "SRV-AME-F05",
    "ESQ-FINDESEMANA"
   ],
   [
    "SES-048",
    "SRV-AME-F06",
    "ESQ-FINDESEMANA"
   ]
  ]
 },
 "CAT_ComedorCompartido": {
  "headers": [
   "comedor_compartido_id",
   "planta_origen",
   "comedor_atiende",
   "periodo",
   "estado"
  ],
  "rows": [
   [
    "CCO-01",
    "PLT-BAR",
    "PLT-JUV",
    "Fin de semana",
    "Validar con Oralia"
   ],
   [
    "CCO-02",
    "PLT-CAN",
    "PLT-AME",
    "Fin de semana",
    "Validar con Oralia"
   ]
  ]
 },
 "CAT_Puestos": {
  "headers": [
   "puesto_id",
   "nombre"
  ],
  "rows": [
   [
    "PUE-AUX",
    "Auxiliar general"
   ],
   [
    "PUE-COC",
    "Cocinero(a)"
   ],
   [
    "PUE-FAC",
    "Teleflex Facility"
   ],
   [
    "PUE-HIG",
    "Supervisor de higiene / higienista"
   ],
   [
    "PUE-JCO",
    "Jefe de cocina"
   ],
   [
    "PUE-JUN",
    "Jefe de unidad"
   ]
  ]
 },
 "CAT_TurnosConcesionario": {
  "headers": [
   "turno_conc_id",
   "planta_id",
   "inicio",
   "fin",
   "dias",
   "texto_original"
  ],
  "rows": [
   [
    "TCO-AME-1",
    "PLT-AME",
    "06:00",
    "15:30",
    "L-V",
    "Turno 6:00 Am – 3:30 Pm L-V"
   ],
   [
    "TCO-AME-2",
    "PLT-AME",
    "15:30",
    "00:30",
    "L-V",
    "Turno 3:30 Pm a 12:30 Am  L-V"
   ],
   [
    "TCO-AME-3",
    "PLT-AME",
    "00:00",
    "06:00",
    "Por confirmar",
    "Turno 12:00 Am a 6:00 Am"
   ],
   [
    "TCO-AME-4",
    "PLT-AME",
    "06:00",
    "18:00",
    "V-L",
    "Turno 6:00 Am A 6:00 Pm V-L"
   ],
   [
    "TCO-BAR-1",
    "PLT-BAR",
    "06:00",
    "15:30",
    "L-V",
    "Turno 6:00 Am – 3:30 Pm L-V"
   ],
   [
    "TCO-BAR-2",
    "PLT-BAR",
    "06:00",
    "18:00",
    "L-J",
    "Turno 6:00 Am – 6:00 Pm L-J"
   ],
   [
    "TCO-BAR-3",
    "PLT-BAR",
    "15:30",
    "00:30",
    "L-V",
    "Turno 3:30 pm – 12:30 am L-V"
   ],
   [
    "TCO-BAR-4",
    "PLT-BAR",
    "18:00",
    "06:00",
    "L-J",
    "Turno 6:00 pm -6:00 am L-J"
   ],
   [
    "TCO-JUV-1",
    "PLT-JUV",
    "06:00",
    "15:30",
    "L-V",
    "Turno 6:00 am – 3:30 pm L-V"
   ],
   [
    "TCO-JUV-2",
    "PLT-JUV",
    "15:30",
    "00:30",
    "L-V",
    "Turno 3:30 pm – 12:30 am L-V"
   ],
   [
    "TCO-JUV-3",
    "PLT-JUV",
    "18:00",
    "06:00",
    "L-J",
    "Turno 6:00 pm – 6:00 am L-J"
   ],
   [
    "TCO-CAN-1",
    "PLT-CAN",
    "06:00",
    "15:30",
    "L-V",
    "Turno 6:00 Am – 3:30 Pm L-V"
   ],
   [
    "TCO-CAN-2",
    "PLT-CAN",
    "15:30",
    "00:30",
    "L-V",
    "Turno 3:30 Pm – 12:30 Am L-V"
   ],
   [
    "TCO-CAN-3",
    "PLT-CAN",
    "00:00",
    "06:00",
    "L-V",
    "Turno 12:00 Am – 6:00 Am L-V"
   ],
   [
    "TCO-CAN-4",
    "PLT-CAN",
    "18:00",
    "06:00",
    "L-J",
    "Turno 6:00 Pm – 6:00 Am L-J"
   ],
   [
    "TCO-JUV-FD",
    "PLT-JUV",
    "05:00",
    "17:00",
    "S-D",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ],
   [
    "TCO-JUV-FN",
    "PLT-JUV",
    "18:00",
    "06:00",
    "S-D",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ],
   [
    "TCO-AME-FN",
    "PLT-AME",
    "18:00",
    "06:00",
    "S-D",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ]
  ]
 },
 "CAT_PlantillaRequerida": {
  "headers": [
   "plantilla_id",
   "planta_id",
   "turno_conc_id",
   "puesto_id",
   "cantidad",
   "vigente_desde",
   "vigente_hasta",
   "origen"
  ],
  "rows": [
   [
    "PLA-001",
    "PLT-AME",
    "TCO-AME-1",
    "PUE-AUX",
    "4",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-002",
    "PLT-AME",
    "TCO-AME-1",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-003",
    "PLT-AME",
    "TCO-AME-1",
    "PUE-FAC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-004",
    "PLT-AME",
    "TCO-AME-1",
    "PUE-HIG",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-005",
    "PLT-AME",
    "TCO-AME-1",
    "PUE-JCO",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-006",
    "PLT-AME",
    "TCO-AME-1",
    "PUE-JUN",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-007",
    "PLT-AME",
    "TCO-AME-2",
    "PUE-AUX",
    "2",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-008",
    "PLT-AME",
    "TCO-AME-2",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-009",
    "PLT-AME",
    "TCO-AME-2",
    "PUE-FAC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-010",
    "PLT-AME",
    "TCO-AME-3",
    "PUE-AUX",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-011",
    "PLT-AME",
    "TCO-AME-3",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-012",
    "PLT-AME",
    "TCO-AME-4",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-013",
    "PLT-BAR",
    "TCO-BAR-1",
    "PUE-AUX",
    "2",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-014",
    "PLT-BAR",
    "TCO-BAR-1",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-015",
    "PLT-BAR",
    "TCO-BAR-1",
    "PUE-FAC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-016",
    "PLT-BAR",
    "TCO-BAR-1",
    "PUE-JUN",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-017",
    "PLT-BAR",
    "TCO-BAR-2",
    "PUE-FAC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-018",
    "PLT-BAR",
    "TCO-BAR-3",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-019",
    "PLT-BAR",
    "TCO-BAR-4",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-020",
    "PLT-CAN",
    "TCO-CAN-1",
    "PUE-AUX",
    "4",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-021",
    "PLT-CAN",
    "TCO-CAN-1",
    "PUE-HIG",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-022",
    "PLT-CAN",
    "TCO-CAN-1",
    "PUE-JCO",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-023",
    "PLT-CAN",
    "TCO-CAN-1",
    "PUE-JUN",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-024",
    "PLT-CAN",
    "TCO-CAN-2",
    "PUE-AUX",
    "2",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-025",
    "PLT-CAN",
    "TCO-CAN-2",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-026",
    "PLT-CAN",
    "TCO-CAN-2",
    "PUE-FAC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-027",
    "PLT-CAN",
    "TCO-CAN-3",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-028",
    "PLT-CAN",
    "TCO-CAN-4",
    "PUE-AUX",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-029",
    "PLT-CAN",
    "TCO-CAN-4",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-030",
    "PLT-JUV",
    "TCO-JUV-1",
    "PUE-AUX",
    "4",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-031",
    "PLT-JUV",
    "TCO-JUV-1",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-032",
    "PLT-JUV",
    "TCO-JUV-1",
    "PUE-FAC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-033",
    "PLT-JUV",
    "TCO-JUV-1",
    "PUE-HIG",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-034",
    "PLT-JUV",
    "TCO-JUV-1",
    "PUE-JCO",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-035",
    "PLT-JUV",
    "TCO-JUV-1",
    "PUE-JUN",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-036",
    "PLT-JUV",
    "TCO-JUV-2",
    "PUE-AUX",
    "2",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-037",
    "PLT-JUV",
    "TCO-JUV-2",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-038",
    "PLT-JUV",
    "TCO-JUV-2",
    "PUE-FAC",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-039",
    "PLT-JUV",
    "TCO-JUV-2",
    "PUE-JCO",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-040",
    "PLT-JUV",
    "TCO-JUV-3",
    "PUE-AUX",
    "1",
    "2026-11-11",
    "",
    "Plantillas teleflex 1.xlsx (vacantes incluidas)"
   ],
   [
    "PLA-041",
    "PLT-JUV",
    "TCO-JUV-FD",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ],
   [
    "PLA-042",
    "PLT-JUV",
    "TCO-JUV-FD",
    "PUE-AUX",
    "1",
    "2026-11-11",
    "",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ],
   [
    "PLA-043",
    "PLT-JUV",
    "TCO-JUV-FD",
    "PUE-FAC",
    "1",
    "2026-11-11",
    "",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ],
   [
    "PLA-044",
    "PLT-JUV",
    "TCO-JUV-FN",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ],
   [
    "PLA-045",
    "PLT-JUV",
    "TCO-JUV-FN",
    "PUE-AUX",
    "1",
    "2026-11-11",
    "",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ],
   [
    "PLA-050",
    "PLT-AME",
    "TCO-AME-4",
    "PUE-AUX",
    "1",
    "2026-11-11",
    "",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ],
   [
    "PLA-051",
    "PLT-AME",
    "TCO-AME-FN",
    "PUE-COC",
    "1",
    "2026-11-11",
    "",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ],
   [
    "PLA-052",
    "PLT-AME",
    "TCO-AME-FN",
    "PUE-AUX",
    "1",
    "2026-11-11",
    "",
    "PROPUESTO fin de semana: validar con Oralia antes de la versión definitiva"
   ]
  ]
 },
 "CAT_Categorias": {
  "headers": [
   "categoria_id",
   "nombre",
   "orden"
  ],
  "rows": [
   [
    "CAT-SER",
    "Cumplimiento del servicio",
    "1"
   ],
   [
    "CAT-MEN",
    "Menú y alimentos",
    "2"
   ],
   [
    "CAT-PLA",
    "Plantilla del concesionario",
    "3"
   ],
   [
    "CAT-HIG",
    "Higiene e inocuidad",
    "4"
   ],
   [
    "CAT-INS",
    "Instalaciones y equipos",
    "5"
   ],
   [
    "CAT-OTR",
    "Otros incumplimientos",
    "6"
   ]
  ]
 },
 "CAT_Criterios": {
  "headers": [
   "criterio_id",
   "nombre",
   "area",
   "critico",
   "fuente_principal",
   "origen"
  ],
  "rows": [
   [
    "1.1",
    "Comensales sin comida o porción reducida",
    "Cumplimiento del servicio",
    "Sí",
    "Excepción",
    "Excel"
   ],
   [
    "1.2",
    "Puntualidad en inicio y cierre del servicio",
    "Cumplimiento del servicio",
    "No",
    "Excepción",
    "Excel"
   ],
   [
    "1.3",
    "Tiempo de espera en línea",
    "Cumplimiento del servicio",
    "No",
    "Encuesta (percepción) + pendiente",
    "Excel"
   ],
   [
    "2.1",
    "Apego al menú publicado vs. servido",
    "Cumplimiento del menú",
    "No",
    "Mixto",
    "Excel"
   ],
   [
    "2.2",
    "Cambios por componente",
    "Cumplimiento del menú",
    "No",
    "Excepción (informativo)",
    "Excel"
   ],
   [
    "2.3",
    "Equivalencia de sustituciones",
    "Cumplimiento del menú",
    "No",
    "Excepción",
    "Excel"
   ],
   [
    "2.4",
    "Aviso previo de cambios de menú",
    "Cumplimiento del menú",
    "No",
    "Excepción",
    "Excel"
   ],
   [
    "2.5",
    "Variedad y rotación del ciclo de menú",
    "Cumplimiento del menú",
    "No",
    "Auditoría + encuesta (percepción)",
    "Excel"
   ],
   [
    "3.1",
    "Faltantes de insumos y su causa",
    "Abastecimiento",
    "No",
    "Excepción",
    "Excel"
   ],
   [
    "3.2",
    "Almacén e inventarios",
    "Abastecimiento",
    "No",
    "Auditoría",
    "Excel"
   ],
   [
    "4.1",
    "Cobertura de plantilla",
    "Personal y plantilla",
    "No",
    "Excepción",
    "Excel"
   ],
   [
    "4.2",
    "Ausentismo y rotación del personal",
    "Personal y plantilla",
    "No",
    "Pendiente",
    "Excel"
   ],
   [
    "4.3",
    "Servicios afectados por falta de personal",
    "Personal y plantilla",
    "No",
    "Excepción",
    "Excel"
   ],
   [
    "5.1",
    "Control de plagas y limpieza",
    "Inocuidad e higiene",
    "No",
    "Auditoría",
    "Excel"
   ],
   [
    "5.2",
    "Higiene del personal",
    "Inocuidad e higiene",
    "No",
    "Auditoría",
    "Excel"
   ],
   [
    "5.3",
    "Intoxicación o malestar por alimentos",
    "Inocuidad e higiene",
    "Sí",
    "Excepción",
    "Excel"
   ],
   [
    "5.4",
    "Muestras testigo y registros de temperatura",
    "Inocuidad e higiene",
    "No",
    "Auditoría",
    "Excel"
   ],
   [
    "6.1",
    "Sabor, presentación, temperatura y porción",
    "Calidad y nutrición",
    "No",
    "Mixto (encuesta + quejas)",
    "Excel"
   ],
   [
    "7.1",
    "Satisfacción del comensal",
    "Satisfacción",
    "No",
    "Encuesta",
    "Excel"
   ],
   [
    "8.1",
    "Estado y mantenimiento de equipo",
    "Instalaciones y equipo",
    "No",
    "Mixto",
    "Excel"
   ],
   [
    "8.2",
    "Limpieza y orden del comedor (antes 8.3)",
    "Instalaciones y equipo",
    "No",
    "Mixto",
    "Excel"
   ],
   [
    "9.1",
    "Cumplimiento de compromisos del plan de acción",
    "Seguimiento",
    "No",
    "Automático",
    "Nuevo (aprobado 2026-11-11)"
   ],
   [
    "9.2",
    "Tiempo de respuesta a incidencias",
    "Seguimiento",
    "No",
    "Automático",
    "Nuevo (aprobado 2026-11-11)"
   ],
   [
    "9.3",
    "Control de alérgenos y dietas especiales",
    "Inocuidad e higiene",
    "No",
    "Auditoría (si aplica)",
    "Nuevo (aprobado 2026-11-11)"
   ],
   [
    "9.4",
    "Seguridad en cocina (gas, extintores, aceite, residuos)",
    "Instalaciones y equipo",
    "No",
    "Auditoría",
    "Nuevo (aprobado 2026-11-11)"
   ]
  ]
 },
 "CAT_TiposIncidencia": {
  "headers": [
   "tipo_id",
   "categoria_id",
   "nombre",
   "criterios",
   "critico",
   "campos_especificos",
   "origen"
  ],
  "rows": [
   [
    "TIP-01",
    "CAT-SER",
    "Comensales sin comida o porción reducida",
    "1.1",
    "Sí",
    "Comensales sin comida; comensales con porción reducida; qué se ofreció en su lugar; hora en que se normalizó",
    "Excel: Comensales sin comida"
   ],
   [
    "TIP-02",
    "CAT-SER",
    "Retraso en inicio del servicio",
    "1.2",
    "No",
    "Hora programada (automática del catálogo); hora real de inicio; minutos de retraso (calculado)",
    "Excel: Retraso en el servicio"
   ],
   [
    "TIP-03",
    "CAT-SER",
    "Cierre anticipado del servicio",
    "1.2",
    "No",
    "Hora programada de cierre (automática); hora real de cierre; comensales que no alcanzaron servicio",
    "Derivado del criterio 1.2"
   ],
   [
    "TIP-04",
    "CAT-MEN",
    "Cambio de menú",
    "2.1, 2.2, 2.3, 2.4",
    "No",
    "Componente (proteína, guarnición, verdura, fruta, postre, bebida); qué estaba publicado; qué se sirvió; ¿hubo aviso previo? sí/no; fecha y hora del aviso; a quién se avisó; equivalencia: pendiente de dictamen",
    "Excel: Cambio de menú"
   ],
   [
    "TIP-05",
    "CAT-MEN",
    "Faltante de insumo",
    "3.1",
    "No",
    "Componente o insumo faltante; servicios afectados; qué se sustituyó. La causa la captura el concesionario en su respuesta (proveedor, planeación, pago, otra)",
    "Excel: Faltante de insumo"
   ],
   [
    "TIP-06",
    "CAT-MEN",
    "Calidad del alimento servido",
    "6.1",
    "No",
    "Aspecto (sabor, temperatura, presentación, porción, cocción, cuerpo extraño); platillo; ¿se retiró de la línea? sí/no",
    "Derivado de 6.1; motivos de la encuesta"
   ],
   [
    "TIP-07",
    "CAT-PLA",
    "Personal incompleto",
    "4.1, 4.3",
    "No",
    "Turno del concesionario (automático); puesto faltante; personal requerido (automático de la plantilla); personal presente; faltantes (calculado); ¿afectó el servicio? sí/no; cada cambio en faltantes crea un evento de afectación",
    "Tu ejemplo del requerimiento; Excel: Falta de personal"
   ],
   [
    "TIP-08",
    "CAT-HIG",
    "Práctica de higiene inadecuada",
    "5.2",
    "No",
    "Práctica observada (uniforme, cofia, cubrebocas, guantes, lavado de manos, otra); área; ¿se corrigió en el momento? sí/no",
    "Excel 5.2"
   ],
   [
    "TIP-09",
    "CAT-HIG",
    "Plaga o fauna nociva",
    "5.1",
    "No",
    "Tipo (insecto, roedor, ave, otro); área; ¿se suspendió el uso del área? sí/no",
    "Excel 5.1"
   ],
   [
    "TIP-10",
    "CAT-HIG",
    "Malestar o intoxicación posiblemente relacionada con alimentos",
    "5.3",
    "Sí",
    "Número de personas; síntomas generales (sin datos médicos personales); platillos consumidos; ¿se conservó muestra testigo? sí/no; relación con alimentos: pendiente de dictamen",
    "Excel 5.3; registra Enfermería"
   ],
   [
    "TIP-11",
    "CAT-HIG",
    "Cuerpo extraño en alimento",
    "5.3, 6.1",
    "No",
    "Tipo de objeto; platillo; ¿se conservó la muestra? sí/no",
    "Validar con Enfermería"
   ],
   [
    "TIP-12",
    "CAT-INS",
    "Falla de equipo",
    "8.1",
    "No",
    "Equipo (refrigeración, cocción, línea caliente/fría, lavaloza, mobiliario, otro); ¿afecta el servicio? sí/no; responsable del mantenimiento: concesionario o empresa",
    "Excel: Falla de equipo"
   ],
   [
    "TIP-13",
    "CAT-INS",
    "Limpieza u orden del comedor",
    "8.2",
    "No",
    "Área (mesas, piso, línea, baños si aplica, otra); descripción",
    "Excel 8.2"
   ],
   [
    "TIP-14",
    "CAT-INS",
    "Condición insegura en cocina",
    "9.4",
    "No",
    "Tipo (gas, extintor, cableado, aceite, residuos, otro); ¿riesgo inmediato? sí/no",
    "Criterio nuevo 9.4"
   ],
   [
    "TIP-15",
    "CAT-OTR",
    "Queja de comensal",
    "(según contenido)",
    "No",
    "Tema; ¿se canalizó a otra categoría? Si sí, se reclasifica y no cuenta doble",
    "Excel: Queja de comensal"
   ],
   [
    "TIP-16",
    "CAT-OTR",
    "Otro incumplimiento",
    "—",
    "No",
    "Descripción obligatoria; el administrador puede convertirlo en un tipo nuevo",
    "Excel: Otro"
   ]
  ]
 },
 "AUD_Secciones": {
  "headers": [
   "seccion_id",
   "nombre"
  ],
  "rows": [
   [
    "SEC-01",
    "Instalaciones y equipos"
   ],
   [
    "SEC-02",
    "Control de plagas"
   ],
   [
    "SEC-03",
    "Bitácoras y registros sanitarios"
   ],
   [
    "SEC-04",
    "Almacenamiento e inventarios"
   ],
   [
    "SEC-05",
    "Higiene y prácticas del personal"
   ],
   [
    "SEC-06",
    "Menú y servicio"
   ],
   [
    "SEC-07",
    "Seguridad en cocina"
   ],
   [
    "SEC-08",
    "Alérgenos y dietas especiales (solo si aplica)"
   ]
  ]
 },
 "AUD_Puntos": {
  "headers": [
   "punto_id",
   "seccion_id",
   "texto",
   "criterio",
   "evidencia_requerida",
   "origen",
   "estado"
  ],
  "rows": [
   [
    "PTO-001",
    "SEC-01",
    "Refrigeradores y congeladores funcionando y con termómetro visible",
    "8.1",
    "Sí",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-002",
    "SEC-01",
    "Equipo de cocción y líneas caliente/fría en buen estado",
    "8.1",
    "No",
    "Excel 8.1",
    "Borrador: validar"
   ],
   [
    "PTO-003",
    "SEC-01",
    "Mobiliario del comedor sin daños que representen riesgo",
    "8.1",
    "No",
    "Excel 8.1",
    "Borrador: validar"
   ],
   [
    "PTO-004",
    "SEC-01",
    "Comedor limpio y ordenado durante el recorrido",
    "8.2",
    "Sí",
    "Excel 8.2",
    "Borrador: validar"
   ],
   [
    "PTO-005",
    "SEC-01",
    "Pisos, paredes y techos de cocina limpios y sin daños",
    "5.1, 8.2",
    "No",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-006",
    "SEC-02",
    "Programa de control de plagas vigente y con visitas registradas en el mes",
    "5.1",
    "Sí",
    "Excel 5.1",
    "Borrador: validar"
   ],
   [
    "PTO-007",
    "SEC-02",
    "Sin evidencia de plagas durante el recorrido",
    "5.1",
    "Sí si no cumple",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-008",
    "SEC-02",
    "Puertas, ventanas y drenajes con protección contra fauna nociva",
    "5.1",
    "No",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-009",
    "SEC-03",
    "Bitácora de limpieza de áreas y equipos completa en el mes",
    "5.1",
    "Sí",
    "Excel 5.1",
    "Borrador: validar"
   ],
   [
    "PTO-010",
    "SEC-03",
    "Registro de temperaturas de refrigeración completo en el mes",
    "5.4",
    "Sí",
    "Excel 5.4",
    "Borrador: validar"
   ],
   [
    "PTO-011",
    "SEC-03",
    "Registro de temperaturas de alimentos servidos completo en el mes",
    "5.4",
    "Sí",
    "Excel 5.4",
    "Borrador: validar"
   ],
   [
    "PTO-012",
    "SEC-03",
    "Muestras testigo conservadas y registradas",
    "5.4",
    "Sí",
    "Excel 5.4",
    "Borrador: validar"
   ],
   [
    "PTO-013",
    "SEC-04",
    "Rotación PEPS aplicada (lo primero que entra es lo primero que sale)",
    "3.2",
    "No",
    "Excel 3.2",
    "Borrador: validar"
   ],
   [
    "PTO-014",
    "SEC-04",
    "Sin productos caducados en almacén ni refrigeración",
    "3.2",
    "Sí si no cumple",
    "Excel 3.2",
    "Borrador: validar"
   ],
   [
    "PTO-015",
    "SEC-04",
    "Productos etiquetados con fecha de entrada o preparación",
    "3.2",
    "No",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-016",
    "SEC-04",
    "Alimentos almacenados separados del piso",
    "3.2",
    "No",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-017",
    "SEC-04",
    "Crudos separados de cocidos y listos para servir",
    "3.2",
    "No",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-018",
    "SEC-04",
    "Químicos de limpieza separados de alimentos e identificados",
    "3.2",
    "No",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-019",
    "SEC-05",
    "Personal con uniforme completo y limpio",
    "5.2",
    "No",
    "Excel 5.2",
    "Borrador: validar"
   ],
   [
    "PTO-020",
    "SEC-05",
    "Uso de cofia o red para cabello",
    "5.2",
    "No",
    "Excel 5.2",
    "Borrador: validar"
   ],
   [
    "PTO-021",
    "SEC-05",
    "Uso de guantes o utensilios al manipular alimentos listos para servir",
    "5.2",
    "No",
    "Excel 5.2",
    "Borrador: validar"
   ],
   [
    "PTO-022",
    "SEC-05",
    "Lavado de manos en los momentos requeridos; lavamanos con jabón y toallas",
    "5.2",
    "No",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-023",
    "SEC-05",
    "Sin joyería, uñas largas o alimentos del personal en área de preparación",
    "5.2",
    "No",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-024",
    "SEC-06",
    "Ciclo de menú del mes publicado y sin repeticiones fuera de lo acordado",
    "2.5",
    "Sí",
    "Excel 2.5 (meta por definir)",
    "Borrador: validar"
   ],
   [
    "PTO-025",
    "SEC-06",
    "Menú del día publicado y visible para el comensal",
    "2.1",
    "No",
    "Referencia NOM-251-SSA1-2009, validar con Enfermería y Servicios",
    "Borrador: validar"
   ],
   [
    "PTO-026",
    "SEC-07",
    "Extintores vigentes, accesibles y señalizados",
    "9.4",
    "No",
    "Criterio nuevo 9.4; validar con Seguridad",
    "Borrador: validar"
   ],
   [
    "PTO-027",
    "SEC-07",
    "Instalación de gas sin fugas visibles y con revisión vigente",
    "9.4",
    "Sí",
    "Criterio nuevo 9.4; validar con Seguridad",
    "Borrador: validar"
   ],
   [
    "PTO-028",
    "SEC-07",
    "Aceite usado y residuos almacenados y retirados correctamente",
    "9.4",
    "No",
    "Criterio nuevo 9.4; validar con Seguridad",
    "Borrador: validar"
   ],
   [
    "PTO-029",
    "SEC-08",
    "Alérgenos identificados en el menú publicado",
    "9.3",
    "No",
    "Criterio nuevo 9.3; validar si aplica",
    "Borrador: validar"
   ],
   [
    "PTO-030",
    "SEC-08",
    "Dietas especiales preparadas por separado según lo acordado",
    "9.3",
    "No",
    "Criterio nuevo 9.3; validar si aplica",
    "Borrador: validar"
   ]
  ]
 },
 "IND_Indicadores": {
  "headers": [
   "indicador_id",
   "nombre",
   "criterio",
   "fuente",
   "numerador",
   "denominador",
   "formula",
   "unidad",
   "meta",
   "periodicidad",
   "tratamiento_faltantes",
   "aplicabilidad"
  ],
  "rows": [
   [
    "IND-01",
    "Servicios sin comensales desatendidos",
    "1.1",
    "Incidencias TIP-01",
    "Servicios programados − servicios con TIP-01",
    "Servicios programados",
    "N/D×100",
    "%",
    "0 turnos (Excel, referencia)",
    "Mensual",
    "Si no hay servicios programados: sin dato",
    "Todos los comedores"
   ],
   [
    "IND-02",
    "Servicios puntuales sin desviación reportada",
    "1.2",
    "Incidencias TIP-02 y TIP-03",
    "Servicios sin TIP-02 ni TIP-03",
    "Servicios programados",
    "N/D×100",
    "%",
    "≥ 98 % (Excel, referencia)",
    "Mensual",
    "Se etiqueta \"sin desviaciones reportadas\", no \"verificado\"",
    "Todos"
   ],
   [
    "IND-03",
    "Percepción de tiempo de espera",
    "1.3",
    "Encuesta: motivo \"Tiempo de espera\"",
    "Respuestas que mencionan tiempo de espera",
    "Respuestas válidas",
    "N/D×100",
    "%",
    "Por definir",
    "Mensual",
    "Mínimo de respuestas por definir",
    "Todos"
   ],
   [
    "IND-04",
    "Apego al menú",
    "2.1",
    "Incidencias TIP-04 + menú programado",
    "Componentes programados − componentes cambiados",
    "Componentes programados (servicios × componentes)",
    "N/D×100",
    "%",
    "≥ 95 % (Excel, referencia)",
    "Mensual",
    "Requiere número de componentes por servicio",
    "Todos"
   ],
   [
    "IND-05",
    "Sustituciones equivalentes",
    "2.3",
    "TIP-04 con dictamen",
    "Cambios dictaminados equivalentes",
    "Cambios dictaminados",
    "N/D×100",
    "%",
    "100 % (Excel, referencia)",
    "Mensual",
    "Sin cambios = no aplica (no 100 %)",
    "Si hubo cambios"
   ],
   [
    "IND-06",
    "Cambios con aviso previo",
    "2.4",
    "TIP-04",
    "Cambios con aviso antes del servicio",
    "Cambios de menú",
    "N/D×100",
    "%",
    "100 % (Excel, referencia)",
    "Mensual",
    "Sin cambios = no aplica",
    "Si hubo cambios"
   ],
   [
    "IND-07",
    "Faltantes de insumo",
    "3.1",
    "Incidencias TIP-05",
    "Número de TIP-05",
    "—",
    "Conteo",
    "incidencias",
    "0 recurrentes (Excel; \"recurrente\" por definir)",
    "Mensual",
    "Cero es un valor válido",
    "Todos"
   ],
   [
    "IND-08",
    "Cobertura de plantilla",
    "4.1",
    "TIP-07 + plantilla requerida",
    "HP programadas − HP de déficit",
    "HP programadas",
    "N/D×100",
    "%",
    "≥ 95 % (Excel, referencia)",
    "Mensual",
    "Solo cuenta horas dentro de la jornada programada",
    "Todos"
   ],
   [
    "IND-09",
    "Servicios afectados por falta de personal",
    "4.3",
    "TIP-07 con \"afectó el servicio\"",
    "Número de servicios afectados",
    "—",
    "Conteo",
    "servicios",
    "0 (Excel, referencia)",
    "Mensual",
    "No se suma a IND-01 salvo comensales sin comida",
    "Todos"
   ],
   [
    "IND-10",
    "Incidentes de malestar o intoxicación",
    "5.3",
    "Incidencias TIP-10 dictaminadas",
    "Número de casos confirmados",
    "—",
    "Conteo",
    "casos",
    "0 (Excel, referencia)",
    "Mensual",
    "Pendientes de dictamen se muestran aparte",
    "Todos"
   ],
   [
    "IND-11",
    "Cumplimiento de auditoría por sección",
    "3.2, 5.x, 8.x, 9.3, 9.4",
    "Auditoría mensual",
    "Puntos \"Cumple\"",
    "Puntos \"Cumple\" + \"No cumple\"",
    "N/D×100",
    "%",
    "Por definir",
    "Mensual",
    "Auditoría no realizada = sin dato, no 0",
    "Si hubo auditoría"
   ],
   [
    "IND-12",
    "Satisfacción positiva",
    "7.1",
    "Encuesta",
    "Respuestas con calificación 4 o 5",
    "Respuestas válidas (sin \"Fuera de horario\" por servicio)",
    "N/D×100",
    "%",
    "≥ 80 % (Excel, referencia)",
    "Mensual",
    "Mínimo de respuestas por definir",
    "Todos"
   ],
   [
    "IND-13",
    "Percepción de calidad del alimento",
    "6.1",
    "Encuesta: sabor, porción, temperatura",
    "Respuestas que mencionan alguno",
    "Respuestas válidas",
    "N/D×100",
    "%",
    "Por definir",
    "Mensual",
    "Es percepción, no verificación",
    "Todos"
   ],
   [
    "IND-14",
    "Cumplimiento de compromisos",
    "9.1",
    "Compromisos",
    "Compromisos verificados en o antes de la fecha original",
    "Compromisos con fecha original en el periodo",
    "N/D×100",
    "%",
    "Por definir",
    "Mensual",
    "Prórrogas aprobadas se reportan aparte",
    "Si hubo compromisos"
   ],
   [
    "IND-15",
    "Tiempo de primera respuesta",
    "9.2",
    "Incidencias",
    "Σ (primera respuesta − notificación)",
    "Incidencias respondidas",
    "Promedio y mediana",
    "horas",
    "Por definir",
    "Mensual",
    "Sin respuesta al cierre del mes: se reporta como pendiente",
    "Si hubo incidencias"
   ],
   [
    "IND-16",
    "Tiempo de resolución",
    "9.2",
    "Incidencias",
    "Σ (solución verificada − detección)",
    "Incidencias cerradas",
    "Promedio y mediana",
    "horas",
    "Por definir",
    "Mensual",
    "Calendario y en horario de operación",
    "Si hubo cierres"
   ]
  ]
 }
};
