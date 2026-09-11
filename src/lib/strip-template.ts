// The parts that typically come off a stripped passenger car. Offered as a
// ticked list when stripping a car; anything that doesn't apply is unticked.
// Names follow the "Part, side" style used elsewhere so search stays consistent.

export const STRIP_TEMPLATE: { group: string; parts: string[] }[] = [
  {
    group: "Front",
    parts: [
      "Bumper, front", "Bonnet", "Grille", "Headlight, left", "Headlight, right",
      "Fog light, left", "Fog light, right", "Fender, front left", "Fender, front right", "Radiator support",
    ],
  },
  {
    group: "Rear",
    parts: ["Bumper, rear", "Boot lid / tailgate", "Tail light, left", "Tail light, right", "Rear spoiler", "Number plate light"],
  },
  {
    group: "Doors & mirrors",
    parts: [
      "Door, front left", "Door, front right", "Door, rear left", "Door, rear right",
      "Wing mirror, left", "Wing mirror, right",
      "Window regulator, front left", "Window regulator, front right", "Window regulator, rear left", "Window regulator, rear right",
    ],
  },
  {
    group: "Glass",
    parts: [
      "Windscreen", "Rear windscreen",
      "Door glass, front left", "Door glass, front right", "Door glass, rear left", "Door glass, rear right",
    ],
  },
  {
    group: "Engine & cooling",
    parts: [
      "Engine", "Turbocharger", "Alternator", "Starter motor", "Radiator", "Radiator fan", "Intercooler",
      "Water pump", "Fuel pump", "Fuel injectors", "Throttle body", "Intake manifold", "Air filter box",
      "Engine ECU", "Engine wiring harness", "Aircon compressor", "Aircon condenser", "Power steering pump",
    ],
  },
  {
    group: "Gearbox & drivetrain",
    parts: ["Gearbox", "Clutch kit", "Driveshaft, left", "Driveshaft, right"],
  },
  {
    group: "Suspension, steering & brakes",
    parts: [
      "Shock absorber, front left", "Shock absorber, front right", "Shock absorber, rear left", "Shock absorber, rear right",
      "Control arm, front left", "Control arm, front right", "Steering rack",
      "Brake caliper, front left", "Brake caliper, front right", "ABS pump",
    ],
  },
  {
    group: "Wheels",
    parts: ["Wheels, set of 4", "Spare wheel"],
  },
  {
    group: "Interior",
    parts: [
      "Seat, driver", "Seat, passenger", "Seat, rear", "Dashboard", "Instrument cluster", "Radio / infotainment",
      "Steering wheel", "Airbag, driver", "Airbag, passenger", "Seat belts", "Centre console",
      "Door card, front left", "Door card, front right", "Door card, rear left", "Door card, rear right",
      "Headliner", "Carpet set",
    ],
  },
  {
    group: "Electrical",
    parts: ["Battery", "Fuse box", "Wiper motor, front", "Wiper motor, rear", "Horn", "Window switches", "Key and immobiliser"],
  },
  {
    group: "Exhaust",
    parts: ["Catalytic converter", "Exhaust silencer"],
  },
];
