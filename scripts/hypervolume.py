#!/usr/bin/env python
"""Hipervolumen (HV) del frente de Pareto y del espacio explorado por NSGA-II.

Métrica de calidad estándar en optimización multiobjetivo (Zitzler y Thiele, 1998).
Se calcula sobre los 5 objetivos a minimizar (f_salud, f_educacion, f_verdes,
f_trabajo, f_cambio).

Convenciones:
  - Normalización min-max al rango [0,1] por objetivo, en un MARCO COMÚN: se usan
    el min/max del espacio explorado (que acota toda la búsqueda) para normalizar
    TANTO el frente como el explorado, de modo que ambos HV sean comparables.
    (Un objetivo con rango cero se fija en 0; no aporta variación.)
  - Punto de referencia: peor valor normalizado (1.0) + 0.1 = 1.1 en cada
    objetivo. Debe ser dominado por todas las soluciones (convención de pymoo).
  - f_cambio: la escala (×5) es irrelevante tras la normalización min-max.

Uso: python scripts/hypervolume.py [--district san_juan_de_miraflores]
"""
from __future__ import annotations
import argparse, json, os
import numpy as np
from pymoo.config import Config
Config.warnings['not_compiled'] = False
from pymoo.indicators.hv import HV

COLS = ['1-cov_health', '1-cov_education', '1-cov_greens', '1-cov_work', 'change_ratio']
NAMES = ['f_salud', 'f_educacion', 'f_verdes', 'f_trabajo', 'f_cambio']
REF_MARGIN = 0.1  # ref = 1.0 (peor normalizado) + 0.1


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--district", default="san_juan_de_miraflores")
    args = ap.parse_args()

    repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(repo, "outputs", args.district, "result.json")
    d = json.load(open(path, encoding="utf-8"))

    F_front = np.array([[p[c] for c in COLS] for p in d.get('pareto', [])], dtype=float)
    F_expl = np.array([[p[c] for c in COLS] for p in d.get('explored', [])], dtype=float)
    if F_expl.size == 0:
        F_expl = F_front  # corridas antiguas sin espacio explorado

    # Marco de normalización común (min/max del explorado)
    lo, hi = F_expl.min(axis=0), F_expl.max(axis=0)
    rng = hi - lo

    def norm(F):
        Z = np.zeros_like(F)
        for j in range(F.shape[1]):
            Z[:, j] = 0.0 if rng[j] == 0 else (F[:, j] - lo[j]) / rng[j]
        return Z

    ref = np.full(len(COLS), 1.0 + REF_MARGIN)
    hv = HV(ref_point=ref)
    hv_front = float(hv(norm(F_front)))
    hv_expl = float(hv(norm(F_expl)))
    hv_max = float(np.prod(ref))

    print(f"Distrito: {d.get('place', args.district)}")
    print(f"Frente final: {len(F_front)} sol. ({np.unique(F_front, axis=0).shape[0]} únicas) | "
          f"Explorado: {len(F_expl)} sol. ({np.unique(F_expl, axis=0).shape[0]} únicas)")
    print(f"Punto de referencia (normalizado): {ref.tolist()}")
    print(f"HV máximo teórico (1.1^5): {hv_max:.5f}")
    print(f"HV frente final     : {hv_front:.5f}  ({100*hv_front/hv_max:.2f}% del máx)")
    print(f"HV espacio explorado: {hv_expl:.5f}  ({100*hv_expl/hv_max:.2f}% del máx)")
    print(f"Diferencia: {hv_expl - hv_front:.6f}")


if __name__ == "__main__":
    main()
