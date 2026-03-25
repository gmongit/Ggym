import numpy as np
from typing import List, Tuple

def cusum_detection(values: List[float], threshold: float = 2.0, drift: float = 0.5) -> Tuple[bool, int]:
    """
    CUSUM algorithm for change point detection.
    Returns (plateau_detected, change_point_index)
    """
    if len(values) < 3:
        return False, 0

    mean_val = np.mean(values[:3])
    std_val = max(np.std(values), 0.01)

    cusum_pos = 0.0
    cusum_neg = 0.0
    change_point = 0

    for i, val in enumerate(values):
        normalized = (val - mean_val) / std_val
        cusum_pos = max(0, cusum_pos + normalized - drift)
        cusum_neg = max(0, cusum_neg - normalized - drift)

        if cusum_pos > threshold or cusum_neg > threshold:
            change_point = i
            return True, change_point

    return False, len(values)

def detect_plateau(session_1rms: List[float]) -> dict:
    """
    Analyze a list of 1RM values to detect plateau.
    Returns plateau probability and weeks stagnating.
    """
    if len(session_1rms) < 3:
        return {"plateau_probability": 0.0, "weeks_stagnating": 0}

    recent = session_1rms[-6:]
    max_recent = max(recent)
    min_recent = min(recent)
    variation = (max_recent - min_recent) / max(max_recent, 0.01)

    if variation < 0.02:
        plateau_prob = 0.9
    elif variation < 0.05:
        plateau_prob = 0.6
    else:
        plateau_prob = 0.2

    weeks_stagnating = 0
    best_ever = max(session_1rms)
    for val in reversed(session_1rms):
        if val >= best_ever * 0.99:
            break
        weeks_stagnating += 1

    change_detected, _ = cusum_detection(recent)
    if not change_detected:
        plateau_prob = min(1.0, plateau_prob + 0.1)

    return {
        "plateau_probability": round(plateau_prob, 2),
        "weeks_stagnating": weeks_stagnating
    }
