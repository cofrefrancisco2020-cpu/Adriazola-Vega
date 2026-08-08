const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector("nav");
const languagePicker = document.querySelector(".language-picker");
const languageCurrent = document.querySelector(".language-current");
const languageMenu = document.querySelector(".language-menu");
const languageButtons = document.querySelectorAll("[data-language]");
const quoteForm = document.querySelector("#quote-form");

const languageMeta = {
  es: { code: "ES", flag: "./assets/flag-cl.svg" },
  en: { code: "EN", flag: "./assets/flag-gb.svg" },
  de: { code: "DE", flag: "./assets/flag-de.svg" },
};

const translations = {
  es: {
    seo: {
      title: "Taller mecánico en Coyhaique | Adriazola 4WD",
      description: "Taller mecánico en Coyhaique especializado en soluciones y reparación de sistemas DPF y AdBlue, diagnóstico electrónico, mantención, 4x4, UTV y motores de motocicleta.",
      ogDescription: "Soluciones y reparación de sistemas DPF y AdBlue, diagnóstico electrónico y mecánica multimarca en Coyhaique.",
    },
    brandTag: "Servicio técnico · Coyhaique",
    nav: ["Servicios", "Trabajos", "Especialidad", "Opiniones", "Contacto"],
    navCta: "Cotizar trabajo",
    hero: {
      eyebrow: "Servicio técnico · repuestos · equipamiento",
      title: "Mecánica que<br><em>responde.</em>",
      copy: "Taller mecánico y 4WD en Coyhaique. Especialistas en soluciones y reparación de sistemas DPF y AdBlue, diagnóstico electrónico y mecánica multimarca.",
      primary: "Cotizar mi vehículo",
      secondary: "Ver trabajos reales",
      facts: [
        ["Servicio", "Mecánica y diagnóstico"],
        ["DPF + AdBlue", "Diagnóstico y reparación"],
        ["4WD", "Equipamiento y máquinas"],
      ],
    },
    manifesto: {
      kicker: "Hecho en Coyhaique",
      title: "Primero entendemos la falla.<br>Después la resolvemos.",
      copy: "En Adriazola 4WD resolvemos fallas mecánicas y electrónicas en autos, camionetas y máquinas. Nuestra especialidad incluye diagnóstico y reparación de sistemas DPF y AdBlue, además de mantenciones y reparaciones mayores.",
      location: "Encuéntranos en",
    },
    services: {
      kicker: "Qué hacemos",
      title: "Diagnóstico, mantención<br>y reparación.",
      intro: "Atendemos lo cotidiano y lo complejo. Revisamos cada caso antes de recomendar una solución.",
      cards: [
        ["Diagnóstico y scanner", "Lectura de fallas y revisión técnica para encontrar la causa antes de cambiar piezas."],
        ["Mantención preventiva", "Aceite, filtros, fluidos e inspecciones para evitar fallas y prolongar la vida útil."],
        ["Mecánica integral", "Reparaciones de motor, transmisión y sistemas mecánicos para autos y camionetas."],
        ["Frenos y suspensión", "Inspección y reparación de sistemas críticos para una conducción segura y estable."],
        ["Electricidad", "Detección de fallas, iluminación y equipamiento eléctrico para tu vehículo."],
        ["4x4, UTV y modificaciones", "Servicio, equipamiento y fabricación para máquinas recreativas y de trabajo."],
      ],
    },
    specialty: {
      kicker: "Especialidad en Coyhaique",
      title: "Soluciones para sistemas<br><em>DPF y AdBlue.</em>",
      intro: "Diagnosticamos la causa de la falla y trabajamos sobre el sistema con equipamiento especializado. Una solución técnica pensada para vehículos diésel expuestos al frío, trayectos exigentes y las condiciones de la Patagonia.",
      badge: ["DPF", "AdBlue · SCR · ECU"],
      systems: [
        ["Sistema DPF", "Diagnóstico, regeneración asistida, revisión de sensores y reparación de fallas del filtro de partículas."],
        ["AdBlue y SCR", "Evaluación de dosificación, sensores, bomba, inyector y códigos de falla del sistema de reducción de emisiones."],
        ["EGR y admisión", "Revisión técnica del sistema de recirculación, actuadores y componentes asociados al control de emisiones."],
        ["Diagnóstico ECU", "Lectura electrónica, respaldo y calibración técnica de unidades de control con software especializado."],
      ],
      proof: ["Programación y respaldo con equipamiento especializado"],
      proofAlts: ["Programación técnica de sistemas AdBlue y DPF con Alientech"],
      allianceLabel: "Representación técnica en Aysén",
      allianceTitle: "Adriazola 4WD trabaja junto a EcuLab",
      allianceCopy: "Como representante técnico regional de EcuLab, acercamos a Coyhaique su respaldo especializado en electrónica automotriz y calibración ECU.",
      allianceLink: "Conocer EcuLab",
      cta: "Consultar por DPF o AdBlue",
      whatsapp: "Hola, quisiera consultar por un diagnóstico de sistema DPF o AdBlue.",
      imageAlt: "Computador con software de diagnóstico y programación automotriz en Adriazola 4WD",
      logoAlt: "Logo de EcuLab, aliado técnico de Adriazola 4WD",
    },
    work: {
      kicker: "Dentro del taller",
      title: "El trabajo se ve<br>en los detalles.",
      intro: "Una selección real de vehículos, máquinas y reparaciones realizadas dentro de nuestro taller en Coyhaique.",
      captions: [
        ["Capacidad de atención", "Taller multimarca"],
        ["Proyectos especiales", "Clásicos y 4WD"],
        ["Suspensión y tren delantero", "Servicio UTV"],
        ["Motor 2T · KTM 300", "Motores de motocicleta"],
        ["Engranajes y sincronizadores", "Caja de cambios"],
        ["Electricidad y equipamiento", "Vehículos especiales"],
      ],
      footer: "¿Necesitas diagnóstico, reparación o equipamiento para tu vehículo?",
      cta: "Consultar por WhatsApp",
    },
    process: {
      kicker: "Cómo trabajamos",
      title: "Claro desde el<br>primer contacto.",
      intro: "Primero entendemos el uso del vehículo. Después definimos el trabajo y te mantenemos al tanto.",
      steps: [
        ["Cuéntanos qué pasa", "Escríbenos por WhatsApp con el modelo y lo que necesitas."],
        ["Revisamos y proponemos", "Evaluamos el vehículo y acordamos el alcance antes de comenzar."],
        ["Trabajo y entrega", "Ejecutamos el servicio y te explicamos lo realizado al entregar."],
      ],
    },
    quote: {
      kicker: "Hablemos de tu vehículo",
      title: "¿Qué necesitas<br><em>resolver?</em>",
      intro: "Completa estos datos y abriremos una conversación de WhatsApp lista para enviar al taller.",
      contacts: ["WhatsApp · Encargado del taller", "Teléfono del local", "WhatsApp · Contacto alternativo"],
      labels: ["Tu nombre", "Tu vehículo", "¿Qué necesitas?"],
      placeholders: ["¿Cómo te llamas?", "Marca, modelo y año", "Cuéntanos el problema o servicio…"],
      button: "Preparar mensaje por WhatsApp",
      note: "No enviamos datos automáticamente. Tú confirmas el mensaje en WhatsApp.",
    },
    reviews: {
      kicker: "Opiniones verificables",
      title: "Qué piensan<br>nuestros clientes.",
      rating: "37 opiniones en Google",
      ratingAria: "Ver las 37 opiniones de Adriazola 4WD en Google",
      quotes: [
        "“Haciendo la carretera Austral, tuvimos un problema de último momento con el filtro de aceite, llamamos a la noche y nos dijeron que fuéramos al día siguiente a primera hora, Pablo el dueño y su equipo nos resolvieron enseguida el problema, súper recomendado el servicio en especial para viajeros que necesitamos una solución rápida para continuar el viaje.”",
        "“Ya casi al final de mis vacaciones, mi auto comenzó con un sonido extraño, busque varios lugares y ninguno tenía disponibilidad. Fui al taller de Pablo y me ayudaron con el problema de inmediato, la disponibilidad y amabilidad de el y su equipo se destaca, finamente me indicaron cual era el problema y la solución en el mismo momento.”",
        "“Muy buen servicio efectivo y rapido. Me ayudaron de forma inmediata, tuve un problema con Homocinetica y ellos me pudieron conseguir el repuesto; en 2-3 horas ya me habían solucionado el problema. Los recomiendo tanto para gente de Coyhaique y viajeros que estén de paso por la ciudad.”",
        "“Super recomendado. Me siento confiada en ir. Siempre han respetado los presupuestos y me han dejado el vehiculo funcionando impecable y en forma rápida.”",
      ],
      source: "Opinión publicada en Google",
      footer: "Opiniones seleccionadas del perfil público de Adriazola 4WD.",
      cta: "Comprobar opiniones en Google",
    },
    visit: {
      kicker: "Ven al taller",
      title: "Estamos en<br>Los Maitenes 949.",
      days: ["Lunes — jueves", "Viernes", "Sábado — domingo"],
      closed: "Cerrado",
      button: "Abrir en Google Maps",
    },
    footer: {
      tag: "Servicio técnico · repuestos · equipamiento",
      links: ["Servicios", "Trabajos", "Contacto"],
      place: "Coyhaique · Patagonia chilena",
      floating: "Cotizar",
    },
    a11y: {
      start: "Adriazola 4WD, inicio",
      nav: "Navegación principal",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      selectLanguage: "Seleccionar idioma",
      languages: "Idiomas",
      facts: "Datos destacados",
      stars: "5 de 5 estrellas",
      map: "Ubicación de Adriazola 4WD en Coyhaique",
      whatsapp: "Cotizar por WhatsApp",
      heroAlt: "Vista general del taller mecánico Adriazola 4WD en Coyhaique",
      alts: [
        "Vista interior del taller Adriazola 4WD con vehículos en servicio",
        "Vehículo clásico y Toyota 4x4 dentro del taller",
        "Suspensión de UTV en reparación",
        "Motor de motocicleta de dos tiempos de una KTM 300 abierto durante su reparación",
        "Caja de cambios abierta con engranajes y sincronizadores visibles",
        "Van verde en servicio técnico dentro del taller Adriazola 4WD",
      ],
    },
    whatsapp: {
      direct: "Hola, quisiera consultar por un trabajo para mi vehículo.",
      floating: "Hola, quisiera cotizar un servicio para mi vehículo.",
      form: ["Hola, quisiera cotizar un servicio.", "Nombre", "Vehículo", "Necesito"],
    },
  },
  en: {
    seo: {
      title: "Auto repair shop in Coyhaique | Adriazola 4WD",
      description: "Auto repair shop in Coyhaique specializing in DPF and AdBlue system solutions and repairs, electronic diagnostics, maintenance, 4x4s, UTVs and motorcycle engines.",
      ogDescription: "DPF and AdBlue system solutions and repairs, electronic diagnostics and multi-brand mechanical service in Coyhaique.",
    },
    brandTag: "Technical service · Coyhaique",
    nav: ["Services", "Our work", "Specialty", "Reviews", "Contact"],
    navCta: "Request a quote",
    hero: {
      eyebrow: "Technical service · parts · equipment",
      title: "Mechanics you<br><em>can rely on.</em>",
      copy: "Auto repair and 4WD workshop in Coyhaique. Specialists in DPF and AdBlue system solutions and repairs, electronic diagnostics and multi-brand mechanical service.",
      primary: "Request a quote",
      secondary: "See real work",
      facts: [
        ["Service", "Mechanical work and diagnostics"],
        ["DPF + AdBlue", "Diagnostics and repair"],
        ["4WD", "Equipment and machines"],
      ],
    },
    manifesto: {
      kicker: "Built in Coyhaique",
      title: "First we understand the fault.<br>Then we fix it.",
      copy: "At Adriazola 4WD we solve mechanical and electronic faults in cars, pickup trucks and machines. Our specialty includes DPF and AdBlue system diagnostics and repairs, as well as maintenance and major repairs.",
      location: "Find us at",
    },
    services: {
      kicker: "What we do",
      title: "Diagnostics, maintenance<br>and repairs.",
      intro: "We handle both everyday and complex jobs. Every case is inspected before we recommend a solution.",
      cards: [
        ["Diagnostics and scanning", "Fault-code scanning and technical inspection to identify the cause before replacing parts."],
        ["Preventive maintenance", "Oil, filters, fluids and inspections to prevent failures and extend service life."],
        ["Complete mechanical service", "Engine, transmission and mechanical-system repairs for cars and pickup trucks."],
        ["Brakes and suspension", "Inspection and repair of critical systems for safe, stable driving."],
        ["Electrical systems", "Fault finding, lighting and electrical equipment for your vehicle."],
        ["4x4, UTV and modifications", "Service, equipment and fabrication for recreational and work machines."],
      ],
    },
    specialty: {
      kicker: "Specialist service in Coyhaique",
      title: "Solutions for<br><em>DPF and AdBlue systems.</em>",
      intro: "We diagnose the cause of the fault and work on the system with specialist equipment. A technical solution for diesel vehicles exposed to cold weather, demanding journeys and Patagonian conditions.",
      badge: ["DPF", "AdBlue · SCR · ECU"],
      systems: [
        ["DPF system", "Diagnostics, assisted regeneration, sensor inspection and repair of diesel particulate filter faults."],
        ["AdBlue and SCR", "Assessment of dosing, sensors, pump, injector and fault codes in the emissions reduction system."],
        ["EGR and intake", "Technical inspection of the recirculation system, actuators and components related to emissions control."],
        ["ECU diagnostics", "Electronic reading, backup and technical calibration of control units with specialist software."],
      ],
      proof: ["Programming and backup with specialist equipment"],
      proofAlts: ["Technical programming of AdBlue and DPF systems with Alientech"],
      allianceLabel: "Technical representation in Aysén",
      allianceTitle: "Adriazola 4WD works with EcuLab",
      allianceCopy: "As an EcuLab regional technical representative, we bring its specialist automotive electronics and ECU calibration support to Coyhaique.",
      allianceLink: "Visit EcuLab",
      cta: "Ask about DPF or AdBlue",
      whatsapp: "Hello, I would like to ask about a DPF or AdBlue system diagnosis.",
      imageAlt: "Laptop running automotive diagnostic and programming software at Adriazola 4WD",
      logoAlt: "EcuLab logo, technical partner of Adriazola 4WD",
    },
    work: {
      kicker: "Inside the workshop",
      title: "The details show<br>the quality of the work.",
      intro: "A real selection of vehicles, machines and repairs completed in our Coyhaique workshop.",
      captions: [
        ["Workshop capacity", "Multi-brand workshop"],
        ["Special projects", "Classics and 4WD"],
        ["Suspension and front end", "UTV service"],
        ["2-stroke engine · KTM 300", "Motorcycle engines"],
        ["Gears and synchronizers", "Gearbox repair"],
        ["Electrical systems and equipment", "Special-purpose vehicles"],
      ],
      footer: "Does your vehicle need diagnostics, repairs or equipment?",
      cta: "Ask us on WhatsApp",
    },
    process: {
      kicker: "How we work",
      title: "Clear from the<br>first conversation.",
      intro: "First we understand how the vehicle is used. Then we define the work and keep you informed.",
      steps: [
        ["Tell us what is happening", "Message us on WhatsApp with the model and what you need."],
        ["We inspect and propose", "We assess the vehicle and agree on the scope before starting."],
        ["Work and handover", "We complete the service and explain the work when the vehicle is handed over."],
      ],
    },
    quote: {
      kicker: "Tell us about your vehicle",
      title: "What do you need<br><em>to solve?</em>",
      intro: "Complete these details and we will open a WhatsApp conversation ready to send to the workshop.",
      contacts: ["WhatsApp · Workshop manager", "Workshop phone", "WhatsApp · Alternative contact"],
      labels: ["Your name", "Your vehicle", "What do you need?"],
      placeholders: ["What is your name?", "Make, model and year", "Describe the problem or service…"],
      button: "Prepare WhatsApp message",
      note: "We do not send your information automatically. You confirm the message in WhatsApp.",
    },
    reviews: {
      kicker: "Verifiable reviews",
      title: "What our<br>customers say.",
      rating: "37 reviews on Google",
      ratingAria: "View all 37 Adriazola 4WD reviews on Google",
      quotes: [
        "“While travelling on the Carretera Austral, we had a last-minute problem with the oil filter. We called at night and were told to come in first thing the next morning. Pablo, the owner, and his team solved the problem immediately. I highly recommend the service, especially for travellers who need a quick solution to continue their journey.”",
        "“Near the end of my holiday, my car began making a strange noise. I tried several places but none had availability. I went to Pablo's workshop and they helped me immediately. His availability and the kindness of his team stand out; they identified both the problem and the solution right away.”",
        "“Very good, efficient and fast service. They helped me immediately when I had a problem with a CV joint. They found the part and the problem was solved within two to three hours. I recommend them to people from Coyhaique and to travellers passing through the city.”",
        "“Highly recommended. I feel confident taking my vehicle there. They have always honoured their estimates and returned my vehicle in excellent working order, quickly.”",
      ],
      source: "Review published on Google",
      footer: "Selected reviews from the public Adriazola 4WD Google profile.",
      cta: "Verify reviews on Google",
    },
    visit: {
      kicker: "Visit the workshop",
      title: "Find us at<br>Los Maitenes 949.",
      days: ["Monday — Thursday", "Friday", "Saturday — Sunday"],
      closed: "Closed",
      button: "Open in Google Maps",
    },
    footer: {
      tag: "Technical service · parts · equipment",
      links: ["Services", "Our work", "Contact"],
      place: "Coyhaique · Chilean Patagonia",
      floating: "Quote",
    },
    a11y: {
      start: "Adriazola 4WD, home",
      nav: "Main navigation",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      selectLanguage: "Select language",
      languages: "Languages",
      facts: "Key services",
      stars: "5 out of 5 stars",
      map: "Location of Adriazola 4WD in Coyhaique",
      whatsapp: "Request a quote on WhatsApp",
      heroAlt: "General view of the Adriazola 4WD auto repair workshop in Coyhaique",
      alts: [
        "Interior of the Adriazola 4WD workshop with vehicles being serviced",
        "Classic vehicle and Toyota 4x4 inside the workshop",
        "UTV suspension being repaired",
        "Open two-stroke KTM 300 motorcycle engine during repair",
        "Open gearbox with visible gears and synchronizers",
        "Green van receiving technical service inside the Adriazola 4WD workshop",
      ],
    },
    whatsapp: {
      direct: "Hello, I would like to ask about work for my vehicle.",
      floating: "Hello, I would like to request a quote for my vehicle.",
      form: ["Hello, I would like to request a service quote.", "Name", "Vehicle", "Service needed"],
    },
  },
  de: {
    seo: {
      title: "Autowerkstatt in Coyhaique | Adriazola 4WD",
      description: "Autowerkstatt in Coyhaique, spezialisiert auf Diagnose und Reparatur von DPF- und AdBlue-Systemen, Elektronikdiagnose, Wartung, 4x4, UTV und Motorradmotoren.",
      ogDescription: "Lösungen und Reparaturen für DPF- und AdBlue-Systeme, Elektronikdiagnose und Mehrmarken-Service in Coyhaique.",
    },
    brandTag: "Technischer Service · Coyhaique",
    nav: ["Leistungen", "Unsere Arbeit", "Spezialgebiet", "Bewertungen", "Kontakt"],
    navCta: "Angebot anfragen",
    hero: {
      eyebrow: "Technischer Service · Ersatzteile · Ausstattung",
      title: "Mechanik, auf die<br><em>Verlass ist.</em>",
      copy: "Autowerkstatt und 4WD-Service in Coyhaique. Spezialisiert auf die Diagnose, Wartung und Reparatur von DPF- und AdBlue-Systemen, elektronische Fahrzeugdiagnose sowie professioneller Mehrmarken-Service.",
      primary: "Angebot anfragen",
      secondary: "Echte Arbeiten ansehen",
      facts: [
        ["Service", "Mechanik und Diagnose"],
        ["DPF + AdBlue", "Diagnose und Reparatur"],
        ["4WD", "Ausstattung und Maschinen"],
      ],
    },
    manifesto: {
      kicker: "Made in Coyhaique.",
      title: "Zuerst analysieren wir das Problem.<br>Dann beheben wir es.",
      copy: "Adriazola 4WD ist Ihr Spezialist für die Diagnose, Wartung und Reparatur von Pkw, Pick-ups und Maschinen – mit besonderer Kompetenz bei DPF- und AdBlue-Systemen.",
      location: "Sie finden uns in",
    },
    services: {
      kicker: "Unsere Leistungen",
      title: "Diagnose, Wartung<br>und Reparatur.",
      intro: "Wir übernehmen alltägliche und komplexe Arbeiten. Jeder Fall wird geprüft, bevor wir eine Lösung empfehlen.",
      cards: [
        ["Diagnose und Fahrzeugscanner", "Auslesen des Fehlerspeichers und technische Diagnose zur präzisen Fehlerursache – für eine effiziente Reparatur ohne unnötigen Teiletausch."],
        ["Präventive Wartung", "Ölwechsel, Filter- und Flüssigkeitsservice sowie Inspektionen zur Vorbeugung von Schäden und eine längere Lebensdauer."],
        ["Kompletter Mechanikservice", "Fachgerechte Reparaturen an Motor, Getriebe und allen mechanischen Systemen für Pkw und Pick-ups."],
        ["Bremsen und Fahrwerk", "Prüfung und Reparatur sicherheitsrelevanter Systeme für stabiles und sicheres Fahren."],
        ["Fahrzeugelektrik", "Fehlersuche, Beleuchtung und elektrische Ausstattung für Ihr Fahrzeug."],
        ["4x4, UTV und Umbauten", "Service, Ausstattung und Anfertigungen für Freizeit- und Arbeitsfahrzeuge."],
      ],
    },
    specialty: {
      kicker: "Ihr Spezialist in Coyhaique",
      title: "Lösungen für<br><em>DPF- und AdBlue-Systeme.</em>",
      intro: "Wir ermitteln die Fehlerursache und führen die erforderlichen Arbeiten am System mit Spezialausrüstung durch. Eine technische Lösung für Dieselfahrzeuge, die extremen Temperaturen, anspruchsvollen Strecken und den besonderen Bedingungen Patagoniens ausgesetzt sind.",
      badge: ["DPF", "AdBlue · SCR · ECU"],
      systems: [
        ["DPF-Systeme", "Diagnose, unterstützte Regeneration, Prüfung der Sensoren und Behebung von Fehlern am Dieselpartikelfilter."],
        ["AdBlue- und SCR-Systeme", "Diagnose und Prüfung von Dosierung, Sensoren, Pumpe und Injektor sowie Analyse der Fehlercodes im Abgasnachbehandlungssystem."],
        ["EGR und Ansaugung", "Technische Prüfung des Abgasrückführungssystems, der Stellglieder und der zugehörigen Komponenten."],
        ["ECU-Diagnose", "Elektronisches Auslesen, Datensicherung und fachgerechte Kalibrierung von Steuergeräten mit Spezialsoftware."],
      ],
      proof: ["Programmierung und Datensicherung mit Spezialausrüstung"],
      proofAlts: ["Technische Programmierung von AdBlue- und DPF-Systemen mit Alientech"],
      allianceLabel: "Technische Vertretung in Aysén",
      allianceTitle: "Adriazola 4WD ist technischer Partner von EcuLab in der Region Aysén.",
      allianceCopy: "Wir bieten spezialisierten Support für Fahrzeugelektronik und ECU-Kalibrierung in Coyhaique.",
      allianceLink: "EcuLab kennenlernen",
      cta: "DPF oder AdBlue anfragen",
      whatsapp: "Guten Tag, ich möchte eine Diagnose meines DPF- oder AdBlue-Systems anfragen.",
      imageAlt: "Laptop mit Software für Fahrzeugdiagnose und Steuergeräteprogrammierung bei Adriazola 4WD",
      logoAlt: "Logo von EcuLab, technischer Partner von Adriazola 4WD",
    },
    work: {
      kicker: "In der Werkstatt",
      title: "Die Qualität zeigt sich<br>im Detail.",
      intro: "Eine echte Auswahl an Fahrzeugen, Maschinen und Reparaturen aus unserer Werkstatt in Coyhaique.",
      captions: [
        ["Servicekapazitäten", "Mehrmarken-Werkstatt"],
        ["Sonderprojekte", "Klassiker und 4WD"],
        ["Fahrwerk und Vorderachse", "UTV-Service"],
        ["Zweitaktmotor · KTM 300", "Motorradmotoren"],
        ["Zahnräder und Synchronringe", "Getriebereparatur"],
        ["Elektrik und Ausstattung", "Spezialfahrzeuge"],
      ],
      footer: "Benötigt Ihr Fahrzeug eine Diagnose, Reparatur oder zusätzliche Ausstattung?",
      cta: "Per WhatsApp anfragen",
    },
    process: {
      kicker: "Unser Ablauf",
      title: "Klarheit ab dem<br>ersten Kontakt.",
      intro: "Zuerst verstehen wir, wie Ihr Fahrzeug genutzt wird. Danach legen wir die notwendigen Arbeiten fest und halten Sie jederzeit auf dem Laufenden.",
      steps: [
        ["Beschreiben Sie das Problem", "Senden Sie uns eine WhatsApp-Nachricht mit Fahrzeugmodell und gewünschtem Service."],
        ["Wir prüfen und beraten.", "Wir prüfen Ihr Fahrzeug und stimmen den erforderlichen Arbeitsumfang vor Beginn der Arbeiten mit Ihnen ab."],
        ["Service und Fahrzeugübergabe", "Wir führen die vereinbarten Arbeiten fachgerecht durch und erklären Ihnen bei der Übergabe alle durchgeführten Leistungen."],
      ],
    },
    quote: {
      kicker: "Beschreiben Sie Ihr Fahrzeug und Ihr Anliegen",
      title: "Was können wir<br><em>für Sie tun?</em>",
      intro: "Füllen Sie die Angaben aus – anschließend öffnet sich eine vorbereitete WhatsApp-Nachricht für unsere Werkstatt.",
      contacts: ["WhatsApp · Werkstattleitung", "Telefon der Werkstatt", "WhatsApp · Alternativer Kontakt"],
      labels: ["Ihr Name", "Ihr Fahrzeug", "Was benötigen Sie?"],
      placeholders: ["Wie heißen Sie?", "Marke, Modell und Baujahr", "Beschreiben Sie das Problem oder die Leistung…"],
      button: "WhatsApp-Nachricht vorbereiten",
      note: "Wir senden keine Daten automatisch. Sie bestätigen die Nachricht selbst in WhatsApp.",
    },
    reviews: {
      kicker: "Überprüfbare Bewertungen",
      title: "Das sagen<br>unsere Kunden.",
      rating: "37 Bewertungen auf Google",
      ratingAria: "Alle 37 Bewertungen von Adriazola 4WD auf Google ansehen",
      quotes: [
        "„Auf der Carretera Austral hatten wir in letzter Minute ein Problem mit dem Ölfilter. Wir riefen abends an und sollten am nächsten Morgen gleich als Erstes vorbeikommen. Pablo, der Besitzer, und sein Team lösten das Problem sofort. Besonders Reisenden, die eine schnelle Lösung brauchen, um ihre Reise fortzusetzen, kann ich den Service sehr empfehlen.“",
        "„Gegen Ende meines Urlaubs begann mein Auto ein seltsames Geräusch zu machen. Ich suchte mehrere Werkstätten auf, aber keine hatte Zeit. In Pablos Werkstatt wurde mir sofort geholfen. Seine Verfügbarkeit und die Freundlichkeit seines Teams sind besonders hervorzuheben; sie fanden das Problem und die Lösung noch im selben Moment.“",
        "„Sehr guter, effizienter und schneller Service. Mir wurde sofort geholfen: Ich hatte ein Problem mit einem Gleichlaufgelenk, und das Team besorgte das Ersatzteil. Innerhalb von zwei bis drei Stunden war das Problem gelöst. Ich empfehle die Werkstatt sowohl Menschen aus Coyhaique als auch Reisenden auf der Durchreise.“",
        "„Sehr empfehlenswert. Ich fühle mich gut aufgehoben. Kostenvoranschläge wurden immer eingehalten, und mein Fahrzeug wurde schnell und in einwandfreiem Zustand zurückgegeben.“",
      ],
      source: "Auf Google veröffentlichte Bewertung",
      footer: "Ausgewählte Bewertungen aus dem öffentlichen Google-Profil von Adriazola 4WD.",
      cta: "Bewertungen auf Google prüfen",
    },
    visit: {
      kicker: "Besuchen Sie uns",
      title: "Sie finden uns in<br>Los Maitenes 949.",
      days: ["Montag — Donnerstag", "Freitag", "Samstag — Sonntag"],
      closed: "Geschlossen",
      button: "In Google Maps öffnen",
    },
    footer: {
      tag: "Technischer Service · Ersatzteile · Ausstattung",
      links: ["Leistungen", "Unsere Arbeit", "Kontakt"],
      place: "Coyhaique · Chilenisches Patagonien",
      floating: "Anfragen",
    },
    a11y: {
      start: "Adriazola 4WD, Startseite",
      nav: "Hauptnavigation",
      openMenu: "Menü öffnen",
      closeMenu: "Menü schließen",
      selectLanguage: "Sprache auswählen",
      languages: "Sprachen",
      facts: "Wichtige Leistungen",
      stars: "5 von 5 Sternen",
      map: "Standort von Adriazola 4WD in Coyhaique",
      whatsapp: "Angebot per WhatsApp anfragen",
      heroAlt: "Gesamtansicht der Autowerkstatt Adriazola 4WD in Coyhaique",
      alts: [
        "Innenansicht der Werkstatt Adriazola 4WD mit Fahrzeugen im Service",
        "Klassisches Fahrzeug und Toyota 4x4 in der Werkstatt",
        "UTV-Fahrwerk während der Reparatur",
        "Geöffneter Zweitakt-Motorradmotor einer KTM 300 während der Reparatur",
        "Geöffnetes Getriebe mit sichtbaren Zahnrädern und Synchronringen",
        "Grüner Van beim technischen Service in der Werkstatt Adriazola 4WD",
      ],
    },
    whatsapp: {
      direct: "Hallo, ich möchte eine Arbeit für mein Fahrzeug anfragen.",
      floating: "Hallo, ich möchte ein Angebot für mein Fahrzeug anfragen.",
      form: ["Hallo, ich möchte ein Angebot für einen Service anfragen.", "Name", "Fahrzeug", "Benötigte Leistung"],
    },
  },
};

