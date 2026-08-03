import { getPeriodRange, toISODate } from "@/utils/dateUtils";

// Se pasa la fecha "hoy" explícitamente para que los tests no dependan del día
// en que se corren. Se construyen con new Date(y, m, d) (hora local) porque
// getPeriodRange trabaja en hora local.
describe("getPeriodRange", () => {
  describe("semana (lunes a domingo)", () => {
    it("un miércoles devuelve el lunes y el domingo de esa semana", () => {
      // 2026-08-05 es miércoles
      expect(getPeriodRange("week", new Date(2026, 7, 5))).toEqual({
        from: "2026-08-03",
        to: "2026-08-09",
      });
    });

    it("un domingo sigue perteneciendo a la semana que empezó el lunes", () => {
      // 2026-08-09 es domingo
      expect(getPeriodRange("week", new Date(2026, 7, 9))).toEqual({
        from: "2026-08-03",
        to: "2026-08-09",
      });
    });

    it("un lunes devuelve ese mismo día como inicio", () => {
      expect(getPeriodRange("week", new Date(2026, 7, 3))).toEqual({
        from: "2026-08-03",
        to: "2026-08-09",
      });
    });

    it("la semana pasada cruza el fin de mes", () => {
      // martes 2026-08-04 → semana anterior: 27/07 a 02/08
      expect(getPeriodRange("lastWeek", new Date(2026, 7, 4))).toEqual({
        from: "2026-07-27",
        to: "2026-08-02",
      });
    });

    it("la semana pasada cruza el fin de año", () => {
      // viernes 2027-01-01 → semana anterior: 21/12/2026 a 27/12/2026
      expect(getPeriodRange("lastWeek", new Date(2027, 0, 1))).toEqual({
        from: "2026-12-21",
        to: "2026-12-27",
      });
    });
  });

  describe("mes", () => {
    it("devuelve el primer y el último día del mes en curso", () => {
      expect(getPeriodRange("month", new Date(2026, 7, 20))).toEqual({
        from: "2026-08-01",
        to: "2026-08-31",
      });
    });

    it("resuelve el último día en meses de 30 días", () => {
      expect(getPeriodRange("month", new Date(2026, 3, 15))).toEqual({
        from: "2026-04-01",
        to: "2026-04-30",
      });
    });

    it("resuelve febrero en año bisiesto", () => {
      expect(getPeriodRange("month", new Date(2028, 1, 10))).toEqual({
        from: "2028-02-01",
        to: "2028-02-29",
      });
    });

    it("el mes pasado desde enero cruza al año anterior", () => {
      expect(getPeriodRange("lastMonth", new Date(2027, 0, 15))).toEqual({
        from: "2026-12-01",
        to: "2026-12-31",
      });
    });
  });
});

describe("toISODate", () => {
  it("usa el día local y no desplaza por UTC", () => {
    // 23:30 local del 31/12: toISOString() daría el 1 de enero en husos
    // negativos; toISODate debe seguir devolviendo el 31.
    expect(toISODate(new Date(2026, 11, 31, 23, 30))).toBe("2026-12-31");
  });

  it("rellena mes y día con cero", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
