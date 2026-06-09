#!/usr/bin/env python
"""Matriz 5x5 de scatter plots del frente de Pareto de la optimización NSGA-II.

Genera una matriz de dispersión (scatter matrix / pairplot) de las 5 funciones
objetivo del modelo de reordenamiento territorial, al estilo de Han y Xia (2024):

  - Diagonal: cajas con el nombre del objetivo.
  - Fuera de la diagonal: dispersión de cada par de objetivos (todas las
    soluciones no dominadas del frente final como puntos azules).
  - La solución óptima (mínimo score compuesto) resaltada en rojo, ~3x el tamaño.

Uso:
    python scripts/pareto_matrix.py [--district san_juan_de_miraflores]

Los datos se leen de outputs/<district>/result.json (campo "pareto"), que es el
frente FINAL generado por run_reordering_optimization_all_categories().
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import sys

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator

# --- Estilo (coherente con los gráficos previos de la tesis) ---
COLOR_FRONT = "#5a8caf"   # azul académico — soluciones del frente
COLOR_BEST = "#c14242"    # rojo — solución óptima seleccionada
COLOR_AXES = "#cccccc"    # gris claro — ejes/marco
COLOR_DIAG_BG = "#f2f2f2" # fondo de las cajas de la diagonal

# Las 5 funciones objetivo (clave en el DataFrame -> etiqueta en español).
# 'change_ratio' ya se almacena como valor CRUDO (F[:,4] / 5.0 en optimization.py),
# por lo que NO se vuelve a dividir entre 5: representa f_cambio sin penalizar.
OBJECTIVES = [
    ("1-cov_health", "Salud"),
    ("1-cov_education", "Educación"),
    ("1-cov_greens", "Áreas verdes"),
    ("1-cov_work", "Trabajo"),
    ("change_ratio", "Cambio territorial"),
]

TITLE = "Matriz del frente de Pareto resultante de NSGA-II"


def load_result(result_path: str):
    """Carga el frente de Pareto y el espacio explorado desde result.json.

    Devuelve (front_df, explored_df, place). 'explored_df' es la nube de todas
    las soluciones evaluadas por NSGA-II; está vacío para corridas antiguas que
    no la guardaron.
    """
    with open(result_path, encoding="utf-8") as fh:
        data = json.load(fh)

    records = data.get("pareto")
    if not records:
        raise SystemExit(
            f"[ERROR] {result_path} no contiene un frente de Pareto.\n"
            "        Vuelve a ejecutar la optimización para ese distrito."
        )

    front = pd.DataFrame(records)
    missing = [k for k, _ in OBJECTIVES if k not in front.columns]
    if missing:
        raise SystemExit(f"[ERROR] Faltan columnas en el frente: {missing}")

    # score compuesto: si no viene, se recalcula con la fórmula de la metodología
    # (sec. 4.1.3.8): suma de los 4 déficits normalizados + 5 * cambio normalizado.
    if "score" not in front.columns or front["score"].isna().all():
        deficits = front[[k for k, _ in OBJECTIVES[:4]]]
        norm = (deficits - deficits.min()) / (deficits.max() - deficits.min() + 1e-9)
        norm_chg = front["change_ratio"] / (front["change_ratio"].max() + 1e-9)
        front["score"] = norm.sum(axis=1) + 5.0 * norm_chg

    explored = pd.DataFrame(data.get("explored") or [])

    return front, explored, data.get("place", "")


def _decimals_for(span: float) -> int:
    """2 o 3 decimales según la escala del eje."""
    return 3 if span < 0.1 else 2


def build_matrix(front: pd.DataFrame, explored: pd.DataFrame, place: str,
                 out_png: str, out_pdf: str | None):
    keys = [k for k, _ in OBJECTIVES]
    labels = [lbl for _, lbl in OBJECTIVES]
    n = len(keys)

    # Nube a graficar: espacio explorado si está disponible, si no el frente.
    cloud = explored if explored is not None and not explored.empty else front
    has_explored = explored is not None and not explored.empty

    # Índice de la solución óptima (mínimo score compuesto) — siempre del frente
    best_pos = int(front["score"].astype(float).idxmin())
    best = front.loc[best_pos]

    # Límites por variable (compartidos por fila/columna), con margen del 8 %,
    # calculados sobre la nube para que toda la exploración quepa.
    lims, decs = {}, {}
    for k in keys:
        vmin, vmax = float(cloud[k].min()), float(cloud[k].max())
        span = vmax - vmin
        pad = span * 0.08 if span > 0 else (abs(vmax) * 0.08 or 0.01)
        lims[k] = (vmin - pad, vmax + pad)
        decs[k] = _decimals_for(span if span > 0 else abs(vmax) or 1.0)

    fig, axes = plt.subplots(n, n, figsize=(12, 12))
    fig.patch.set_facecolor("white")

    for r in range(n):
        for c in range(n):
            ax = axes[r, c]
            ax.set_facecolor("white")
            ax.set_box_aspect(1)  # sub-gráfico cuadrado
            for spine in ax.spines.values():
                spine.set_color(COLOR_AXES)
                spine.set_linewidth(0.8)

            if r == c:
                # Diagonal: caja con el nombre del objetivo
                ax.add_patch(plt.Rectangle(
                    (0.06, 0.30), 0.88, 0.40, transform=ax.transAxes,
                    facecolor=COLOR_DIAG_BG, edgecolor=COLOR_AXES, linewidth=0.8,
                ))
                ax.text(0.5, 0.5, labels[r], transform=ax.transAxes,
                        ha="center", va="center", fontsize=12, fontweight="bold",
                        color="#333333", wrap=True)
                ax.set_xticks([]); ax.set_yticks([])
            else:
                # Fuera de diagonal: x = variable de la columna, y = variable de la fila
                xk, yk = keys[c], keys[r]
                # Nube explorada (puntos pequeños) o frente si no hay exploración
                ssize = 6 if has_explored else 16
                salpha = 0.35 if has_explored else 0.6
                ax.scatter(cloud[xk], cloud[yk], s=ssize, c=COLOR_FRONT, alpha=salpha,
                           edgecolors="none", zorder=2)
                # Solución óptima: rojo, mayor tamaño, encima
                ax.scatter(best[xk], best[yk], s=48, c=COLOR_BEST,
                           edgecolors="white", linewidths=0.6, zorder=3)
                ax.set_xlim(*lims[xk]); ax.set_ylim(*lims[yk])
                ax.xaxis.set_major_locator(MaxNLocator(3))
                ax.yaxis.set_major_locator(MaxNLocator(3))
                ax.tick_params(labelsize=7, color=COLOR_AXES, length=3)
                ax.xaxis.set_major_formatter(
                    plt.FuncFormatter(lambda v, _p, d=decs[xk]: f"{v:.{d}f}"))
                ax.yaxis.set_major_formatter(
                    plt.FuncFormatter(lambda v, _p, d=decs[yk]: f"{v:.{d}f}"))
                ax.grid(True, color="#eeeeee", linewidth=0.6, zorder=0)

            # Etiquetas solo en los bordes externos (estilo pairplot)
            if r == n - 1:
                ax.set_xlabel(labels[c], fontsize=10, color="#333333")
            if c == 0:
                ax.set_ylabel(labels[r], fontsize=10, color="#333333")
            # Oculta los números de los ejes internos para reducir saturación
            if r != n - 1:
                ax.set_xticklabels([])
            if c != 0:
                ax.set_yticklabels([])

    fig.suptitle(TITLE, fontsize=16, fontweight="bold", color="#333333", y=0.965)

    # Leyenda compacta (nube vs óptima)
    cloud_label = (f"Espacio explorado ({len(cloud)} puntos)" if has_explored
                   else f"Frente de Pareto (n = {len(front)})")
    handles = [
        plt.Line2D([0], [0], marker="o", linestyle="", markersize=6,
                   markerfacecolor=COLOR_FRONT, markeredgecolor="none",
                   alpha=0.6, label=cloud_label),
        plt.Line2D([0], [0], marker="o", linestyle="", markersize=9,
                   markerfacecolor=COLOR_BEST, markeredgecolor="white",
                   label="Solución óptima (mín. score)"),
    ]
    fig.legend(handles=handles, loc="upper right", frameon=False,
               fontsize=10, bbox_to_anchor=(0.985, 0.945))

    fig.tight_layout(rect=[0.0, 0.0, 1.0, 0.95])

    os.makedirs(os.path.dirname(out_png), exist_ok=True)
    fig.savefig(out_png, dpi=300, bbox_inches="tight", facecolor="white")
    if out_pdf:
        fig.savefig(out_pdf, bbox_inches="tight", facecolor="white")
    plt.close(fig)

    return best_pos, best


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--district", default="san_juan_de_miraflores",
                        help="Carpeta del distrito bajo outputs/ (def: san_juan_de_miraflores)")
    parser.add_argument("--result", default=None,
                        help="Ruta explícita a un result.json (anula --district)")
    args = parser.parse_args()

    repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    result_path = args.result or os.path.join(repo, "outputs", args.district, "result.json")
    if not os.path.exists(result_path):
        raise SystemExit(f"[ERROR] No existe: {result_path}")

    mtime = _dt.datetime.fromtimestamp(os.path.getmtime(result_path))
    front, explored, place = load_result(result_path)

    out_dir = os.path.join(os.path.dirname(result_path), "charts")
    out_png = os.path.join(out_dir, "pareto_matrix.png")
    out_pdf = os.path.join(out_dir, "pareto_matrix.pdf")
    out_csv = os.path.join(out_dir, "pareto_front.csv")

    print(f"Distrito : {place or args.district}")
    print(f"Fuente   : {result_path}")
    print(f"Ejecución: {mtime:%Y-%m-%d %H:%M:%S} (más reciente disponible)")
    print(f"Soluciones en el frente: N = {len(front)}")
    if not explored.empty:
        print(f"Espacio explorado: {len(explored)} puntos (todas las generaciones)")
    else:
        print("Espacio explorado: no disponible (corrida antigua) — se grafica el frente")

    best_pos, best = build_matrix(front, explored, place, out_png, out_pdf)

    # Exporta el frente cargado a CSV para el registro de la tesis
    os.makedirs(out_dir, exist_ok=True)
    front.to_csv(out_csv, index=False)

    print(f"\nSolución óptima: solution_index = {int(best['solution_index'])}, "
          f"score = {float(best['score']):.4f}")
    print("  déficit salud      :", f"{best['1-cov_health']:.3f}")
    print("  déficit educación  :", f"{best['1-cov_education']:.3f}")
    print("  déficit áreas verdes:", f"{best['1-cov_greens']:.3f}")
    print("  déficit trabajo    :", f"{best['1-cov_work']:.3f}")
    print("  cambio territorial :", f"{best['change_ratio']:.3f} (crudo)")
    print(f"\nGuardado:\n  {out_png}\n  {out_pdf}\n  {out_csv}")


if __name__ == "__main__":
    main()