let currentLanguage = "es";

const setText = (selector, value) => {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element, index) => {
    element.textContent = Array.isArray(value) ? value[index] : value;
  });
};

const setHtml = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.innerHTML = value;
};

const setLeadingText = (selector, value) => {
  const element = document.querySelector(selector);
  if (!element) return;
  const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  if (textNode) textNode.nodeValue = `${value} `;
};

const setCards = (selector, values, titleSelector, copySelector) => {
  document.querySelectorAll(selector).forEach((card, index) => {
    const value = values[index];
    if (!value) return;
    const title = card.querySelector(titleSelector);
    const copy = card.querySelector(copySelector);
    if (title) title.textContent = value[0];
    if (copy) copy.textContent = value[1];
  });
};

const updateLanguageUrl = (language) => {
  const url = new URL(window.location.href);
  if (language === "es") url.searchParams.delete("lang");
  else url.searchParams.set("lang", language);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
};

const applyLanguage = (language, updateUrl = false) => {
  const selected = translations[language] ? language : "es";
  const t = translations[selected];
  currentLanguage = selected;

  document.documentElement.lang = selected;
  document.title = t.seo.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", t.seo.description);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", t.seo.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", t.seo.ogDescription);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", t.seo.title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", t.seo.ogDescription);

  setText(".brand small", t.brandTag);
  setText("nav > a:not(.nav-cta)", t.nav);
  setText("nav .nav-cta", t.navCta);

  setText(".hero .eyebrow", t.hero.eyebrow);
  setHtml(".hero h1", t.hero.title);
  setText(".hero-copy", t.hero.copy);
  setLeadingText(".hero-actions .primary", t.hero.primary);
  setLeadingText(".hero-actions .text-link", t.hero.secondary);
  document.querySelectorAll(".hero-facts div").forEach((fact, index) => {
    fact.querySelector("b").textContent = t.hero.facts[index][0];
    fact.querySelector("span").textContent = t.hero.facts[index][1];
  });

  setText(".manifesto .kicker", t.manifesto.kicker);
  setHtml(".manifesto h2", t.manifesto.title);
  setText(".manifesto-copy > p", t.manifesto.copy);
  setText(".address small", t.manifesto.location);

  setText(".services .kicker", t.services.kicker);
  setHtml(".services .section-heading h2", t.services.title);
  setText(".services .section-heading > p", t.services.intro);
  setCards(".service-card", t.services.cards, "h3", "p");

  setText(".emissions .kicker", t.specialty.kicker);
  setHtml(".emissions h2", t.specialty.title);
  setText(".emissions-lead", t.specialty.intro);
  setText(".emissions-badge strong", t.specialty.badge[0]);
  setText(".emissions-badge span", t.specialty.badge[1]);
  setCards(".systems-grid article", t.specialty.systems, "h3", "p");
  setText(".diagnostic-proof figcaption", t.specialty.proof);
  document.querySelectorAll(".diagnostic-proof img").forEach((image, index) => image.setAttribute("alt", t.specialty.proofAlts[index]));
  setText(".technical-alliance small", t.specialty.allianceLabel);
  setText(".technical-alliance h3", t.specialty.allianceTitle);
  setText(".technical-alliance p", t.specialty.allianceCopy);
  setLeadingText(".technical-alliance a", t.specialty.allianceLink);
  setLeadingText(".emissions-cta", t.specialty.cta);
  document.querySelector(".emissions-media > img")?.setAttribute("alt", t.specialty.imageAlt);
  document.querySelector(".technical-alliance > img")?.setAttribute("alt", t.specialty.logoAlt);
  const specialtyLink = document.querySelector(".emissions-cta");
  if (specialtyLink) specialtyLink.href = `https://wa.me/56984484274?text=${encodeURIComponent(t.specialty.whatsapp)}`;

  setText(".work .kicker", t.work.kicker);
  setHtml(".work .section-heading h2", t.work.title);
  setText(".work .section-heading > p", t.work.intro);
  setCards(".project", t.work.captions, "figcaption h3", "figcaption span");
  document.querySelectorAll(".project").forEach((project, index) => {
    project.querySelector("figcaption span").textContent = t.work.captions[index][0];
    project.querySelector("figcaption h3").textContent = t.work.captions[index][1];
  });
  setText(".work-footer p", t.work.footer);
  setLeadingText(".work-footer a", t.work.cta);

  setText(".process .kicker", t.process.kicker);
  setHtml(".process .section-heading h2", t.process.title);
  setText(".process .section-heading > p", t.process.intro);
  setCards(".steps article", t.process.steps, "h3", "p");

  setText(".quote .kicker", t.quote.kicker);
  setHtml(".quote h2", t.quote.title);
  setText(".quote-copy > p:not(.kicker)", t.quote.intro);
  setText(".contact-lines small", t.quote.contacts);
  document.querySelectorAll(".quote-form label").forEach((label, index) => {
    const textNode = [...label.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (textNode) textNode.nodeValue = `${t.quote.labels[index]} `;
  });
  const formFields = document.querySelectorAll(".quote-form input, .quote-form textarea");
  formFields.forEach((field, index) => field.setAttribute("placeholder", t.quote.placeholders[index]));
  setLeadingText(".quote-form .button", t.quote.button);
  setText(".quote-form > small", t.quote.note);

  setText(".reviews .kicker", t.reviews.kicker);
  setHtml(".reviews h2", t.reviews.title);
  setText(".rating-detail small", t.reviews.rating);
  setText(".review-card blockquote", t.reviews.quotes);
  setText(".review-card footer span", t.reviews.source);
  setText(".reviews-footer p", t.reviews.footer);
  setLeadingText(".reviews-footer a", t.reviews.cta);
  document.querySelector(".rating-number").textContent = selected === "en" ? "4.5" : "4,5";

  setText(".visit .kicker", t.visit.kicker);
  setHtml(".visit h2", t.visit.title);
  setText(".hours span", t.visit.days);
  setText(".hours div:nth-child(3) b", t.visit.closed);
  setLeadingText(".visit .button", t.visit.button);

  setText(".footer-brand small", t.footer.tag);
  setText(".footer-links a", t.footer.links);
  setText(".footer-bottom > span:nth-child(2)", t.footer.place);
  setText(".floating-whatsapp span", t.footer.floating);

  document.querySelector(".brand")?.setAttribute("aria-label", t.a11y.start);
  navigation?.setAttribute("aria-label", t.a11y.nav);
  menuButton?.setAttribute("aria-label", navigation?.classList.contains("open") ? t.a11y.closeMenu : t.a11y.openMenu);
  languageCurrent?.setAttribute("aria-label", t.a11y.selectLanguage);
  languageMenu?.setAttribute("aria-label", t.a11y.languages);
  document.querySelector(".hero-facts")?.setAttribute("aria-label", t.a11y.facts);
  document.querySelector(".google-rating")?.setAttribute("aria-label", t.reviews.ratingAria);
  document.querySelectorAll(".review-stars").forEach((stars) => stars.setAttribute("aria-label", t.a11y.stars));
  document.querySelector(".visit iframe")?.setAttribute("title", t.a11y.map);
  document.querySelector(".floating-whatsapp")?.setAttribute("aria-label", t.a11y.whatsapp);
  document.querySelector(".hero-image")?.setAttribute("alt", t.a11y.heroAlt);
  document.querySelectorAll(".project img").forEach((image, index) => image.setAttribute("alt", t.a11y.alts[index]));

  const mapFrame = document.querySelector(".visit iframe");
  if (mapFrame) mapFrame.src = `https://www.google.com/maps?q=Los%20Maitenes%20949%2C%20Coyhaique&output=embed&hl=${selected}`;

  const directLink = document.querySelector(".work-footer a");
  if (directLink) directLink.href = `https://wa.me/56984484274?text=${encodeURIComponent(t.whatsapp.direct)}`;
  const floatingLink = document.querySelector(".floating-whatsapp");
  if (floatingLink) floatingLink.href = `https://wa.me/56984484274?text=${encodeURIComponent(t.whatsapp.floating)}`;

  const meta = languageMeta[selected];
  const currentImage = languageCurrent?.querySelector("img");
  const currentCode = languageCurrent?.querySelector("span");
  if (currentImage) currentImage.src = meta.flag;
  if (currentCode) currentCode.textContent = meta.code;
  languageButtons.forEach((button) => button.setAttribute("aria-current", String(button.dataset.language === selected)));

  localStorage.setItem("adriazola-language", selected);
  if (updateUrl) updateLanguageUrl(selected);
};

menuButton?.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? translations[currentLanguage].a11y.closeMenu : translations[currentLanguage].a11y.openMenu);
  languagePicker?.classList.remove("open");
  languageCurrent?.setAttribute("aria-expanded", "false");
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", translations[currentLanguage].a11y.openMenu);
  });
});

