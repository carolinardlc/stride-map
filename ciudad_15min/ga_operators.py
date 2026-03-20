"""Operadores genéticos para NSGA-II (todas las categorías)"""

import numpy as np

from pymoo.core.sampling import Sampling
from pymoo.core.repair import Repair
from pymoo.core.crossover import Crossover
from pymoo.core.mutation import Mutation

try:
    from pymoo.config import Config
    Config.warnings['not_compiled'] = False
except Exception:
    pass

from ciudad_15min.constants import ALL_CATEGORY_IDS


class FeasibleSamplingAllCategories(Sampling):
    """Inicialización para todas las categorías: 0=hogar, 1=health, 2=education, 3=greens, 4=work

    Genera soluciones cercanas a la configuración inicial con un porcentaje controlado de cambios.
    """

    def __init__(self, n_homes: int, n_health: int, n_education: int, n_greens: int, n_work: int,
                 initial_change_percentage: float = 0.02):
        super().__init__()
        self.n_homes = n_homes
        self.n_health = n_health
        self.n_education = n_education
        self.n_greens = n_greens
        self.n_work = n_work
        self.initial_change_percentage = initial_change_percentage

    def _do(self, problem, n_samples, **kwargs):
        n_var = problem.n_var
        X = np.zeros((n_samples, n_var), dtype=int)

        # Obtener configuración inicial del problema
        if hasattr(problem, 'initial_config'):
            initial_config = problem.initial_config.copy()
        else:
            initial_config = None

        rng = np.random.default_rng()
        total_assigned = self.n_homes + self.n_health + self.n_education + self.n_greens + self.n_work

        if total_assigned > n_var:
            raise ValueError(f"Total asignado ({total_assigned}) excede número de variables ({n_var})")

        for i in range(n_samples):
            if initial_config is not None:
                x = initial_config.copy()

                n_changes = int(n_var * self.initial_change_percentage)
                n_changes = max(1, min(n_changes, n_var // 2))

                for _ in range(n_changes):
                    type1, type2 = rng.choice(ALL_CATEGORY_IDS, size=2, replace=False)

                    type1_indices = np.where(x == type1)[0]
                    type2_indices = np.where(x == type2)[0]

                    if len(type1_indices) > 0 and len(type2_indices) > 0:
                        idx1 = rng.choice(type1_indices)
                        idx2 = rng.choice(type2_indices)
                        x[idx1], x[idx2] = x[idx2], x[idx1]
            else:
                x = np.zeros(n_var, dtype=int)
                indices = np.arange(n_var)
                rng.shuffle(indices)

                start = 0
                for cat_id, count in enumerate([self.n_homes, self.n_health, self.n_education, self.n_greens, self.n_work]):
                    if count > 0:
                        x[indices[start:start+count]] = cat_id
                        start += count

            X[i] = x

        return X


class FeasibleRepairAllCategories(Repair):
    """Reparador para todas las categorías: mantiene números correctos de cada tipo"""

    def __init__(self, n_homes: int, n_health: int, n_education: int, n_greens: int, n_work: int):
        super().__init__()
        self.targets = {
            0: n_homes,
            1: n_health,
            2: n_education,
            3: n_greens,
            4: n_work
        }

    def _do(self, problem, X, **kwargs):
        X_repaired = X.copy()
        rng = np.random.default_rng()

        for i, x in enumerate(X):
            actuals = {tid: int((x == tid).sum()) for tid in ALL_CATEGORY_IDS}

            for type_id in ALL_CATEGORY_IDS:
                diff = actuals[type_id] - self.targets[type_id]

                if diff != 0:
                    if diff > 0:
                        type_indices = np.where(x == type_id)[0]
                        to_convert = rng.choice(type_indices, size=diff, replace=False)

                        for other_type in ALL_CATEGORY_IDS:
                            if other_type != type_id and actuals[other_type] < self.targets[other_type]:
                                needed = self.targets[other_type] - actuals[other_type]
                                convert_count = min(needed, len(to_convert))
                                if convert_count > 0:
                                    x[to_convert[:convert_count]] = other_type
                                    actuals[other_type] += convert_count
                                    actuals[type_id] -= convert_count
                                    to_convert = to_convert[convert_count:]
                                    if len(to_convert) == 0:
                                        break
                    else:
                        needed = -diff
                        for other_type in ALL_CATEGORY_IDS:
                            if other_type != type_id and actuals[other_type] > self.targets[other_type]:
                                available = actuals[other_type] - self.targets[other_type]
                                convert_count = min(needed, available)
                                if convert_count > 0:
                                    other_indices = np.where(x == other_type)[0]
                                    to_convert = rng.choice(other_indices, size=convert_count, replace=False)
                                    x[to_convert] = type_id
                                    actuals[type_id] += convert_count
                                    actuals[other_type] -= convert_count
                                    needed -= convert_count
                                    if needed == 0:
                                        break

            X_repaired[i] = x

        return X_repaired


class FeasibleCrossoverAllCategories(Crossover):
    """Crossover para variables categóricas que mantiene números correctos de cada tipo"""

    def __init__(self, n_homes: int, n_health: int, n_education: int, n_greens: int, n_work: int, prob=0.9):
        super().__init__(2, 2)
        self.targets = {
            0: n_homes,
            1: n_health,
            2: n_education,
            3: n_greens,
            4: n_work
        }
        self.prob = prob

    def _do(self, problem, X, **kwargs):
        n_parents, n_matings, n_var = X.shape
        n_offsprings = 2
        X_off = np.zeros((n_offsprings, n_matings, n_var), dtype=int)

        rng = np.random.default_rng()

        for k in range(n_matings):
            p1, p2 = X[0, k], X[1, k]

            for o in range(n_offsprings):
                if rng.random() < self.prob:
                    diff_mask = (p1 != p2)
                    diff_indices = np.where(diff_mask)[0]

                    if len(diff_indices) > 0:
                        n_swaps = max(1, int(len(diff_indices) * 0.3))
                        swap_indices = rng.choice(diff_indices, size=min(n_swaps, len(diff_indices)), replace=False)

                        if o == 0:
                            offspring = p1.copy()
                            offspring[swap_indices] = p2[swap_indices]
                        else:
                            offspring = p2.copy()
                            offspring[swap_indices] = p1[swap_indices]
                    else:
                        offspring = p1.copy() if o == 0 else p2.copy()
                else:
                    offspring = p1.copy() if o == 0 else p2.copy()

                # Verificar y corregir si hay desbalance significativo
                actuals = {tid: int((offspring == tid).sum()) for tid in ALL_CATEGORY_IDS}

                total_diff = sum(abs(actuals[i] - self.targets[i]) for i in ALL_CATEGORY_IDS)
                if total_diff > 5:
                    for type_id in ALL_CATEGORY_IDS:
                        diff = actuals[type_id] - self.targets[type_id]
                        if diff > 0:
                            type_indices = np.where(offspring == type_id)[0]
                            to_convert = rng.choice(type_indices, size=diff, replace=False)
                            for other_type in ALL_CATEGORY_IDS:
                                if other_type != type_id and actuals[other_type] < self.targets[other_type]:
                                    needed = self.targets[other_type] - actuals[other_type]
                                    convert_count = min(needed, len(to_convert))
                                    if convert_count > 0:
                                        offspring[to_convert[:convert_count]] = other_type
                                        actuals[other_type] += convert_count
                                        actuals[type_id] -= convert_count
                                        to_convert = to_convert[convert_count:]
                                        if len(to_convert) == 0:
                                            break
                        elif diff < 0:
                            needed = -diff
                            for other_type in ALL_CATEGORY_IDS:
                                if other_type != type_id and actuals[other_type] > self.targets[other_type]:
                                    available = actuals[other_type] - self.targets[other_type]
                                    convert_count = min(needed, available)
                                    if convert_count > 0:
                                        other_indices = np.where(offspring == other_type)[0]
                                        to_convert = rng.choice(other_indices, size=convert_count, replace=False)
                                        offspring[to_convert] = type_id
                                        actuals[type_id] += convert_count
                                        actuals[other_type] -= convert_count
                                        needed -= convert_count
                                        if needed == 0:
                                            break

                X_off[o, k] = offspring

        return X_off


class FeasibleMutationAllCategories(Mutation):
    """Mutación para variables categóricas que intercambia tipos manteniendo números correctos"""

    def __init__(self, n_homes: int, n_health: int, n_education: int, n_greens: int, n_work: int, prob=0.7):
        super().__init__()
        self.targets = {
            0: n_homes,
            1: n_health,
            2: n_education,
            3: n_greens,
            4: n_work
        }
        self.prob = prob

    def _do(self, problem, X, **kwargs):
        X_mut = X.copy()
        rng = np.random.default_rng()

        for i in range(len(X)):
            if rng.random() < self.prob:
                x = X[i].copy()

                type1, type2 = rng.choice(ALL_CATEGORY_IDS, size=2, replace=False)

                type1_indices = np.where(x == type1)[0]
                type2_indices = np.where(x == type2)[0]

                n_swaps = max(1, int(min(len(type1_indices), len(type2_indices)) * 0.05))
                n_swaps = min(n_swaps, len(type1_indices), len(type2_indices))

                if n_swaps > 0:
                    swap1 = rng.choice(type1_indices, size=n_swaps, replace=False)
                    swap2 = rng.choice(type2_indices, size=n_swaps, replace=False)

                    x[swap1] = type2
                    x[swap2] = type1

                X_mut[i] = x

        return X_mut
