"""
Phase 3.5: LSTM-basiertes Progressionsmodell.
Input: Sequenz der letzten 12 Sessions
Output: empfohlene Klasse (0-4) + nächster 1RM
"""
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from torch.utils.data import Dataset, DataLoader


class ProgressLSTM(nn.Module):
    def __init__(self, input_size: int = 6, hidden_size: int = 64, num_layers: int = 2, num_classes: int = 5):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.3,
        )
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(hidden_size * 2, num_classes)
        self.regressor = nn.Linear(hidden_size * 2, 1)

    def forward(self, x: torch.Tensor):
        # x shape: (batch, seq_len, input_size)
        lstm_out, _ = self.lstm(x)
        last_hidden = lstm_out[:, -1, :]  # Letzter Zeitschritt
        last_hidden = self.dropout(last_hidden)
        class_logits = self.classifier(last_hidden)
        next_1rm = self.regressor(last_hidden)
        return class_logits, next_1rm.squeeze(-1)


class WorkoutSequenceDataset(Dataset):
    def __init__(self, sequences: np.ndarray, labels: np.ndarray, next_1rms: np.ndarray):
        self.sequences = torch.FloatTensor(sequences)
        self.labels = torch.LongTensor(labels)
        self.next_1rms = torch.FloatTensor(next_1rms)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.sequences[idx], self.labels[idx], self.next_1rms[idx]


def prepare_sequences(df: pd.DataFrame, seq_len: int = 12) -> tuple:
    """
    Erstellt Sequenzen aus dem DataFrame.
    Features pro Session: [weight, reps, 1rm, volume, days_gap, bodyweight]
    """
    from generate_labels import epley_1rm

    sequences, labels, next_1rms = [], [], []

    for (user_id, exercise_name), group in df.groupby(["user_id", "exercise_name"]):
        group = group.sort_values("date")
        session_data = (
            group.groupby("date").agg(
                weight=("weight_kg", "max"),
                reps=("reps", "max"),
                volume=("weight_kg", lambda x: (x * group.loc[x.index, "reps"]).sum()),
                bodyweight=("bodyweight_kg", "mean"),
            ).reset_index()
        )
        session_data["1rm"] = session_data.apply(
            lambda r: epley_1rm(r["weight"], r["reps"]), axis=1
        )
        session_data["days_gap"] = session_data["date"].diff().dt.days.fillna(7)

        feature_cols = ["weight", "reps", "1rm", "volume", "days_gap", "bodyweight"]

        # Normalisieren
        for col in feature_cols:
            if session_data[col].std() > 0:
                session_data[col] = (session_data[col] - session_data[col].mean()) / session_data[col].std()

        values = session_data[feature_cols].values

        for i in range(seq_len, len(values) - 1):
            seq = values[i - seq_len:i]
            next_1rm_val = session_data.iloc[i + 1]["1rm"]
            curr_1rm = session_data.iloc[i]["1rm"]
            pct = (next_1rm_val - curr_1rm) / (abs(curr_1rm) + 1e-6)

            if pct >= 0.025:
                label = 1
            elif pct >= 0.01:
                label = 2
            elif pct <= -0.05:
                label = 3
            else:
                label = 0

            sequences.append(seq)
            labels.append(label)
            next_1rms.append(next_1rm_val)

    return np.array(sequences), np.array(labels), np.array(next_1rms)


def train_lstm(
    data_path: str = "ml_training/datasets/raw/synthetic_data.parquet",
    output_path: str = "ml_training/models/progress_lstm.pt",
    epochs: int = 30,
    batch_size: int = 256,
    lr: float = 1e-3,
):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training auf: {device}")

    df = pd.read_parquet(data_path)
    print("Erstelle Sequenzen...")
    sequences, labels, next_1rms = prepare_sequences(df)
    print(f"Sequenzen: {len(sequences):,}")

    split = int(0.8 * len(sequences))
    train_ds = WorkoutSequenceDataset(sequences[:split], labels[:split], next_1rms[:split])
    val_ds = WorkoutSequenceDataset(sequences[split:], labels[split:], next_1rms[split:])

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size)

    model = ProgressLSTM().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    cls_criterion = nn.CrossEntropyLoss()
    reg_criterion = nn.MSELoss()

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0
        for seqs, lbls, nrms in train_loader:
            seqs, lbls, nrms = seqs.to(device), lbls.to(device), nrms.to(device)
            optimizer.zero_grad()
            cls_out, reg_out = model(seqs)
            loss = cls_criterion(cls_out, lbls) + 0.1 * reg_criterion(reg_out, nrms)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        if epoch % 5 == 0:
            model.eval()
            correct, total = 0, 0
            with torch.no_grad():
                for seqs, lbls, _ in val_loader:
                    seqs, lbls = seqs.to(device), lbls.to(device)
                    cls_out, _ = model(seqs)
                    correct += (cls_out.argmax(1) == lbls).sum().item()
                    total += len(lbls)
            print(f"Epoch {epoch}/{epochs} – Loss: {total_loss/len(train_loader):.4f} – Val Acc: {correct/total:.3f}")

    import os
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    torch.save(model.state_dict(), output_path)
    print(f"LSTM gespeichert: {output_path}")
    return model


if __name__ == "__main__":
    train_lstm()