languageCurrent?.addEventListener("click", () => {
  const isOpen = languagePicker.classList.toggle("open");
  languageCurrent.setAttribute("aria-expanded", String(isOpen));
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.language, true);
    languagePicker.classList.remove("open");
    languageCurrent.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (event) => {
  if (!languagePicker?.contains(event.target)) {
    languagePicker?.classList.remove("open");
    languageCurrent?.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    languagePicker?.classList.remove("open");
    languageCurrent?.setAttribute("aria-expanded", "false");
  }
});

quoteForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const labels = translations[currentLanguage].whatsapp.form;
  const message = [
    labels[0],
    `${labels[1]}: ${data.get("name")}`,
    `${labels[2]}: ${data.get("vehicle")}`,
    `${labels[3]}: ${data.get("service")}`,
  ].join("\n");
  window.open(`https://wa.me/56984484274?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
});

document.querySelector("#year").textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const languageFromUrl = new URLSearchParams(window.location.search).get("lang");
const storedLanguage = localStorage.getItem("adriazola-language");
const browserLanguage = navigator.language?.slice(0, 2);
const initialLanguage = translations[languageFromUrl]
  ? languageFromUrl
  : translations[storedLanguage]
    ? storedLanguage
    : translations[browserLanguage]
      ? browserLanguage
      : "es";

applyLanguage(initialLanguage);
