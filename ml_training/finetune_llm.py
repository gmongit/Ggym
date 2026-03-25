"""
Phase 4: QLoRA Fine-Tuning von Mistral-7B auf Google Colab.
Benötigt: transformers, peft, datasets, trl, bitsandbytes
pip install transformers peft datasets trl bitsandbytes accelerate
"""
import json
import os


def finetune(
    dataset_path: str = "ml_training/datasets/finetuning_dataset.json",
    base_model: str = "mistralai/Mistral-7B-Instruct-v0.3",
    output_dir: str = "ml_training/models/fittrack-coach-lora",
    hub_repo: str = "your-username/fittrack-coach",
):
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig, TrainingArguments
        from peft import LoraConfig, get_peft_model, TaskType
        from trl import SFTTrainer
        from datasets import load_dataset
    except ImportError:
        print("Bitte installiere: pip install transformers peft datasets trl bitsandbytes accelerate")
        return

    # 4-bit Quantisierung
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    print(f"Lade Basis-Modell: {base_model}")
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        quantization_config=bnb_config,
        device_map="auto",
    )

    # LoRA Konfiguration
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Dataset laden
    dataset = load_dataset("json", data_files=dataset_path, split="train")

    def format_prompt(example):
        return {
            "text": (
                f"[INST] {example['instruction']}\n\n{example['input']} [/INST] "
                f"{example['output']}"
            )
        }

    dataset = dataset.map(format_prompt)

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        warmup_steps=100,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=50,
        save_strategy="epoch",
        push_to_hub=bool(hub_repo),
        hub_model_id=hub_repo if hub_repo else None,
    )

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=512,
        tokenizer=tokenizer,
    )

    print("Starte Fine-Tuning...")
    trainer.train()
    trainer.save_model()
    print(f"Modell gespeichert: {output_dir}")


if __name__ == "__main__":
    finetune()
